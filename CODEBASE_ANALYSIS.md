# TrialGo - Complete Codebase Analysis

**Project:** TrialGo - AI-Powered Clinical Trial Recruitment Platform  
**Version:** 0.0.1  
**Architecture:** Full-stack (Next.js 16 + FastAPI)  
**Purpose:** Connect patients to clinical trials, manage recruitment, consent workflows, and monitor trial health in real-time

---

## 1. PROJECT OVERVIEW

TrialGo is an intelligent clinical trial platform that automates three core workflows:

1. **Patient Recruitment & Matching** — Patients register, discover trials, submit medical history, and track enrollment status
2. **Trial Management** — Pharma teams create trials, review matched candidates, manage consent workflows, and export FHIR data
3. **Patient Monitoring** — Coordinators monitor enrolled cohorts, track dropout risks, detect health anomalies, and manage real-time patient dashboards

The platform uses a 12-agent AI pipeline for automated scraping, NLP analysis, candidate matching, consent simplification, anomaly detection, and fraud detection.

---

## 2. TECHNOLOGY STACK

### Frontend

- **Framework:** Next.js 16.1.7 (App Router)
- **Runtime:** React 19 with TypeScript
- **Styling:** TailwindCSS 4.2.1 (with Postcss)
- **UI Components:** shadcn/ui, Base UI, Radix UI
- **Forms:** React Hook Form
- **State Management:** TanStack React Query 5
- **WebSocket Client:** Socket.io client 4.8.3
- **HTTP Client:** Axios 1.15.2
- **Charts:** Recharts 3.8.0
- **Notifications:** Sonner 2.0.7, React Toastify 11.1.0
- **Utilities:** Date-fns, class-variance-authority, cmdk, lucide-react, embla-carousel

### Backend

- **Framework:** FastAPI (Python async web framework)
- **Database ORM:** SQLAlchemy with Alembic migrations
- **Database:** PostgreSQL 15
- **Caching:** Redis 7
- **Task Queue:** Celery 5.3.6 with Redis broker
- **Authentication:** JWT (via python-jose), Bcrypt password hashing
- **File Storage:** AWS S3 (boto3)
- **Communications:** Twilio (SMS), SendGrid (Email)
- **AI/LLM:** LangChain (Google GenAI, Groq, OpenAI)
- **Social Scraping:** PRAW (Reddit), Tweepy (Twitter)
- **PDF Processing:** PyPDF
- **Web Scraping:** BeautifulSoup4, Requests
- **Translation:** Deep Translator

### Infrastructure

- **Containerization:** Docker & Docker Compose
- **Development:** Uvicorn (ASGI server)
- **Frontend Port:** 3000
- **Backend Port:** 8000
- **Redis Port:** 6379
- **PostgreSQL Port:** 5432

---

## 3. FOLDER STRUCTURE & ORGANIZATION

