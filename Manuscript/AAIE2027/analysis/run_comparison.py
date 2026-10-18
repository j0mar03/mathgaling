"""Execute the author-approved offline comparison and save aggregates only.

Run: python3 Manuscript/AAIE2027/analysis/run_comparison.py
Python standard library and Node.js only. No live DB, network, source edits,
raw-data writes, parameter fitting, or stored answer-level prediction outputs.
"""
import collections
import csv
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import platform
import random
import statistics
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
EXPECTED = {
    'responses': 'fb4bf972780e96dcf4f6be74d83333603c035656016b4272b1b28ea42aa9b9c7',
    'content_items': 'c56af9da4536024403c85ac7e3d8907bb21ae463270a30b408a81d6be45eb311',
    'knowledge_components': 'b90be9a767dd23ffc751301f69678d843e41b6cbd71af2a96a07e1fb9a6b550b',
    'students': 'e7e63e88090d4ff83fef4722902abfec737d33c6746cfa66429f0ade467c176e',
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def auc(ys, ps):
    positive = sum(ys)
    negative = len(ys) - positive
    if not positive or not negative:
        return None
    ordered = sorted(zip(ps, ys))
    i = 0
    positive_ranks = 0.
    while i < len(ordered):
        j = i + 1
        while j < len(ordered) and ordered[j][0] == ordered[i][0]:
            j += 1
        rank = ((i + 1) + j) / 2
        positive_ranks += rank * sum(y for _, y in ordered[i:j])
        i = j
    return (positive_ranks - positive * (positive + 1) / 2) / (positive * negative)


def losses(rows, model):
    squared, logarithmic = [], []
    for row in rows:
        y, p = row['y'], row[model]
        assert y in (0, 1) and 0 < p < 1
        squared.append((p - y) ** 2)
        logarithmic.append(-(y * math.log(p) + (1 - y) * math.log(1 - p)))
    return squared, logarithmic


def percentile(values, fraction):
    ordered = sorted(values)
    at = (len(ordered) - 1) * fraction
    lower = int(at)
    upper = min(lower + 1, len(ordered) - 1)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (at - lower)


def bootstrap(clusters, replicates, seed):
    rng = random.Random(seed)
    result = []
    for _ in range(replicates):
        draw = rng.choices(clusters, k=len(clusters))
        result.append(sum(c['difference_sum'] for c in draw) / sum(c['n'] for c in draw))
    return [percentile(result, .025), percentile(result, .975)]


# Metric verification uses known synthetic examples, never study records.
assert abs(auc([0, 0, 1, 1], [.1, .4, .35, .8]) - .75) < 1e-12
assert auc([0, 1], [.5, .5]) == .5
assert auc([0, 1], [.1, .9]) == 1
assert auc([0, 1], [.9, .1]) == 0
assert auc([1, 1], [.2, .8]) is None
sq, ll = losses([{'y': 1, 'bkt': .8}, {'y': 0, 'bkt': .2}], 'bkt')
assert abs(statistics.mean(sq) - .04) < 1e-12
assert abs(statistics.mean(ll) + math.log(.8)) < 1e-12
assert bootstrap([{'n': 2, 'difference_sum': 0}, {'n': 4, 'difference_sum': 0}], 100, 1) == [0, 0]

tables = {}
for name, expected in EXPECTED.items():
    p = ROOT / 'fromSUpabase' / (name + '_rows.csv')
    if digest(p) != expected:
        raise SystemExit('Input snapshot changed; review protocol applicability before evaluating.')
    with p.open(newline='', encoding='utf-8-sig') as stream:
        tables[name] = list(csv.DictReader(stream))

students = {r['id']: r for r in tables['students']}
accounts = {s: i + 1 for i, s in enumerate(sorted(students, key=int))}
items = {r['id']: r for r in tables['content_items']}
tz = dt.timezone(dt.timedelta(hours=8))
date_window = {'2025-07-02', '2025-07-03', '2025-07-04'}
events = []
for row in tables['responses']:
    when = dt.datetime.fromisoformat(row['createdAt'])
    if when.astimezone(tz).date().isoformat() not in date_window:
        continue
    if students.get(row['student_id'], {}).get('grade_level') not in ('3', '4'):
        continue
    interaction = json.loads(row['interaction_data'])
    assert 'recentPerformance' not in interaction, 'Unexpected precomputed context needs provenance review'
    primary = interaction.get('quiz_mode') == 'sequential' and interaction.get('practice_mode') is not True
    assert row['correct'] in ('true', 'false', '')
    events.append({
        'account': accounts[row['student_id']], 'order': int(row['id']),
        'ts': int(when.timestamp() * 1000), 'item': int(row['content_item_id']),
        'primary': primary, 'storedCorrect': None if row['correct'] == '' else row['correct'] == 'true',
        'answer': row['answer'], 'time': float(row['time_spent']), 'interaction': interaction,
    })
events.sort(key=lambda e: (e['ts'], e['order']))
assert len(events) == 3333 and sum(e['primary'] for e in events) == 3328
used_items = {e['item'] for e in events}
input_items = [{'id': int(r['id']), 'knowledge_component_id': int(r['knowledge_component_id']),
                'difficulty': float(r['difficulty']) if r['difficulty'] else None,
                'correct_answer': r['correct_answer']}
               for r in tables['content_items'] if int(r['id']) in used_items]
used_kcs = {r['knowledge_component_id'] for r in input_items}
input_kcs = [{'id': int(r['id']), 'metadata': json.loads(r['metadata'])}
             for r in tables['knowledge_components'] if int(r['id']) in used_kcs]
assert all(r['metadata']['bktParams'] == {'pL0': .3, 'pT': .09, 'pS': .1, 'pG': .2} for r in input_kcs)

payload = {'items': input_items, 'kcs': input_kcs, 'events': events, 'assertPrimaryLabelAgreement': True}
run = subprocess.run(['node', str(HERE / 'replay_models.cjs')], cwd=ROOT,
                     input=json.dumps(payload), capture_output=True, text=True)
if run.returncode:
    raise SystemExit('Offline replay failed: ' + run.stderr[:1500])
replay = json.loads(run.stdout)
rows = replay['predictions']
assert replay['checks']['passed']
assert len(rows) == 2934
assert replay['diagnostics']['primary'] == 3328 and replay['diagnostics']['sequences'] == 394
assert replay['diagnostics']['derivedPositive'] == 3068 and replay['diagnostics']['derivedNegative'] == 260
by_account = collections.defaultdict(list)
for row in rows:
    by_account[row['account']].append(row)
assert len(by_account) == 92

models = {}
for name in ('bkt', 'hybrid'):
    squared, logarithmic = losses(rows, name)
    account_losses = [losses(group, name) for group in by_account.values()]
    models[name] = {
        'brier': statistics.mean(squared), 'log_loss': statistics.mean(logarithmic),
        'pooled_auc': auc([r['y'] for r in rows], [r[name] for r in rows]),
        'equal_account_brier': statistics.mean(statistics.mean(a) for a, b in account_losses),
        'equal_account_log_loss': statistics.mean(statistics.mean(b) for a, b in account_losses),
        'mean_prediction': statistics.mean(r[name] for r in rows),
        'prediction_min': min(r[name] for r in rows), 'prediction_max': max(r[name] for r in rows),
    }
clusters = []
for group in by_account.values():
    brier_b, _ = losses(group, 'bkt')
    brier_h, _ = losses(group, 'hybrid')
    clusters.append({'n': len(group), 'difference_sum': sum(h - b for h, b in zip(brier_h, brier_b))})
delta = models['hybrid']['brier'] - models['bkt']['brier']
ci = bootstrap(clusters, 2000, 20261018)
equally_weighted_delta = models['hybrid']['equal_account_brier'] - models['bkt']['equal_account_brier']
report = {
    'date': '2026-10-18', 'protocol_approval': 'Explicit user approval in this session, 2026-10-18',
    'parameters': {'pL0': .3, 'pT': .09, 'pS': .1, 'pG': .2},
    'counts': {'window_rows': len(events), 'primary_rows': 3328, 'context_only_practice_rows': 5,
               'student_kc_sequences': 394, 'scored_targets': len(rows), 'account_clusters': len(by_account),
               'scored_positive': sum(r['y'] for r in rows), 'scored_negative': sum(1-r['y'] for r in rows)},
    'models': models,
    'comparison': {'brier_difference_hybrid_minus_bkt': delta,
                    'paired_account_bootstrap_95_percentile_interval': ci,
                    'bootstrap_replicates': 2000, 'bootstrap_seed': 20261018,
                    'bootstrap_rng': 'Python random.Random / Mersenne Twister, choices with replacement',
                    'percentile_interpolation': 'linear at (n-1)*q',
                    'equal_account_brier_difference_hybrid_minus_bkt': equally_weighted_delta,
                    'accounts_with_lower_hybrid_brier': sum(c['difference_sum'] < 0 for c in clusters),
                    'accounts_with_higher_hybrid_brier': sum(c['difference_sum'] > 0 for c in clusters),
                    'accounts_with_equal_brier': sum(c['difference_sum'] == 0 for c in clusters)},
    'checks': {'source_replay_fixture_checks': replay['checks'], 'metric_known_answer_checks_passed': True,
                'paired_targets_and_count_assertions_passed': True},
    'replay_diagnostics': replay['diagnostics'],
    'provenance': {**replay['provenance'], 'python': platform.python_version(),
                    'input_sha256': EXPECTED,
                    'analysis_script_sha256': {'run_comparison.py': digest(Path(__file__)),
                                               'replay_models.cjs': digest(HERE / 'replay_models.cjs')}},
    'implementation_notes': [
        'Pure source functions and update wrapper extracted from pinned Git blobs; application modules never imported.',
        'Inert in-memory collections emulate only the inspected read/update interfaces; no DB engine or network is used.',
        'Replay clock equals response event time at millisecond precision; responses inserted before update, never future context.',
        'Recent context retains original stored truthiness; excluded practice records may enter context but never update mastery.',
        'Descending-session grouping behavior is preserved, not repaired.',
        'Fixed parameters, first-event initialization, identical subsequent targets; no fitting, selection, or tuning.',
        'Recorded cumulative time passed unchanged; no time repair or additional ablation performed.',
        'Prediction-level values and account mappings remain in process memory; only aggregates are written.',
    ],
    'limitations': ['Account eligibility and test/demo status not independently verified.',
                    'Historical deployment and answer-key provenance not established.',
                    'Outcomes are application-validator derived; independent mathematical grading not performed.',
                    'Results concern this configured offline replay, not learning gains or counterfactual adaptive policies.',
                    'Uncertainty is conditional on account IDs as clusters.'],
}
for name, expected in EXPECTED.items():
    assert digest(ROOT / 'fromSUpabase' / (name + '_rows.csv')) == expected
(HERE / 'comparison_results.json').write_text(json.dumps(report, indent=2, sort_keys=True) + '\n')
macros = {
    'ScoredTargets': f'{len(rows):,}', 'ScoredPositive': f"{report['counts']['scored_positive']:,}",
    'ScoredNegative': report['counts']['scored_negative'],
    'BktBrier': f"{models['bkt']['brier']:.5f}", 'HybridBrier': f"{models['hybrid']['brier']:.5f}",
    'BktLogLoss': f"{models['bkt']['log_loss']:.5f}", 'HybridLogLoss': f"{models['hybrid']['log_loss']:.5f}",
    'BktAUC': f"{models['bkt']['pooled_auc']:.5f}", 'HybridAUC': f"{models['hybrid']['pooled_auc']:.5f}",
    'BktEqualBrier': f"{models['bkt']['equal_account_brier']:.5f}",
    'HybridEqualBrier': f"{models['hybrid']['equal_account_brier']:.5f}",
    'BktEqualLogLoss': f"{models['bkt']['equal_account_log_loss']:.5f}",
    'HybridEqualLogLoss': f"{models['hybrid']['equal_account_log_loss']:.5f}",
    'BrierDelta': f'{delta:+.5f}', 'BrierCILower': f'{ci[0]:+.5f}', 'BrierCIUpper': f'{ci[1]:+.5f}',
    'EqualBrierDelta': f'{equally_weighted_delta:+.5f}',
    'LowerHybridAccounts': report['comparison']['accounts_with_lower_hybrid_brier'],
    'HigherHybridAccounts': report['comparison']['accounts_with_higher_hybrid_brier'],
    'TiedAccounts': report['comparison']['accounts_with_equal_brier'],
    'BrierRelativeChange': f"{100*delta/models['bkt']['brier']:+.2f}",
}
(HERE.parent / 'results_numbers.tex').write_text('% Generated measured results; do not edit manually.\n' +
    ''.join('\\newcommand{\\' + k + '}{' + str(v) + '}\n' for k, v in macros.items()))
print(json.dumps({'counts': report['counts'], 'models': models, 'comparison': report['comparison'],
                  'checks_passed': True, 'raw_file_hashes_unchanged': True}, indent=2))
