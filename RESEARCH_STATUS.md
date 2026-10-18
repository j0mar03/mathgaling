# Research/development status: MathGaling

## Last Updated

2026-10-18 (Asia/Shanghai), session close: approved offline comparison and manuscript preparation. No live application/database validation or submission.

## Current Phase

Preparing an anonymous full-paper submission to AAIE2027, titled **Do Fuzzy Adjustments Improve Bayesian Knowledge Tracing in an Elementary Mathematics Intelligent Tutoring System?** The approved retrospective fixed-parameter comparison has been executed and the manuscript reports its measured findings. Submission is not yet finalized; no submission has been made in this session. Current production deployment remains unverified.

## Research Completed This Session

- Inspected the local implementation and fetched Git history without merging, pulling, checking out or discarding work. Local HEAD remains `d2d6f89`; fetched `origin/main` is `339f043` (July 12, 2025). The replay pins pre-collection commit `0c407d010d9dd5f1cb2a0eba42b5c0452c22e581`; the inspected Express BKT utility is byte-identical at these two historical revisions. The Netlify path uses a different update; historical deployment parity is not established.
- Read four protected local Supabase exports in `fromSUpabase/`: 3,710 responses, 720 content items, 76 KCs and 111 student-account records. Ninety-six accounts have exported responses. Input hashes are recorded in `Manuscript/AAIE2027/analysis/comparison_results.json`; originals were not modified.
- The investigator confirmed actual collection on July 2--4, 2025 and reported ethics approval covering the follow-up. Approval body/reference/date, consent/assent details, collection setting and roster reconciliation are **Not yet documented**. These are investigator confirmations, not independent verification of an approval letter or participant roster.
- The user explicitly approved `Manuscript/AAIE2027/COMPARISON_PROTOCOL.txt` before evaluation. Primary selection retains 3,328 sequential nonpractice responses from 92 Grade 3--4 account identifiers, 153 items and 14 KCs. Initial update-only observations in 394 student--KC sequences leave 2,934 scored subsequent-answer targets (2,705 positive; 229 negative).
- A separate in-memory outcome follows the historical application validator. Raw correctness fields remain unchanged. Recorded cumulative time, original wrapper context and existing session behavior were preserved; no parameter fitting, threshold changes, feature repair or post-result tuning was performed.
- Isolated source-replay fixtures, prediction-order/prefix checks and known-answer metric checks passed during execution. The run used Python 3.11.8 and Node.js 22.17.0. Tests do not establish correctness of a live deployment, the independent mathematical validity of labels or participant eligibility.

## Measured Comparison

| Metric | Standard BKT | BKT plus implemented adjustment |
|---|---:|---:|
| Brier score | 0.09147 | 0.09222 |
| Natural-log loss | 0.32895 | 0.33001 |
| Pooled AUROC | 0.48840 | 0.49046 |

Hybrid-minus-BKT Brier difference: **+0.00074**, paired account-cluster bootstrap 95% interval **[-0.00038, +0.00193]**, 2,000 replicates, seed 20261018. Equal-account probability losses also favor BKT. The replay provides **no clear evidence of predictive benefit** under the approved fixed configuration. It does not establish equivalence, universal failure of fuzzy methods, historical online use, or learning gains. Full precision and provenance: `Manuscript/AAIE2027/analysis/comparison_results.json`.

## Manuscript and Submission Materials

- `Manuscript/AAIE2027/main.tex` and `references.bib`: comparative draft with actual results and 21 cited sources, including Ruiz's earlier IAFOR publication (ACE2025 proceedings, publication year 2026; DOI `10.22492/issn.2186-5892.2026.131`). Earlier teacher ratings are not treated as new predictive results.
- `figures/diagrams.md`: two compact four-row Mermaid figures. No rendered figure exports exist locally. The earlier local `build/main.pdf` is the superseded log-audit paper; it must not be submitted as the current comparison. No current comparative PDF was compiled in this session.
- `archive/` preserves the earlier audit and protocol-stage drafts. `titlepage.tex`, `declarations.tex`, `coverletter.tex`, `synopsis.tex`, `submission_details.tex` and `submission_metadata.txt` provide supporting drafts. `AUTHOR_COMPLETION_FORM.txt` lists pending author facts; `SUBMISSION_FILES.txt` distinguishes optional supporting documents from the anonymous review PDF.
- All five documents and five Windows metadata companions under `Manuscript/SystematicITS/` were read at the user's request. Document structure was adapted only; the SLR's authorship, funding, ethics exemption and results were not transferred. `REFERENCE_ADAPTATION.txt` records this boundary. ResearchITS remains an independent project.
- Public AAIE pages checked on October 18 list an October 20, 2026 deadline, anonymous full-paper review, 5--12 pages including references/figures, and PDF/Word upload. Portal fields require login and remain unverified. No defensible numerical acceptance probability is available. See `SUBMISSION_READINESS.txt` for sources and outstanding checks; recheck official instructions before upload.
- Static citation, source/package and Mermaid structure checks passed. No current rendered-PDF layout, page count, final figure legibility or similarity score has been verified.

