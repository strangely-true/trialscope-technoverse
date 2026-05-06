# TrialGo Codebase Audit & Cleanup Review

This document provides a comprehensive folder-by-folder and file-by-file audit of the entire TrialGo codebase. 
Each file/folder is marked as either **KEEP** (critical to application operation) or **DELETE** (unused, temporary, or redundant).

---

## 1. Root Configuration & Project Files
These files configure the Next.js frontend, Docker containers, and package managers.

*   `package.json`, `package-lock.json`, `pnpm-lock.yaml`: **KEEP** - Defines all Node.js dependencies.
*   `next.config.mjs`, `next-env.d.ts`, `tsconfig.json`: **KEEP** - Next.js and TypeScript configurations.
*   `postcss.config.mjs`, `eslint.config.mjs`: **KEEP** - Styling (Tailwind) and linting rules.
*   `.prettierrc`, `.prettierignore`: **KEEP** - Code formatting rules.
*   `.gitignore`, `.dockerignore`: **KEEP** - Source control and Docker build ignore rules.
*   `components.json`: **KEEP** - Configuration for shadcn/ui components.
*   `docker-compose.yml`, `Dockerfile.frontend`: **KEEP** - Docker orchestration files.
*   `README.md`: **KEEP** - Project documentation.
*   `files.txt`, `files_utf8.txt`, `tree.txt`: **DELETE** - Temporary files created during the codebase audit.

---

## 2. `.github/` Folder
This folder contains markdown files used to store AI prompts and initial feature plans.

*   `new_feature_propmt.md`: **DELETE** - Not used in the running application.
*   `propmt.md`: **DELETE** - Not used in the running application.
*   `test_new.md`: **DELETE** - Not used in the running application.
*   `trialgo_mvp_plan.md`: **DELETE** - Not used in the running application.
*(Note: Since these were only used for planning and storing prompts, they can safely be removed to clean up the repository.)*

---

## 3. `.planning/` Folder
Contains historical documentation and debugging logs.

*   `codebase/ARCHITECTURE.md`, `INTEGRATIONS.md`, `STACK.md`, `STRUCTURE.md`: **DELETE** - Purely historical planning docs; not required for runtime.
*   `debug/fix-broken-routes.md`, `debug/resolved/celery-import-error.md`: **DELETE** - Old debugging notes.

---

## 4. `app/` Folder (Next.js Frontend Routes)
This is the core frontend application. Every file here translates to a UI route or global layout.

*   `layout.tsx`, `globals.css`, `favicon.ico`: **KEEP** - The main HTML wrapper and global stylesheet.
*   `RoleGuard.tsx`: **KEEP** - The security middleware that locks users into their specific portals.
*   `page.tsx`: **KEEP** - The public landing page.
*   `login/page.tsx`, `register/page.tsx`: **KEEP** - Universal patient auth pages.
*   `dashboard/page.tsx`: **KEEP** - The main Patient Portal dashboard.
*   `patient/symptom-log/page.tsx`: **KEEP** - Patient ePRO/symptom tracking page.
*   `trials/page.tsx`, `trials/[id]/page.tsx`: **KEEP** - External trial database search for patients.
*   `onboarding/questionnaire/page.tsx`: **KEEP** - The clinical screening form for patients.
*   `consent/page.tsx`: **KEEP** - eConsent module UI.
*   `pharma/*` (login, analytics, candidates, create-trial, discovery, fhir): **KEEP** - The entire Pharma B2B portal.
*   `coordinator/*` (login, cohort, anomalies): **KEEP** - The entire Coordinator portal.

---

## 5. `backend/` Folder (FastAPI Application)
This folder contains the Python backend, AI agents, and database schemas.

### Root Backend Files
*   `main.py`: **KEEP** - The primary FastAPI server entry point.
*   `requirements.txt`: **KEEP** - Python dependencies.
*   `Dockerfile`, `.dockerignore`, `alembic.ini`: **KEEP** - Backend containerization and DB migration configs.
*   `.env`, `.env.local`: **KEEP** - Environment variables and secrets.
*   `celery_broker.db`, `trialgo.db`: **KEEP** - Local SQLite databases used for Celery task queuing and primary data storage.
*   `run_all.ps1`: **KEEP** - Useful PowerShell script for local development.
*   `test_*.py` (e.g., `test_e2e.py`, `test_trials.py`): **KEEP** - Test suites. They don't run in production but are vital for CI/CD and debugging.
*   `output.txt`: **DELETE** - Temporary output log file from a script run.

### `backend/agents/`
*   `agent1_scraper.py` through `agent12_fraud.py`: **KEEP** - The core 12-agent AI pipeline logic (Scraping, NLP, Matching, Outreach, Consent, Anomaly detection, Chatbots, etc.).

### `backend/auth/`
*   `jwt_handler.py`: **KEEP** - JWT generation and role-based authentication logic.

### `backend/db/`
*   `database.py`: **KEEP** - SQLAlchemy engine configuration.
*   `migrations/`: **KEEP** - Alembic migration scripts ensuring DB schema consistency.

### `backend/models/`
*   `models.py`: **KEEP** - SQLAlchemy ORM database tables (`Trial`, `User`, `VerifiedPatient`, etc.).
*   `schemas.py`, `questionnaire.py`: **KEEP** - Pydantic models for API request/response validation.

### `backend/routers/`
*   `auth.py`, `chat.py`, `consent.py`, `monitoring.py`, `patients.py`, `pharma.py`, `questionnaire.py`, `trials.py`: **KEEP** - FastAPI endpoints that handle frontend requests.

### `backend/services/`
*   `scraper_engine.py`, `global_trial_scraper.py`: **KEEP** - External registry fetching logic.
*   `llm_service.py`, `llm_trial_filter.py`: **KEEP** - Core LLM abstraction (Gemini, Groq) and filtering.
*   `query_builder.py`, `s3_service.py`, `sendgrid_service.py`, `twilio_service.py`: **KEEP** - Essential third-party integrations.

### `backend/tasks/`
*   `celery_worker.py`: **KEEP** - Background task runner for asynchronous matching and emails.

### `backend/reports/`
*   `e2e_report.md`: **DELETE** - Temporary markdown output generated by the test scripts.

### `backend/scripts/`
*   `e2e_check.py`, `seed_db.py`: **KEEP** - Useful local testing and database seeding scripts.

---

## 6. `components/` Folder (React Components)
Contains all reusable UI blocks.

*   `landing/*`: **KEEP** - Sections of the home page (hero, features).
*   `ui/*`: **KEEP** - All shadcn/ui primitives (buttons, inputs, dialogs, cards).
*   `theme-provider.tsx`, `mode-toggle.tsx`: **KEEP** - Dark/Light mode management.

---

## 7. `hooks/`, `lib/`, `public/` Folders
*   `hooks/use-mobile.ts`: **KEEP** - Responsive design hook.
*   `lib/utils.ts`: **KEEP** - Tailwind class merging utility (`cn`).
*   `public/.gitkeep`: **KEEP** - Placeholder for public assets (images/icons).

---

## 8. `reports/` Folder (Root)
*   `agents_report.md`, `e2e_report.md`: **DELETE** - Old output reports from running test scripts. Not required by the application.

---

## Action Summary
You can safely **DELETE** the following folders and files without impacting the application:
1.  The entire `.github/` folder.
2.  The entire `.planning/` folder.
3.  The entire `reports/` folder.
4.  `backend/reports/e2e_report.md`.
5.  `backend/output.txt`.
6.  `files.txt`, `files_utf8.txt`, `tree.txt` (in the root directory).