```
trialgo/
├── app/                              # Next.js App Router (Frontend Pages)
│   ├── page.tsx                      # Landing page
│   ├── layout.tsx                    # Root layout with theme provider
│   ├── RoleGuard.tsx                 # Authentication guard component
│   ├── globals.css                   # TailwindCSS configuration
│   │
│   ├── register/                     # User registration
│   ├── login/                        # Patient login
│   │
│   ├── dashboard/                    # Patient dashboard (enrolled trials)
│   ├── trials/                       # Trial discovery and listing
│   │   └── [id]/                     # Trial detail page
│   │
│   ├── patient/                      # Patient-specific routes
│   │   └── symptom-log/              # Weekly symptom logging
│   │
│   ├── onboarding/                   # Patient onboarding
│   │   └── questionnaire/            # Medical questionnaire
│   │
│   ├── consent/                      # Consent PDF upload/signing
│   │
│   ├── chatbot/                      # Trust chatbot
│   │
│   ├── coordinator/                  # Coordinator portal
│   │   ├── login/                    # Coordinator login
│   │   ├── cohort/                   # Cohort dashboard with anomalies
│   │   └── anomalies/                # Anomaly alerts
│   │
│   └── pharma/                       # Pharma company portal
│       ├── login/                    # Pharma login
│       ├── analytics/                # Trial analytics dashboard
│       ├── trials/                   # Pharma's trials
│       ├── create-trial/             # Create new trial
│       ├── candidates/[trialId]/     # Matched candidates
│       ├── discovery/[trialId]/      # Social discovery candidates
│       └── fhir/[trialId]/           # FHIR export snapshot
│
├── components/                       # Shared React Components
│   ├── ui/                           # shadcn/ui primitive components
│   │   ├── button.tsx, input.tsx, select.tsx, dialog.tsx, etc.
│   │   ├── card.tsx, accordion.tsx, alert.tsx, badge.tsx
│   │   ├── carousel.tsx, chart.tsx, skeleton.tsx, spinner.tsx
│   │   └── [40+ reusable UI primitives]
│   │
│   ├── landing/                      # Landing page components
│   │   ├── hero-section.tsx
│   │   ├── feature-grid.tsx
│   │   ├── process-section.tsx
│   │   ├── landing-header.tsx
│   │   └── landing-footer.tsx
│   │
│   ├── mode-toggle.tsx               # Dark mode toggle
│   └── theme-provider.tsx            # Theme context provider
│
├── hooks/                            # Custom React Hooks
│   ├── use-mobile.ts                 # Mobile detection
│   └── useWebRTC.ts                  # WebRTC utilities
│
├── lib/                              # Utility functions (empty/not used)
│
├── public/                           # Static assets
│
├── backend/                          # FastAPI Backend
│   ├── main.py                       # FastAPI app initialization
│   ├── start.py                      # Server startup script
│   │
│   ├── db/                           # Database configuration
│   │   └── database.py               # SQLAlchemy session factory
│   │
│   ├── models/                       # Data models
│   │   ├── models.py                 # SQLAlchemy ORM models (20+ tables)
│   │   ├── schemas.py                # Pydantic request/response schemas
│   │   └── questionnaire.py          # Questionnaire-specific models
│   │
│   ├── routers/                      # API route handlers
│   │   ├── auth.py                   # Register, login, user profile
│   │   ├── trials.py                 # Trial management, listing, creation
│   │   ├── patients.py               # Patient history, symptom logs, wearables
│   │   ├── consent.py                # Consent upload, signing, audit trail
│   │   ├── monitoring.py             # Dropout scores, anomalies, cohort stats
│   │   ├── pharma.py                 # Pharma analytics, candidate review
│   │   ├── chat.py                   # Chat/messaging endpoints
│   │   └── questionnaire.py          # Questionnaire endpoints
│   │
│   ├── auth/                         # Authentication logic
│   │   └── jwt_handler.py            # JWT creation, verification, password hashing
│   │
│   ├── agents/                       # 12 AI Agent Modules
│   │   ├── agent1_scraper.py         # [Agent 1] Data scraping
│   │   ├── agent1_social_discovery.py # Social media discovery
│   │   ├── agent2_nlp.py             # [Agent 2] NLP extraction
│   │   ├── agent3_matching.py        # [Agent 3] Trial matching
│   │   ├── agent4_outreach.py        # [Agent 4] Outreach messaging
│   │   ├── agent5_history.py         # [Agent 5] Medical history collection
│   │   ├── agent6_consent.py         # [Agent 6] Consent simplification
│   │   ├── agent7_dropout.py         # [Agent 7] Dropout prediction
│   │   ├── agent8_anomaly.py         # [Agent 8] Anomaly detection
│   │   ├── agent9_chatbot.py         # [Agent 9] Trust chatbot (WebSocket)
│   │   ├── agent10_reengagement.py   # [Agent 10] Re-engagement
│   │   ├── agent11_multilingual.py   # [Agent 11] Multilingual support
│   │   └── agent12_fraud.py          # [Agent 12] Fraud detection
│   │
│   ├── services/                     # Business logic & integrations
│   │   ├── scraper_engine.py         # Unified trial registry scraper (18 databases)
│   │   ├── global_trial_scraper.py   # Trial aggregator
│   │   ├── llm_service.py            # LLM orchestration
│   │   ├── llm_trial_filter.py       # Trial filtering with LLM
│   │   ├── llm_social_checker.py     # Social media analysis with LLM
│   │   ├── query_builder.py          # Search query construction
│   │   ├── s3_service.py             # AWS S3 upload/download
│   │   ├── sendgrid_service.py       # Email sending
│   │   ├── twilio_service.py         # SMS/voice communications
│   │   └── social_dm.py              # Reddit/Twitter DM sending
│   │
│   ├── tasks/                        # Celery task queue
│   │   └── celery_worker.py          # Task orchestration & scheduling
│   │
│   ├── scripts/                      # Utility scripts
│   │
│   ├── alembic/                      # Database migration management
│   ├── alembic.ini                   # Alembic configuration
│   │
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile                    # Backend Docker image
│   ├── start.py                      # Server initialization
│   └── .env                          # Environment variables (local)
│
├── docker-compose.yml                # Full stack orchestration
├── Dockerfile.frontend               # Frontend production image
├── package.json                      # NPM dependencies
├── tsconfig.json                     # TypeScript configuration
├── next.config.mjs                   # Next.js configuration (API rewrites)
├── eslint.config.mjs                 # ESLint rules
├── postcss.config.mjs                # PostCSS configuration
└── README.md                         # Project documentation
```

