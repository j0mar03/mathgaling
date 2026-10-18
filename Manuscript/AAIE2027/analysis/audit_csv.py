"""Read-only CSV audit. Run from the MathGaling repository root.

Outputs aggregate JSON only. Does not import application modules or access a DB.
Current client answer validation is a diagnostic, not an adopted relabeling rule.
"""
import collections
import csv
import datetime as dt
import hashlib
import json
import platform
from pathlib import Path
import re
import statistics
import subprocess

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / 'fromSUpabase'


def distribution(values):
    return dict(collections.Counter(str(v) for v in values))


def summary(values):
    values = sorted(values)
    if not values:
        return {'n': 0}
    def quantile(p):
        index = (len(values) - 1) * p
        lower = int(index)
        upper = min(lower + 1, len(values) - 1)
        return values[lower] + (values[upper] - values[lower]) * (index - lower)
    return dict(n=len(values), min=values[0], median=statistics.median(values),
                p25=quantile(.25), p75=quantile(.75), p95=quantile(.95),
                max=values[-1], mean=statistics.mean(values))


def timestamp(value):
    return dt.datetime.fromisoformat(value.replace('Z', '+00:00'))


tables = {}
inventory = {}
for name in ('responses', 'content_items', 'knowledge_components'):
    path = DATA / (name + '_rows.csv')
    with path.open(newline='', encoding='utf-8-sig') as stream:
        reader = csv.DictReader(stream)
        rows = list(reader)
        columns = reader.fieldnames
    tables[name] = rows
    inventory[name] = {
        'path': path.relative_to(ROOT).as_posix(),
        'bytes': path.stat().st_size,
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'rows': len(rows), 'columns': columns,
        'missing_by_column': {key: sum(row.get(key) in ('', None, 'null', 'NULL')
                                       for row in rows) for key in columns},
        'malformed_rows': sum(None in row or any(v is None for v in row.values())
                              for row in rows),
        'duplicate_ids': len(rows) - len({row['id'] for row in rows}),
        'duplicate_full_rows': len(rows) - len({json.dumps(row, sort_keys=True)
                                               for row in rows}),
    }

responses = tables['responses']
items = {row['id']: row for row in tables['content_items']}
kcs = {row['id']: row for row in tables['knowledge_components']}
interactions = [json.loads(row['interaction_data']) for row in responses]
students = collections.defaultdict(list)
pairs = collections.Counter()
for row in responses:
    students[row['student_id']].append(row)
    pairs[(row['student_id'], items[row['content_item_id']]['knowledge_component_id'])] += 1

source_path = ROOT / 'client/src/components/student/QuizView.js'
source = source_path.read_text()
start = source.index('  const validateAnswer = ')
end = source.index('\n  const handleOptionSelect', start)
function = source[start:end].strip()
diagnostic_input = [dict(label=row['correct'] or 'NULL', answer=row['answer'],
                         key=items[row['content_item_id']]['correct_answer'],
                         practice=json.loads(row['interaction_data']).get('practice_mode') is True)
                    for row in responses]
js = ('const fs = require("fs");\n' + function + '\n'
      'const rows=JSON.parse(fs.readFileSync(0,"utf8")); const counts={};'
      'for (const r of rows) {'
      ' const key=r.label+":"+validateAnswer(r.answer,r.key)+":practice="+r.practice;'
      ' counts[key]=(counts[key]||0)+1; }'
      'console.log(JSON.stringify(counts));')
validator = subprocess.run(['node', '-e', js], input=json.dumps(diagnostic_input),
                           capture_output=True, text=True, check=True)

sessions = []
within_session_gaps = []
for rows in students.values():
    rows.sort(key=lambda row: (timestamp(row['createdAt']), int(row['id'])))
    current = []
    previous = None
    for row in rows:
        current_time = timestamp(row['createdAt'])
        gap = (current_time - previous).total_seconds() if previous else None
        if gap is not None and gap > 1800:
            sessions.append(current)
            current = []
        elif gap is not None:
            within_session_gaps.append(gap)
        current.append(row)
        previous = current_time
    if current:
        sessions.append(current)

per_day = {}
for day in sorted({timestamp(row['createdAt']).date().isoformat() for row in responses}):
    rows = [row for row in responses if timestamp(row['createdAt']).date().isoformat() == day]
    per_day[day] = {
        'rows': len(rows), 'student_ids': len({row['student_id'] for row in rows}),
        'blank_correct': sum(not row['correct'] for row in rows),
    }

