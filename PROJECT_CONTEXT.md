# Project context: MathGaling

Last updated: 2026-10-18. Architecture descriptions remain a source-based inventory, not runtime validation. A separate approved offline research comparison is now documented in `RESEARCH_STATUS.md`.

## Purpose and research relationship

[package.json](package.json) describes a Bayesian-Fuzzy ITS for Philippine Grade 3–4 mathematics. [MATHGALING_THESIS_MANUSCRIPT.md](MATHGALING_THESIS_MANUSCRIPT.md) titles the system “MathGaling: An Intelligent Tutoring System for Elementary Mathematics Education in the Philippines.” README and older materials use ITS-KIDS; the package name is `its-prototype`. Confirm preferred naming before standardizing existing files.

The owner identifies this as the actual system/resources for their master's research. Formal degree details and the approved link to the separate ResearchITS SLR: Not yet documented in the inspected sources. Keep these projects separate.

Target users evidenced by components, models, and routes: students, teachers, parents, administrators. Educational domain: elementary mathematics, with Grade 3/4 knowledge-component and question seeders; curriculum alignment is described in the thesis draft, not independently audited here.

## Architecture and technologies

- **Frontend:** React 19 declared in `client/package.json`; Create React App/react-scripts 5; React Router 6; AuthContext; Axios; Chart.js/react-chartjs-2; PDF-related libraries; role-specific components in `client/src/components/`. `client/src/App.js` mounts dashboards and protected routes. These are declared dependencies, not verification of every installed package version.
- **Local backend:** Node.js/Express 4, MVC-style routes/controllers/models in `client/server/`; `index.js` registers the centralized routes. JWT/bcrypt dependencies and authentication middleware are present.
- **Database:** Sequelize 6/PostgreSQL in server package/config/models; migrations and seeders in `client/server/`; Docker Compose PostgreSQL setup is present. Models include users by role, classrooms and joins, KCs, knowledge states, content, responses, learning paths, engagement, PDF uploads, messages, notifications. Root still declares SQLite dependencies; this does not establish current use by the Express model layer.
- **Separate API path:** `netlify/functions/api.js` uses Supabase operations and contains its own endpoint and mastery logic. `CLAUDE.md` describes Netlify/Supabase deployment and Supabase authentication. It is not merely a wrapper around the local Express BKT module. `api/` and legacy `client/api-OLD/`, `client/api-vercel-OLD/` also exist; active routing for a specific deployment must be confirmed.
- **Local API groups:** `/api/auth`, `/api/students`, `/api/teachers`, `/api/parents`, `/api/admin`, `/api/pdf-content`, `/api/admin/pdf-content`, `/api/bkt`, `/api/classrooms`, `/api/messages`, content/KC endpoints, and `/api/health` (`client/server/routes/index.js`). Do not assume endpoint parity with Netlify.

## AI/adaptation, BKT, and fuzzy components

`client/server/utils/bktAlgorithm.js` performs Bayesian response conditioning plus a learning transition. Defaults: pL0=0.3, pT=0.09, pS=0.1, pG=0.2; per-KC overrides can come from `metadata.bktParams`. Knowledge states persist mastery and parameter fields. `studentController.js` calls this utility for non-practice response processing.

The utility's `applyFuzzyAdjustments` is a conditional heuristic: response-time/difficulty ratio, hints, attempts, and recent performance adjust mastery, bounded to [0,1], with an 80% gate conditioned on performance. The code says timing thresholds would ideally be calibrated. Do not describe this as empirically calibrated or assume a full Mamdani/Sugeno inference engine. Teacher/student recommendation paths contain placeholders and TODOs for fuzzy recommendations.

The Netlify response handler instead uses a “BKT-style” increment/decrement (correct: +0.15×remaining mastery; incorrect: −0.1×current mastery, floor 0.1). It does not establish equivalence to the Express Bayesian update. Netlify sequencing uses 0.95 in places, while completion summaries and frontend retry logic use 0.8 and local summary code uses 0.85. These may serve different functions; intended semantics are unconfirmed.

`client/server/utils/pdfProcessor.js` includes OpenAI-backed structured extraction from PDF pages, with initialization/error handling and stored suggestions/review workflow. API availability, successful execution, and quality of generated educational content are Not yet documented by this inspection. Do not call external services during context setup.