---

## 4. DATABASE SCHEMA (20+ Tables)

### Core User & Auth

- **users** — Email, hashed password, role (patient/coordinator/pharma), phone, language
- **call_logs** — Coordinator-patient call history (Twilio integration)

### Trials & Matching

- **trials** — Trial metadata (disease, stage, inclusion/exclusion, consent template)
- **raw_medical_data** — Scraped trial data from 18 registries
- **social_raw_posts** — Raw posts from Reddit/Twitter (source data)
- **social_discovery_leads** — Processed leads from social media
- **extracted_candidates** — NLP-extracted candidate profiles
- **matched_candidates** — Final matched candidates with match scores
- **verified_patients** — Enrolled patients with FHIR bundles and consent status

### Consent & Legal

- **consent_submissions** — Signed consent forms and audit trail
- **consent_audit_log** — Immutable consent interaction history
- **identity_map** — Encrypted PII mapping (restricted access)
- **fraud_flags** — Fraud detection results

### Patient Monitoring

- **symptom_logs** — Weekly patient symptom entries
- **wearable_data** — Biometric data (heart rate, glucose, steps, BP, temp)
- **dropout_scores** — Dropout risk prediction with RAG tiers (RED/AMBER/GREEN)
- **anomaly_alerts** — Biometric anomalies via Z-score analysis
- **patient_questionnaire** — Onboarding medical history (one per patient)

---

## 5. CORE FUNCTIONALITIES

### 5.1 USER AUTHENTICATION & ROLES

**File:** `backend/routers/auth.py`, `backend/auth/jwt_handler.py`

**Functionality:**

- Register new users (patient/coordinator/pharma)
- OTP verification via SMS (Twilio)
- JWT token-based login
- Role-based access control (RBAC)
- User profile update with re-verification on phone change

**Endpoints:**

```
POST   /auth/register              # Register with role, phone OTP sent
POST   /auth/verify-phone          # Verify OTP
POST   /auth/login                 # Login, return JWT token
GET    /auth/me                    # Current user profile
PUT    /auth/me                    # Update profile
```

---

### 5.2 TRIAL MANAGEMENT (Pharma Portal)

**Files:** `backend/routers/trials.py`, `backend/routers/pharma.py`, `app/pharma/**`

**Functionality:**

- **Trial Creation** — Pharma creates trial with inclusion/exclusion criteria
- **Auto-Pipeline Trigger** — Celery kicks off 12-agent workflow (scraping, NLP, matching)
- **Trial Listing** — Filtered by patient's medical questionnaire
- **Candidate Review** — Matched candidates ranked by match score
- **Identity Reveal** — Pharma reveal identity after consent
- **Analytics Dashboard** — Enrollment rate, risk distribution, anomaly counts

**Endpoints:**

```
POST   /trials/create              # Create trial (triggers AI pipeline)
GET    /trials                     # List active trials (patient-filtered)
GET    /pharma/trials              # Pharma's trials
GET    /pharma/candidates/{id}     # Matched candidates for trial
GET    /pharma/analytics/{id}      # Trial analytics
```

**Frontend Pages:**

- `/pharma/create-trial/` — Form to create and configure trial
- `/pharma/analytics/` — Dashboard with trial selection and metrics
- `/pharma/candidates/[trialId]/` — Candidate list with match scores
- `/pharma/discovery/[trialId]/` — Social media discovery leads

---

### 5.3 PATIENT ENROLLMENT & HISTORY

**Files:** `backend/routers/patients.py`, `backend/agents/agent5_history.py`, `app/trials/[id]/page.tsx`

**Functionality:**

- **Trial Discovery** — Browse active trials matching medical profile
- **Medical History Form** — Dynamic form with ICD-10 codes, symptoms, medications
- **History Submission** — Convert form to FHIR bundle
- **Symptom Logging** — Weekly self-reported symptoms with severity (1-10)
- **Wearable Integration** — Upload biometric CSV data (HR, glucose, steps, BP)

**Endpoints:**

```
GET    /patient/history-form/{trial_id}     # Get form schema + prefill
POST   /patient/history/{trial_id}          # Submit history (triggers FHIR generation)
POST   /patient/symptom-log/{trial_id}      # Log weekly symptoms
POST   /patient/wearable-upload/{trial_id}  # Upload wearable CSV
GET    /patient/my-trials                   # Enrolled trials
```

**Frontend Pages:**

- `/register/` — Role-based registration (patient/coordinator/pharma)
- `/trials/` — Browse all active trials
- `/trials/[id]/` — Trial detail with criteria and application form
- `/dashboard/` — Enrolled trials summary
- `/patient/symptom-log/` — Weekly symptom entry
- `/onboarding/questionnaire/` — Initial medical profile

