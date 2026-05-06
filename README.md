# TrialGo

> AI-powered clinical trial recruitment, patient monitoring, consent handling, and FHIR-ready enrollment in one stack.

TrialGo is a full-stack clinical trial platform built around a Next.js 16 frontend, a FastAPI backend, PostgreSQL, Redis, Celery, and a 12-agent automation pipeline. The UI is fully dynamic: no demo fallbacks, no placeholder data, and no fake counts.

## What It Does

TrialGo connects three workflows:

1. Patients discover trials, register, submit medical history, and log weekly symptoms.
2. Coordinators monitor enrolled cohorts, anomaly alerts, and real-time dashboards.
3. Pharma teams create trials, review candidates, upload consent PDFs, and export FHIR snapshots.

## Stack At A Glance

| Layer        | Tech                                                                  |
| ------------ | --------------------------------------------------------------------- |
| Frontend     | Next.js 16.1.7, React 19, TypeScript, TailwindCSS 4, Socket.io client |
| Backend      | FastAPI, SQLAlchemy, Alembic, Pydantic                                |
| Jobs         | Celery 5.3.6                                                          |
| Data         | PostgreSQL 15, Redis 7                                                |
| Integrations | AWS S3, Twilio, SendGrid, Google GenAI, WebSockets                    |

## Highlights

- Dynamic patient dashboard with enrolled trials and symptom logging.
- Trial detail page with medical history submission and dynamic form schema rendering.
- Coordinator cohort dashboard with live anomaly feed and WebSocket updates.
- Pharma analytics page with dynamic trial selection and candidate review.
- Consent PDF upload flow backed by the backend consent router.
- FHIR snapshot export page for trial-level review.
- 12-agent workflow for scraping, NLP, matching, outreach, consent, history, risk scoring, multilingual support, anomaly detection, re-engagement, chatbot support, and fraud checks.

## Project Structure

```text
trialgo/
├── app/                # Next.js App Router pages
├── backend/            # FastAPI app, routers, models, agents, tasks
├── public/             # Static assets
├── docker-compose.yml  # Full stack local/dev orchestration
├── Dockerfile.frontend # Frontend production image
└── README.md
```

## Routes

### Public

- `/` - marketing landing page
- `/register` - patient registration
- `/login` - patient login
- `/trials` - browse active trials

### Patient

- `/dashboard` - enrolled trials and status
- `/trials/[id]` - trial detail, criteria, and application form
- `/patient/symptom-log` - weekly symptom entry

### Coordinator

- `/coordinator/login` - coordinator login
- `/coordinator/cohort` - cohort overview, anomalies, and live feed

### Pharma

- `/pharma/login` - pharma login
- `/pharma/analytics` - trial analytics and quick actions
- `/pharma/create-trial` - create a new trial and trigger pipeline
- `/pharma/candidates/[trialId]` - matched candidates for a trial
- `/pharma/fhir/[trialId]` - trial-level FHIR export snapshot

### Supporting

- `/consent` - consent PDF upload flow
- `/health` - backend health check
- `/docs` - FastAPI OpenAPI docs

## Backend API Surface

The frontend talks to these main backend routers:

- `auth` - registration, login, role-based access
- `trials` - create/list trials, candidate lists, enrolled patients
- `patients` - history form, history submission, symptom logs, wearable upload, my-trial info
- `consent` - consent upload, consent response, audit trail
- `monitoring` - cohort summary, anomalies, WebSocket dashboard
- `pharma` - pharma trials, candidate views, identity reveal, analytics

WebSockets:

- `/chatbot/{candidate_id}` - trust chatbot
- `/monitoring/ws/dashboard/{trial_id}` - live cohort dashboard

## How To Run

### Recommended: Docker Compose

This is the simplest way to run the full stack locally.

```bash
docker compose up --build
```

Services will be available on:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Rebuild After Changes

```bash
docker compose build frontend
docker compose up -d
```

### Frontend Only

```bash
npm install
npm run dev
```

### Frontend Production Build

```bash
npm run build
npm run start
```

### Backend Local Run

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Celery Worker

```bash
cd backend
celery -A tasks.celery_worker worker --loglevel=info
```

## Environment Variables

The Docker Compose file already wires the core service URLs. For manual setup, configure the backend and frontend with values like these:

```env
# Backend
DATABASE_URL=postgresql://trialgo_user:trialgo_pass@localhost:5432/trialgo
REDIS_URL=redis://localhost:6379/0
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://backend:8000

# Optional integrations
S3_BUCKET_CONSENT=trialgo-consent-docs
S3_BUCKET_FHIR=trialgo-fhir-bundles
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=
GOOGLE_API_KEY=
```

## Dynamic Data Policy

This project intentionally avoids demo records and placeholder fallbacks in the live UI.

- Pages fetch live data from the backend.
- Empty states are shown when nothing exists yet.
- Errors are surfaced instead of silently substituting mock data.
- Trial-specific pages let the user switch between real backend trials.

## Testing And Validation

Useful commands:

```bash
npm run build
npm run lint
npm run typecheck
docker compose build frontend
docker compose up -d
```

Smoke test the key routes after deployment:

- `/dashboard`
- `/trials`
- `/trials/1`
- `/coordinator/cohort`
- `/pharma/analytics`
- `/pharma/candidates/1`
- `/consent?trial=1`
- `/pharma/fhir/1`

## AI Agent Pipeline

The backend orchestrates a 12-agent workflow:

1. Scraping trial sources
2. NLP extraction from posts and candidate text
3. Trial matching
4. Outreach messaging
5. History collection and FHIR bundle creation
6. Consent simplification
7. Dropout prediction
8. Anomaly detection
9. Trust chatbot support
10. Re-engagement
11. Multilingual support
12. Fraud detection

## Troubleshooting

- If a page shows a redirect, make sure you are logged in and the `trialgo_token` is present in the browser storage.
- If the frontend cannot reach the backend in Docker, rebuild and restart with `docker compose build frontend` followed by `docker compose up -d`.
- If Celery tasks do not run, confirm Redis and the backend are healthy first.
- If consent or FHIR-related flows fail, check the backend environment variables for S3 and API keys.

## Notes

- The backend exposes OpenAPI docs at `/docs`.
- The app is built for clinical-trial workflows and uses real backend state instead of demo placeholders.
- The repository uses the Next.js App Router, so page files live under `app/`.

## License

No license has been provided in this repository.