## Data and evaluation

- The active follow-up manuscript and reproducibility record are in `Manuscript/AAIE2027/`. The study compares the pinned Express BKT update with that update plus implemented fuzzy adjustments; it is a retrospective prediction experiment, not a learning-gain experiment or verification of the historical Netlify deployment. Protocol, results and changing submission status belong in `RESEARCH_STATUS.md`, `DECISIONS.md` and the manuscript's records.
- Protected raw Supabase CSVs are under the case-sensitive path `fromSUpabase/` (not `fromSupabase/`). They include student names/authentication identifiers and linked responses. Preserve originals and fingerprints; never treat these exports as public reproducibility fixtures. Public data/code-release terms remain Not yet documented.
- The earlier Math Tagumpay publication is an IAFOR system-development/teacher-evaluation paper, cited as Ruiz (2026), ACE2025 official proceedings, DOI `10.22492/issn.2186-5892.2026.131`. Its reported perceptions are distinct from the new predictive scoring results.
- `Manuscript/SystematicITS/` contains reference copies of the separate SLR's manuscript and submission materials. At the user's request their organization informed AAIE supporting drafts; their results, author declarations and ethics exemption were not adopted. ResearchITS retains its independent project memory.
- Existing database resources: `backup.sql`, `backup_before_seed.sql`, `backup.dump`, `production_data.sql`; CSV test fixtures; Grade 3/4 and BKT/fuzzy seeders; PDF/image uploads and an example PDF. Contents were not imported, edited, or treated as validated research datasets. Provenance, consent, anonymization, canonical snapshot, and study-record mapping: Not yet documented.
- Evaluation-related components include knowledge states, responses, engagement metrics, progress reports, intervention views, and `test-classroom-performance.js`.
- Thesis draft describes TAM validation, learning-effectiveness pilot testing, retention and performance measures, and numerical results. Verified participant-level evidence, instruments, ethics approvals, experimental assignment, analysis scripts, and reproducible statistical outputs tied to those claims: Not yet documented in inspected materials. Draft claims must not become accepted findings in memory.
- Empirical algorithm calibration/fit and validated mastery-threshold selection remain Not yet documented. The separate fixed-parameter replay protocol was explicitly approved and executed on 2026-10-18; see `RESEARCH_STATUS.md`. That approval does not validate the older thesis's broader evaluation assertions.

## Environment, deployment, and testing

Root scripts launch Express at `client/server/index.js` and the React client. Backend has its own dependencies, migration/seed scripts, Jest/Supertest dev dependencies, and a declared Node >=14 engine; a verified cross-machine toolchain/version lock is Not yet documented. Lockfiles and existing `node_modules/` are present. `.env.example` files exist; secret values must remain outside memory.

`SETUP_NEW_PC.md` describes Git/copy, Docker PostgreSQL, and seeders, but includes stale directory instructions and assumes environment files transfer. README describes Render; `CLAUDE.md` describes Netlify/Supabase; Netlify, Render, and multiple Vercel configs coexist. Active production provider, deployed commit, database snapshot, and current migration state: Not yet documented/verified.

Frontend test script uses react-scripts/Jest; `App.test.js` contains the scaffold “learn react” test, and `Login.test.js` tests the older Login component while App routes to LoginImproved. Backend declares Jest; manual PDF/BKT test guides and a performance script exist. Passing test baseline, backend automated coverage, CI status, and deployment verification: Not yet documented. No application, database, tests, or deployments were run in this inspection.

## Main source entry points

`client/src/App.js`, `client/src/context/AuthContext.js`, role component folders; `client/server/index.js`, `routes/index.js`, `controllers/studentController.js`, `controllers/teacherController.js`, `models/`, `migrations/`, `seeders/`, `utils/bktAlgorithm.js`, `utils/pdfProcessor.js`; `netlify/functions/api.js`. Existing explanatory documents include `ARCHITECTURE_MAP.md`, `SYSTEM_ARCHITECTURE.md`, BKT/fuzzy explanations, `CLAUDE.md`, and the system thesis draft. Inspect code before trusting prose as current implementation.