---

### 5.4 CONSENT MANAGEMENT

**Files:** `backend/routers/consent.py`, `backend/agents/agent6_consent.py`, `app/consent/page.tsx`

**Functionality:**

- **PDF Upload** — Pharma uploads consent template (stored in S3)
- **Field Extraction** — Auto-extract template fields ({{name}}, [[dob]])
- **Consent Signing** — Patient fills form and signs consent
- **PDF Generation** — Generate signed PDF with filled fields
- **Audit Trail** — Immutable log of all consent interactions
- **Consent Simplification** — LLM-powered plain-English summary

**Endpoints:**

```
POST   /consent/template/{trial_id}         # Upload consent PDF
GET    /consent/form/{trial_id}/{subject}   # Get consent form + fields
POST   /consent/submit/{trial_id}/{subject} # Patient signs consent
GET    /consent/download/{trial_id}/{subject} # Download signed PDF
GET    /consent/audit/{trial_id}            # Audit trail
POST   /consent/reveal-identity             # Pharma reveals patient identity
```

**Frontend Pages:**

- `/consent/` — Consent upload and signing workflow

---

### 5.5 PATIENT MONITORING & ANOMALIES

**Files:** `backend/routers/monitoring.py`, `backend/agents/agent7_dropout.py`, `backend/agents/agent8_anomaly.py`, `app/coordinator/cohort/page.tsx`

**Functionality:**

- **Dropout Prediction** — ML model predicts dropout risk (RED/AMBER/GREEN)
- **Anomaly Detection** — Z-score analysis on biometric data (HR, glucose, BP)
- **Real-time Dashboard** — WebSocket streaming cohort updates
- **Cohort Summary** — Total enrolled, avg match score, risk distribution
- **Alert Management** — Mark anomalies as resolved

**Metrics Tracked:**

- Days since last login
- Symptom logs per week
- Wearable data uploads per week
- Biometric anomalies (unusual HR, glucose, BP)
- Enrollment milestone tracking

**Endpoints:**

```
GET    /monitoring/cohort/{trial_id}           # Cohort summary
GET    /monitoring/dropout/{trial_id}          # Dropout scores
GET    /monitoring/anomalies/{trial_id}        # Anomaly alerts
POST   /monitoring/anomalies/{alert_id}/resolve # Mark resolved
GET    /coordinator/cohort/{trial_id}          # Full cohort table for coordinator
WS     /ws/dashboard/{trial_id}                # WebSocket stream
```

**Frontend Pages:**

- `/coordinator/login/` — Coordinator login
- `/coordinator/cohort/` — Live cohort dashboard with tabs:
  - Overview (stats, risk distribution)
  - Anomalies (active biometric alerts)
  - Patients (full table with profiles)

---

### 5.6 TRUST CHATBOT (WebSocket)

**Files:** `backend/agents/agent9_chatbot.py`, `app/chatbot/`

**Functionality:**

- **Real-time Chat** — WebSocket-based patient support chatbot
- **Trust Building** — Responds to enrollment concerns
- **FAQ Resolution** — Answers trial-specific questions
- **Escalation** — Flags critical issues for coordinator review

**WebSocket Endpoint:**

```
WS    /chatbot/{candidate_id}     # Real-time chatbot stream
```

---

### 5.7 FHIR EXPORT & INTEROPERABILITY

**Files:** `backend/agents/agent5_history.py`, `app/pharma/fhir/[trialId]/`

**Functionality:**

- **FHIR Bundles** — Convert patient history to FHIR resources
- **Standard Resources:**
  - Patient (demographics)
  - Condition (diagnosed conditions)
  - Observation (symptom logs, wearable data)
  - MedicationStatement (current medications)
  - Procedure (previous treatments)
- **Export Snapshot** — Trial-level FHIR export in JSON

**Frontend Pages:**

- `/pharma/fhir/[trialId]/` — Download FHIR bundle snapshot

---

### 5.8 12-AGENT AI PIPELINE

**Directory:** `backend/agents/`

#### **Agent 1: Data Scraper** (`agent1_scraper.py`)

- Scrapes 18 international trial registries (ClinicalTrials.gov, WHO ICTRP, etc.)
- Sources: Reddit, Twitter, PatientsLikeMe, patient forums
- Stores raw JSON in `raw_medical_data` table

#### **Agent 1B: Social Discovery** (`agent1_social_discovery.py`)

- Discovers candidates via Reddit/Twitter keywords
- Identifies personal posts mentioning symptoms/conditions
- Stores in `social_discovery_leads` with LLM confidence scores

#### **Agent 2: NLP Extraction** (`agent2_nlp.py`)

- Extracts ICD-10 codes, symptoms, severity from raw posts
- Maps text to clinical vocabularies
- Outputs structured candidate profiles

