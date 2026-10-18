# Agent instructions: MathGaling

- Read `PROJECT_CONTEXT.md`, `RESEARCH_STATUS.md`, `DECISIONS.md`, and `TODO.md` before substantial work. Consult `../WORKSPACE.md`; inspect relevant source before proposing code changes. Existing `CLAUDE.md` and plans may describe historical deployments; verify against code and the intended runtime.
- Do not invent research results, dataset values, participants, calibration evidence, or evaluation outcomes. Distinguish software behavior, documentation assertions, empirical evidence, and interpretation. Report unknowns as `Not yet documented`.
- Do not modify original/raw research data without explicit permission. Do not import dumps, seed databases, or run repair/migration scripts against an unconfirmed environment. Preserve provenance and reproducibility.
- Do not silently change algorithms, BKT parameters, mastery thresholds, fuzzy adjustments, or research methodology. Inspect both Express and Netlify implementations when relevant; do not assume parity. Explain research implications and obtain direction for consequential methodology changes.
- Explain significant architectural changes before implementing them. Keep research methodology and software implementation distinguishable; record approved choices with sources and actual dates.
- Run appropriate tests/checks after code modifications where possible. Report exact scope and limits; a declared test script is not evidence of passing tests. Use isolated fixtures rather than real study data.
- Never expose credentials, secrets, API keys, tokens, or environment values in output, logs, memory documents, or commits. Do not commit secrets. Keep sensitive configuration outside shared project memory and transfer it securely.
- Preserve reproducibility through recorded versions, source paths, dataset identifiers without sensitive values, parameters, and commands/results. Use portable relative paths in memory.
- At the end of substantial sessions, propose updates to `RESEARCH_STATUS.md`, `TODO.md`, and `DECISIONS.md`, identifying new evidence and unresolved limitations.

## Cross-project rule

MathGaling and ResearchITS maintain independent project memory. Do not automatically copy assumptions, findings, terminology, methodology, or implementation details. For relevant information from the other project: identify its source file, explain the relationship, distinguish established evidence from inference, and ask for confirmation before a consequential cross-project change. The system-specific thesis draft here is not the separate SLR manuscript.