## Submission Blockers / Next Session

**First task:** complete `Manuscript/AAIE2027/AUTHOR_COMPLETION_FORM.txt` from actual study records and confirm authorship, ethics/consent, setting/cohort, funding/interests and publication overlap. Then reconcile the manuscript body and declarations, export both figures, resolve author notes and inspect the compiled anonymous Overleaf PDF before submission. Do not hide missing evidence by only switching off draft callouts.

## Git Safety at Session Close

`GIT_SAFETY_REVIEW_2026-10-18.txt` classifies every modified/deleted/untracked path and separately lists ignored research artifacts and existing tracked risks. All four `fromSUpabase/*.csv` files are untracked and **not ignored**. The students and responses exports contain direct or linked personal data; the catalog/KC exports also require release review as production exports. Do not stage these raw files. Existing tracked database dumps and embedded client tokens require separate review; adding ignore rules alone cannot remove already tracked material or history.

No deletion, staging, commit, push, restore, live database operation or raw-data modification was performed during session close. The three pre-existing JavaScript changes are file-mode changes only and remain preserved for owner review. Ignore-rule additions for exports are recommended in the safety report, not applied by this review.

## Existing Implementation Inventory (Earlier Static Inspection)

Observable artifacts exist for role-based React interfaces; Express APIs/controllers; Sequelize models/migrations/seeders; local Bayesian updates with heuristic adjustments; separate Netlify/Supabase API; PDF extraction/review; reports/messages; build/configuration files. This establishes code presence, not passing behavior, deployment, or research completion.

## Existing Software Work in Progress

Code explicitly retains TODOs/placeholders: fuzzy recommendations and engagement calculations (`teacherController.js`, `studentController.js`); learning-path/mastery filtering; authorization in `getDetailedPerformanceById`; PDF review manual-creation handlers (`PDFReviewDetail.js`). Whether each is an active owner priority is unknown.

## Known Issues

Observed static discrepancies and historical reports, not runtime-confirmed defects:

- Express Bayesian mastery update differs from Netlify's incremental update (`utils/bktAlgorithm.js` versus `netlify/functions/api.js`).
- Thresholds differ across progression, summaries, and retry UI; intended semantics require confirmation.
- Existing setup instructions include paths inconsistent with actual `client/server/` layout; root `install-all` covers root/client, not the separate backend installation.
- Root test script explicitly exits with “no test specified”; frontend scaffold test targets text unrelated to current routed app, and Login tests target an older component.
- `CLAUDE.md` reports parent/student linking failures and fixes; current reproduction/resolution status is unknown. Existing proposed quiz checklist is not reliable proof of current unfinished implementation.
- Evaluation and threshold-benefit claims in thesis/research prose lack verified supporting study artifacts in this inspection.

## Other Research Claims

The older thesis draft's broader TAM, learning-effectiveness, retention and performance claims remain distinct from the completed predictive replay. Supporting instruments, assignments and reproducible outputs for those claims have not been verified here. Synthetic fixtures are software checks, not additional participant observations.

## Important Files/Modules

See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for source entry points. Particularly: `client/server/utils/bktAlgorithm.js`, `controllers/studentController.js`, `controllers/teacherController.js`, `models/`, `migrations/`, `seeders/`, `client/src/App.js`, `components/student/QuizView.js`, `netlify/functions/api.js`, and `MATHGALING_THESIS_MANUSCRIPT.md`.

## Next Recommended Tasks

Recommendations: confirm the canonical runtime/deployment; document API/algorithm differences before changing them; reconcile setup instructions and toolchain; establish an isolated test baseline; identify original evaluation records. Do not seed/import into an unknown database or silently standardize thresholds.

## Open Questions

Which backend/commit was historically deployed? Which accounts correspond to eligible distinct participants? What are the actual approval and consent details? Were answer keys unchanged since collection? The current replay protocol is approved, but this does not independently calibrate its parameters or establish that the method was used online. Intended progression/reporting threshold semantics and broader thesis evidence remain unresolved. No formal dependency on the separate SLR has been established.