#### **Agent 3: Trial Matching** (`agent3_matching.py`)

- Matches extracted candidates to trials
- Calculates match scores (0-1) based on inclusion/exclusion criteria
- Assigns match tier (HIGH/MEDIUM)

#### **Agent 4: Outreach Messaging** (`agent4_outreach.py`)

- Sends DMs via Reddit/Twitter to matched candidates
- Includes trial link and consent workflow

#### **Agent 5: Medical History** (`agent5_history.py`)

- Collects patient medical history via form
- Generates FHIR bundles
- Stores in S3 and database

#### **Agent 6: Consent Simplification** (`agent6_consent.py`)

- Converts complex consent PDFs to plain English
- Extracts key obligations and rights
- LLM-powered summary generation

#### **Agent 7: Dropout Prediction** (`agent7_dropout.py`)

- ML model predicts dropout risk based on engagement
- Inputs: login frequency, symptom logs, wearable uploads
- Outputs: dropout score + risk tier (RED/AMBER/GREEN)

#### **Agent 8: Anomaly Detection** (`agent8_anomaly.py`)

- Calculates Z-scores for biometric data
- Detects unusual HR, glucose, blood pressure, temperature
- Alerts coordinator of RED/AMBER anomalies

#### **Agent 9: Trust Chatbot** (`agent9_chatbot.py`)

- WebSocket-based patient support chatbot
- Answers enrollment questions
- Builds trust before consent

#### **Agent 10: Re-engagement** (`agent10_reengagement.py`)

- Identifies at-risk patients via dropout scores
- Sends SMS/email re-engagement messages
- Tracks response rates

#### **Agent 11: Multilingual Support** (`agent11_multilingual.py`)

- Translates forms, messages, consent documents
- Supports 9+ languages (English, Hindi, Tamil, etc.)
- Uses Deep Translator API

#### **Agent 12: Fraud Detection** (`agent12_fraud.py`)

- Flags suspicious candidates (duplicate profiles, bots, false conditions)
- Blocks enrollment until fraud review

---

### 5.9 SCRAPER ENGINE & TRIAL REGISTRIES

**File:** `backend/services/scraper_engine.py`

**Supported Registries (18 databases):**

1. ClinicalTrials.gov (US/NIH)
2. WHO ICTRP
3. EU Clinical Trials Register
4. ChiCTR (China)
5. JPRN (Japan)
6. ANZCTR (Australia/NZ)
7. ISRCTN (UK)
8. NTR (Netherlands)
9. EudraCT (EU)
10. RPCEC (Cuba)
11. TCTR (Thailand)
12. IRCT (Iran)
13. LCRN (Latin America)
14. ReBec (Brazil)
15. DRKS (Germany)
16. NKFHR (Korea)
17. UMIN (Japan)
18. CTG (Vietnam)

**Features:**

- Async batch fetching
- Standardized trial object output
- Fault tolerance with retry logic

---

## 6. KEY PAGES & ROUTES

### Public Routes

| Route          | Description                        | Component                  |
| -------------- | ---------------------------------- | -------------------------- |
| `/`            | Marketing landing page             | `app/page.tsx`             |
| `/register`    | Multi-step role-based registration | `app/register/page.tsx`    |
| `/login`       | Patient login                      | `app/login/page.tsx`       |
| `/trials`      | Browse active trials               | `app/trials/page.tsx`      |
| `/trials/[id]` | Trial detail & application form    | `app/trials/[id]/page.tsx` |

### Patient Routes (Protected)

| Route                       | Description                   |
| --------------------------- | ----------------------------- |
| `/dashboard`                | Enrolled trials summary       |
| `/patient/symptom-log`      | Weekly symptom entry form     |
| `/onboarding/questionnaire` | Initial medical questionnaire |
| `/consent`                  | Consent PDF signing workflow  |

### Coordinator Routes (Protected)

| Route                    | Description           | Component                            |
| ------------------------ | --------------------- | ------------------------------------ |
| `/coordinator/login`     | Coordinator login     | `app/coordinator/login/page.tsx`     |
| `/coordinator/cohort`    | Live cohort dashboard | `app/coordinator/cohort/page.tsx`    |
| `/coordinator/anomalies` | Anomaly alerts        | `app/coordinator/anomalies/page.tsx` |

### Pharma Routes (Protected)