privacy = {}
for name, rows in tables.items():
    privacy[name] = {}
    for label, pattern in (
        ('email_pattern_rows', r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'),
        ('private_key_pattern_rows', r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----'),
        ('token_prefix_pattern_rows', r'\b(?:sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})'),
    ):
        privacy[name][label] = sum(bool(re.search(pattern, json.dumps(row))) for row in rows)

report = {
    'audit_date': '2026-10-18',
    'source_fingerprints': {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in ['client/src/components/student/QuizView.js', 'client/src/components/student/PracticeQuizView.js', 'client/server/utils/bktAlgorithm.js', 'netlify/functions/api.js']},
    'scope': 'Local CSV and source inspection; no database access, relabeling, exclusions, fitting or predictive evaluation.',
    'versions': {'python': platform.python_version(), 'node': subprocess.check_output(['node', '--version'], text=True).strip()},
    'inventory': inventory,
    'response_coverage': {
        'student_ids_not_verified_people': len(students),
        'observed_item_ids': len({row['content_item_id'] for row in responses}),
        'observed_kc_ids': len({items[row['content_item_id']]['knowledge_component_id'] for row in responses}),
        'missing_item_links': sum(row['content_item_id'] not in items for row in responses),
        'missing_kc_links': sum(items[row['content_item_id']]['knowledge_component_id'] not in kcs for row in responses),
        'items_with_missing_kc_links_in_entire_catalog': sum(row['knowledge_component_id'] not in kcs for row in items.values()),
        'responses_by_item_grade_not_confirmed_student_grade': distribution(kcs[items[row['content_item_id']]['knowledge_component_id']]['grade_level'] for row in responses),
        'responses_by_item_difficulty': distribution(items[row['content_item_id']]['difficulty'] for row in responses),
        'responses_by_item_type': distribution(items[row['content_item_id']]['type'] for row in responses),
        'responses_missing_item_difficulty': sum(not items[row['content_item_id']]['difficulty'] for row in responses),
        'correct_stored': distribution(row['correct'] or 'NULL' for row in responses),
        'records_by_day_UTC': per_day,
        'per_student_rows': summary([len(rows) for rows in students.values()]),
        'student_kc_sequences': len(pairs),
        'student_kc_sequence_lengths': summary(list(pairs.values())),
        'student_kc_length_frequencies': distribution(pairs.values()),
        'after_first_opportunities_unfiltered': sum(count - 1 for count in pairs.values()),
        'repeat_student_item_records': len(responses) - len({(row['student_id'], row['content_item_id']) for row in responses}),
        'duplicate_student_timestamps': len(responses) - len({(row['student_id'], timestamp(row['createdAt'])) for row in responses}),
    },
    'interaction_data': {
        'key_presence': dict(collections.Counter(key for obj in interactions for key in obj)),
        'attempt_values': distribution(obj.get('attempts', 'MISSING') for obj in interactions),
        'hint_request_values': distribution(obj.get('hintRequests', 'MISSING') for obj in interactions),
        'practice_flag_values': distribution(obj.get('practice_mode', 'MISSING') for obj in interactions),
        'quiz_mode_values': distribution(obj.get('quiz_mode', 'MISSING') for obj in interactions),
    },
    'time_diagnostics': {
        'stored_time_units_unconfirmed_historically': summary([float(row['time_spent']) for row in responses]),
        'sessions_using_descriptive_30_minute_gap_only': len(sessions),
        'within_session_interrecord_seconds': summary(within_session_gaps),
        'within_session_gaps_under_two_seconds': sum(gap < 2 for gap in within_session_gaps),
        'successive_stored_times': distribution(
            'increase' if float(b['time_spent']) > float(a['time_spent']) else
            'decrease' if float(b['time_spent']) < float(a['time_spent']) else 'equal'
            for session in sessions for a, b in zip(session, session[1:])),
    },
    'answer_diagnostics_not_relabeling': {
        'current_client_validator_counts': json.loads(validator.stdout),
        'current_client_source_sha256': hashlib.sha256(source_path.read_bytes()).hexdigest(),
        'stored_true_without_exact_current_key_match': sum(row['correct'] == 'true' and row['answer'] != items[row['content_item_id']]['correct_answer'] for row in responses),
        'multiple_choice_items_with_key_absent_from_options_exact_string': sum(row['type'] == 'multiple_choice' and str(row['correct_answer']) not in [str(v) for v in json.loads(row['options'])] for row in items.values()),
        'responses_to_items_with_key_absent_from_options_exact_string': sum(str(items[row['content_item_id']]['correct_answer']) not in [str(v) for v in json.loads(items[row['content_item_id']]['options'])] for row in responses),
        'item_updates_later_than_response_according_to_exported_timestamps': sum(timestamp(items[row['content_item_id']]['updatedAt']) > timestamp(row['createdAt']) for row in responses),
        'warning': 'Matching the current client validator is not independent mathematical validation or proof of historical deployment behavior.',
    },
    'kc_bkt_parameter_sets': distribution(json.dumps(json.loads(row['metadata']).get('bktParams'), sort_keys=True) for row in kcs.values()),
    'privacy_pattern_screen_not_anonymization_certification': privacy,
    'git_exports_ignored': {path.relative_to(ROOT).as_posix(): subprocess.run(['git', 'check-ignore', '-q', '--', str(path.relative_to(ROOT))], capture_output=True).returncode == 0 for path in sorted(DATA.glob('*.csv'))},
    'limitations': [
        'Distinct IDs do not establish participant eligibility, independent people, or study cohort.',
        'User reports real student records and ethics approval; approval document and cohort mapping were not inspected.',
        'Historical deployed commit and historical answer keys are not yet documented.',
        'Current Netlify and Express mastery implementations differ.',
        'Current client timer does not reset on each question; stored time cannot yet be used as per-item latency.',
        'Null correctness must not be automatically changed to false.',
        'Attempts are constant where recorded and cannot establish retry behavior.',
        'No predictive performance, learning effect, calibrated parameters, or publication outcome is established.',
    ],
}
print(json.dumps(report, indent=2, sort_keys=True))
