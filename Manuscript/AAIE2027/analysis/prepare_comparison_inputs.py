"""Describe candidate comparison inputs without fitting models or changing raw data.

Run from any directory with Python 3 and Node.js. Outputs aggregates only.
Names, authentication IDs and individual student identifiers are never written.
Candidate selection and diagnostic labels are not an approved analysis dataset.
"""
import collections
import csv
import datetime as dt
import hashlib
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
DATA = ROOT / 'fromSUpabase'
tables = {}
fingerprints = {}
for name in ('students', 'responses', 'content_items', 'knowledge_components'):
    p = DATA / (name + '_rows.csv')
    with p.open(newline='', encoding='utf-8-sig') as stream:
        tables[name] = list(csv.DictReader(stream))
    fingerprints[name] = hashlib.sha256(p.read_bytes()).hexdigest()

students = {r['id']: r for r in tables['students']}
items = {r['id']: r for r in tables['content_items']}
responses = tables['responses']
active = {r['student_id'] for r in responses}
dates = {'2025-07-02', '2025-07-03', '2025-07-04'}
local_tz = dt.timezone(dt.timedelta(hours=8))
window = [r for r in responses if dt.datetime.fromisoformat(r['createdAt']).astimezone(local_tz).date().isoformat() in dates]
candidate = [r for r in window if json.loads(r['interaction_data']).get('quiz_mode') == 'sequential'
             and json.loads(r['interaction_data']).get('practice_mode') is not True
             and students.get(r['student_id'], {}).get('grade_level') in ('3', '4')]


def profile(rows):
    ids = {r['student_id'] for r in rows}
    pairs = collections.Counter((r['student_id'], items[r['content_item_id']]['knowledge_component_id']) for r in rows)
    return {
        'records': len(rows), 'student_ids': len(ids),
        'account_grade_counts': dict(collections.Counter(students[s]['grade_level'] for s in ids if s in students)),
        'stored_correct_counts': dict(collections.Counter(r['correct'] or 'NULL' for r in rows)),
        'explicit_practice_rows': sum(json.loads(r['interaction_data']).get('practice_mode') is True for r in rows),
        'quiz_mode_counts': dict(collections.Counter(str(json.loads(r['interaction_data']).get('quiz_mode', 'MISSING')) for r in rows)),
        'student_kc_sequences': len(pairs),
        'candidate_subsequent_targets_after_first_per_student_kc': sum(v - 1 for v in pairs.values()),
        'observed_items': len({r['content_item_id'] for r in rows}),
        'observed_kcs': len({items[r['content_item_id']]['knowledge_component_id'] for r in rows}),
    }


source_info = {}
validator_counts = {}
for ref in ('0c407d0', '339f043'):
    commit = subprocess.check_output(['git', 'rev-parse', ref], cwd=ROOT, text=True).strip()
    source_info[ref] = {'commit': commit, 'files': {}}
    for path in ('client/server/utils/bktAlgorithm.js', 'netlify/functions/api.js', 'client/src/components/student/QuizView.js'):
        raw = subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT)
        source_info[ref]['files'][path] = {'sha256': hashlib.sha256(raw).hexdigest()}
        if path.endswith('/QuizView.js'):
            text = raw.decode()
            start = text.index('  const validateAnswer = ')
            end = text.index('\n  const handleOptionSelect', start)
            function = text[start:end].strip()
            source_info[ref]['validator_function_sha256'] = hashlib.sha256(function.encode()).hexdigest()
    source = subprocess.check_output(['git', 'show', commit + ':client/src/components/student/QuizView.js'], cwd=ROOT).decode()
    start = source.index('  const validateAnswer = ')
    end = source.index('\n  const handleOptionSelect', start)
    function = source[start:end].strip()
    inputs = [{'group': label, 'stored': row['correct'] or 'NULL', 'answer': row['answer'],
               'key': items[row['content_item_id']]['correct_answer']}
              for label, group in [('collection_window', window), ('candidate_sequential', candidate)]
              for row in group]
    js = ('const fs=require("fs");' + function +
          'const rows=JSON.parse(fs.readFileSync(0,"utf8")); const counts={};'
          'for(const r of rows){const k=r.group+":"+r.stored+":"+validateAnswer(r.answer,r.key);'
          'counts[k]=(counts[k]||0)+1;} console.log(JSON.stringify(counts));')
    run = subprocess.run(['node', '-e', js], input=json.dumps(inputs), capture_output=True, text=True, check=True)
    validator_counts[ref] = json.loads(run.stdout)

report = {
    'date': '2026-10-18', 'status': 'Preparation only; protocol approval pending; no model evaluation performed.',
    'fingerprints': fingerprints,
    'student_accounts': len(students),
    'duplicate_student_ids': len(tables['students']) - len(students),
    'accounts_with_exported_responses': len(set(students) & active),
    'accounts_without_exported_responses': len(set(students) - active),
    'responding_ids_absent_from_students': len(active - set(students)),
    'all_exported_responses': profile(responses),
    'confirmed_date_window_UTC_plus_8': profile(window),
    'candidate_sequential_nonpractice_grade3_4': profile(candidate),
    'source_revisions': source_info,
    'validator_diagnostics_not_adopted_labels': validator_counts,
    'privacy': 'Input students CSV contains name and auth_id. No values from these fields or individual IDs are output.',
    'limitations': ['Study eligibility and test/demo status remain unverified.',
                    'Historical deployment equivalence is not established by Git dates.',
                    'Proposed derived labels are application-graded outcomes, not independent mathematical adjudication.',
                    'Candidate filters and outcome reconstruction require protocol approval.'],
}
for name, digest in fingerprints.items():
    assert hashlib.sha256((DATA / (name + '_rows.csv')).read_bytes()).hexdigest() == digest
out = HERE / 'comparison_input_summary.json'
out.write_text(json.dumps(report, indent=2, sort_keys=True) + '\n')
macros = {
    'AccountCount': len(students), 'ActiveAccountCount': len(active),
    'InactiveAccountCount': len(set(students) - active),
    'CollectionResponseCount': f'{len(window):,}',
    'CollectionAccountCount': len({r['student_id'] for r in window}),
    'CandidateResponseCount': f'{len(candidate):,}',
    'CandidateAccountCount': len({r['student_id'] for r in candidate}),
    'CandidateTargetCount': f"{report['candidate_sequential_nonpractice_grade3_4']['candidate_subsequent_targets_after_first_per_student_kc']:,}",
}
(HERE.parent / 'comparison_numbers.tex').write_text(
    '% Generated preparation counts; no model results.\n' +
    ''.join('\\newcommand{\\' + k + '}{' + str(v) + '}\n' for k, v in macros.items()))
print(json.dumps({k: report[k] for k in ('student_accounts', 'accounts_with_exported_responses',
                                       'accounts_without_exported_responses', 'candidate_sequential_nonpractice_grade3_4',
                                       'validator_diagnostics_not_adopted_labels')}, indent=2))
print('Aggregate summary and comparison_numbers.tex written. All four raw file fingerprints unchanged.')