| Route                          | Description                         | Component                                  |
| ------------------------------ | ----------------------------------- | ------------------------------------------ |
| `/pharma/login`                | Pharma company login                | `app/pharma/login/page.tsx`                |
| `/pharma/analytics`            | Trial analytics dashboard           | `app/pharma/analytics/page.tsx`            |
| `/pharma/trials`               | Pharma's trial list                 | `app/pharma/trials/page.tsx`               |
| `/pharma/create-trial`         | Create new trial & trigger pipeline | `app/pharma/create-trial/page.tsx`         |
| `/pharma/candidates/[trialId]` | Matched candidates review           | `app/pharma/candidates/[trialId]/page.tsx` |
| `/pharma/discovery/[trialId]`  | Social discovery leads              | `app/pharma/discovery/[trialId]/page.tsx`  |
| `/pharma/fhir/[trialId]`       | FHIR export snapshot                | `app/pharma/fhir/[trialId]/page.tsx`       |

### Supporting Routes

| Route     | Purpose                       |
| --------- | ----------------------------- |
| `/health` | Backend health check          |
| `/docs`   | FastAPI OpenAPI documentation |
| `/redoc`  | FastAPI ReDoc                 |

---

## 7. API ENDPOINTS (BY ROUTER)

### Authentication Router (`/auth`)

```
POST   /auth/register              Register new user
POST   /auth/verify-phone          Verify OTP
POST   /auth/login                 Login, return JWT
GET    /auth/me                    Current user profile
PUT    /auth/me                    Update profile
```

### Trials Router (`/trials`)

```
POST   /trials/create              Create trial (triggers pipeline)
GET    /trials                     List active trials (filtered)
GET    /trials/{id}                Trial detail
GET    /trials/{id}/enrolled       Enrolled patients
```

### Patients Router (`/patient`)

```
GET    /patient/history-form/{trial_id}        Get form schema
POST   /patient/history/{trial_id}             Submit medical history
POST   /patient/symptom-log/{trial_id}         Log symptoms
POST   /patient/wearable-upload/{trial_id}     Upload wearables
GET    /patient/my-trials                      User's enrolled trials
```

### Consent Router (`/consent`)

```
POST   /consent/template/{trial_id}            Upload consent PDF
GET    /consent/form/{trial_id}/{subject}      Get form + fields
POST   /consent/submit/{trial_id}/{subject}    Patient signs consent
GET    /consent/download/{trial_id}/{subject}  Download signed PDF
GET    /consent/audit/{trial_id}               Audit trail
POST   /consent/reveal-identity                Pharma reveals identity
```

### Monitoring Router (`/monitoring`)

```
GET    /monitoring/cohort/{trial_id}           Cohort summary
GET    /monitoring/dropout/{trial_id}          Dropout scores
GET    /monitoring/anomalies/{trial_id}        Anomaly alerts
POST   /monitoring/anomalies/{alert_id}/resolve Mark resolved
```

### Coordinator Router (`/coordinator`)

```
GET    /coordinator/cohort/{trial_id}          Full cohort table
POST   /coordinator/call/{patient_id}          Log call interaction
GET    /coordinator/settings                   User settings
```

### Pharma Router (`/pharma`)

```
GET    /pharma/trials                          Pharma's trials
GET    /pharma/candidates/{trial_id}           Matched candidates
GET    /pharma/analytics/{trial_id}            Trial analytics
POST   /pharma/approve-candidate/{id}          Approve candidate
POST   /pharma/send-dm/{candidate_id}          Send DM via social
```

### Chat Router (`/chat`)

```
POST   /chat/send-message                      Send message
GET    /chat/history/{candidate_id}            Chat history
```

### Questionnaire Router (`/questionnaire`)

```
GET    /questionnaire/schema                   Get form schema
POST   /questionnaire/submit                   Submit questionnaire
```

### WebSocket Endpoints

```
WS     /chatbot/{candidate_id}                 Trust chatbot stream
WS     /ws/dashboard/{trial_id}                Cohort dashboard stream
```

---

## 8. FRONTEND COMPONENTS & UI LIBRARY

### shadcn/ui Primitive Components (40+)

- **Forms:** Input, Textarea, Select, Checkbox, Radio, Toggle, Slider
- **Containers:** Card, Dialog, Alert, Accordion, Collapsible, Sheet, Drawer
- **Lists:** Dropdown Menu, Context Menu, Navigation Menu, Breadcrumb
- **Display:** Badge, Avatar, Pagination, Carousel, Tabs, Table
- **Feedback:** Spinner, Progress, Skeleton, Toast (Sonner)
- **Utilities:** Button Group, Input Group, Field, Empty State

### Landing Page Components

- `LandingHeader` — Navigation with CTA
- `HeroSection` — Lead generation section
- `FeatureGrid` — Platform features showcase
- `ProcessSection` — 3-step patient journey
- `LandingFooter` — Footer with links

### Custom Hooks

- `use-mobile` — Detect mobile viewport
- `useWebRTC` — WebRTC utilities for video/audio

### Theme & Styling

- Dark mode toggle (`mode-toggle.tsx`)
- Theme provider with next-themes
- TailwindCSS 4 with automatic class sorting

---

## 9. DEPLOYMENT & INFRASTRUCTURE

### Docker Services (docker-compose.yml)

**1. Redis** (Caching & Job Queue)

- Port: 6379
- Health check: redis-cli ping

**2. Backend** (FastAPI)

- Port: 8000
- Image: Custom Dockerfile (backend/)
- Depends on: Redis
- Health check: HTTP /health endpoint
- Command: `python start.py`

**3. Celery Worker** (Job Processing)

- Processes long-running tasks
- Depends on: Backend, Redis
- Concurrency: 2 workers
- Command: `celery -A tasks.celery_worker worker`

**4. Celery Beat** (Scheduled Tasks)

- Runs periodic jobs (re-engagement, dropout scoring)
- Depends on: Redis
- Scheduler: PersistentScheduler
- Command: `celery -A tasks.celery_worker beat`

**5. Frontend** (Next.js)

- Port: 3000
- Image: Custom Dockerfile (Dockerfile.frontend)
- Depends on: Backend (healthy)
- Standalone output for production

### Environment Variables

```
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/trialgo
REDIS_URL=redis://redis:6379/0
FRONTEND_URL=http://localhost:3000
CELERY_RESULT_BACKEND=redis://redis:6379/0

# AWS
S3_BUCKET_CONSENT=trialgo-consent-docs
S3_BUCKET_FHIR=trialgo-fhir-bundles
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Communications
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
SENDGRID_API_KEY=...

# Social Media
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=...
TWITTER_API_KEY=...
TWITTER_API_SECRET=...

# LLM
GOOGLE_API_KEY=...  # For Google GenAI
GROQ_API_KEY=...    # For Groq
OPENAI_API_KEY=...  # For OpenAI

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://backend:8000
```

### Running Locally

**Full Stack:**

```bash
docker compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Frontend Only:**

```bash
npm install
npm run dev
```

**Backend Only:**

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Celery Worker:**

```bash
cd backend
celery -A tasks.celery_worker worker --loglevel=info
```

---

## 10. AUTHENTICATION & AUTHORIZATION

### JWT-Based Authentication

- **Token Storage:** `localStorage` (trialgo_token)
- **Headers:** `Authorization: Bearer {token}`
- **Expiration:** Configurable (default 24h)
- **Claims:** user_id, role

### Role-Based Access Control

```
patient     → /dashboard, /trials, /patient/*, /consent
coordinator → /coordinator/cohort, /monitoring, /coordinator/anomalies
pharma      → /pharma/*, /trials/create, /consent/template
```

### Frontend Guard

- `RoleGuard.tsx` — Checks token, redirects if not authenticated
- Protected pages redirect to `/login` or role-specific login

---

## 11. DATA FLOW & WORKFLOWS

### Workflow 1: Patient Registration & Enrollment

```
1. Register (phone OTP verification)
   → /register → POST /auth/register → OTP via Twilio → /auth/verify-phone

2. Onboarding Questionnaire
   → /onboarding/questionnaire → POST /questionnaire/submit

3. Browse & Apply for Trial
   → /trials → /trials/[id] → POST /patient/history/{trial_id}
   → History → FHIR generation → DB enrollment

4. Consent Signing
   → /consent → Pharma uploads template → Patient signs → PDF generated

5. Monitoring
   → /dashboard → View enrolled trials
   → /patient/symptom-log → Weekly entries
   → Upload wearables → Monitored for anomalies
```

### Workflow 2: Pharma Trial Creation & Recruitment

```
1. Create Trial
   → /pharma/create-trial → POST /trials/create
   → Celery queues 12-agent pipeline

2. AI Pipeline Runs
   → Agent 1: Scrapes 18 registries + social media
   → Agent 2: NLP extracts conditions, symptoms
   → Agent 3: Matches to trial criteria
   → Agent 4: Sends outreach DMs
   → Agent 5: Collects history
   → Agent 6: Simplifies consent
   → Agent 12: Fraud detection

3. Review Candidates
   → /pharma/candidates/[trialId] → Match scores ranked
   → /pharma/discovery/[trialId] → Social leads

4. Approve & Reveal Identity
   → Consent signed → POST /consent/reveal-identity
   → Pharma sees real name via identity_map table

5. Monitor Cohort
   → /coordinator/cohort → Live dashboard
   → Dropout scores + anomaly alerts
```

### Workflow 3: Coordinator Patient Monitoring

```
1. Login
   → /coordinator/login

2. View Cohort
   → /coordinator/cohort → Trial selection
   → Overview tab: total, avg score, risk distribution
   → Anomalies tab: active biometric alerts
   → Patients tab: full table with profiles

3. Monitor Dropout Risk
   → Dropout scores (Agent 7) updated periodically
   → RED/AMBER/GREEN tiers
   → Click patient → View history, wearables, symptoms

4. Handle Anomalies
   → Biometric anomalies (Agent 8) triggered on Z-score > 2.5
   → Coordinator resolves manually → /monitoring/anomalies/{id}/resolve

5. Real-time Updates
   → WebSocket /ws/dashboard/{trial_id}
   → Enrolled count, anomaly feed, dropout updates every 10s
```

---

## 12. SECURITY CONSIDERATIONS

### Implemented

- ✅ JWT authentication with Bcrypt password hashing
- ✅ Phone OTP verification (SMS via Twilio)
- ✅ CORS configured for trusted origins
- ✅ SQL injection protection (SQLAlchemy parameterization)
- ✅ Role-based access control on all protected routes
- ✅ Identity encryption via hashing (identity_map table)
- ✅ Immutable consent audit logs

### Recommended Enhancements

- ⚠️ Enable HTTPS in production
- ⚠️ Encrypt PII at rest (identity_map fields)
- ⚠️ Implement rate limiting on auth endpoints
- ⚠️ Add request signing for social API calls
- ⚠️ Audit logging for all pharma actions
- ⚠️ Two-factor authentication for coordinator/pharma

---

## 13. COMMON OPERATIONS & TASKS

### View API Documentation

```
http://localhost:8000/docs     # Swagger UI
http://localhost:8000/redoc    # ReDoc
```

### Monitor Celery Tasks

```bash
# In backend directory
celery -A tasks.celery_worker inspect active
celery -A tasks.celery_worker inspect stats
```

### Access Database

```bash
# Connect to PostgreSQL
psql -U trialgo_user -d trialgo -h localhost

# View tables
\dt
\d trials  # Describe table
```

### Rebuild After Changes

```bash
docker compose build frontend
docker compose up -d
```

### Check Service Health

```bash
curl http://localhost:8000/health
curl http://localhost:3000
```

---

## 14. KNOWN LIMITATIONS & NOTES

1. **Database Migrations** — Handled by Alembic, run on container startup
2. **Static Data** — No placeholder/demo data; all pages show live backend state
3. **Real-time Limits** — WebSocket updates every 10 seconds (configurable)
4. **API Timeout** — Registry scraping has 20-second async timeout
5. **Storage** — All files (consent PDFs, FHIR exports) stored in S3
6. **Celery Persistence** — Results persisted in Redis (not suitable for very long-term history)
7. **Rate Limiting** — Not yet implemented; recommended for production
8. **Encrypted PII** — Identity data stored plaintext in identity_map (should be encrypted)

---

## 15. TESTING & VALIDATION

### Frontend Build & Lint

```bash
npm run build
npm run lint
npm run typecheck
```

### Backend Health

```bash
curl http://localhost:8000/health
```

### Smoke Tests (Routes to validate)

```
GET  /                          # Landing
GET  /register                  # Registration
GET  /login                     # Patient login
GET  /trials                    # Trial list
GET  /trials/1                  # Trial detail
GET  /dashboard                 # Patient dashboard
GET  /coordinator/login         # Coordinator login
GET  /coordinator/cohort        # Cohort dashboard
GET  /pharma/login              # Pharma login
GET  /pharma/analytics          # Pharma analytics
GET  /pharma/candidates/1       # Candidates
GET  /consent                   # Consent form
GET  /pharma/fhir/1             # FHIR export
```

---

## 16. SUMMARY TABLE

| Aspect                 | Details                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| **Project Type**       | Full-Stack Clinical Trial Platform                                 |
| **Frontend Framework** | Next.js 16 + React 19 + TypeScript                                 |
| **Backend Framework**  | FastAPI (Python async)                                             |
| **Database**           | PostgreSQL 15                                                      |
| **Task Queue**         | Celery 5.3.6 with Redis                                            |
| **File Storage**       | AWS S3                                                             |
| **Authentication**     | JWT + OTP (SMS)                                                    |
| **Real-time**          | WebSocket (Socket.io)                                              |
| **API Routes**         | 40+ endpoints across 8 routers                                     |
| **Database Tables**    | 20+ tables (users, trials, patients, consent, monitoring)          |
| **AI Agents**          | 12 specialized agents (scraping, NLP, matching, monitoring, fraud) |
| **Trial Registries**   | 18 international databases supported                               |
| **Deployment**         | Docker Compose (5 services)                                        |
| **Frontend Port**      | 3000                                                               |
| **Backend Port**       | 8000                                                               |
| **Code Quality**       | ESLint, TypeScript, Prettier                                       |

---

**End of Analysis**
