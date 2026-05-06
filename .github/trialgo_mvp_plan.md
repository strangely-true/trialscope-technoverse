╔══════════════════════════════════════════════════════════════════════╗
║           TRIALGO — MASTER BUILD PROMPT & EXECUTION PLAN            ║
║                    END TO END WORKING SYSTEM                        ║
╚══════════════════════════════════════════════════════════════════════╝

YOU ARE A SENIOR FULL STACK AI ENGINEER. BUILD TRIALGO COMPLETELY FROM
SCRATCH AS A PRODUCTION-READY WORKING APPLICATION. EVERY COMPONENT MUST
BE FUNCTIONAL, INTEGRATED AND TESTABLE. DO NOT MOCK ANY DATA UNLESS
EXPLICITLY STATED. FOLLOW THIS PLAN IN EXACT ORDER.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0 — PROJECT SETUP & FOLDER STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create this exact folder structure:

trialgo/
├── frontend/                  # React + Tailwind CSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PatientApp/
│   │   │   ├── CoordinatorDashboard/
│   │   │   └── PharmaPortal/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/          # API call functions
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                   # FastAPI Python
│   ├── main.py                # Entry point
│   ├── routers/
│   │   ├── trials.py
│   │   ├── patients.py
│   │   ├── consent.py
│   │   ├── monitoring.py
│   │   └── pharma.py
│   ├── agents/
│   │   ├── agent1_scraper.py
│   │   ├── agent2_nlp.py
│   │   ├── agent3_matching.py
│   │   ├── agent4_outreach.py
│   │   ├── agent5_history.py
│   │   ├── agent6_consent.py
│   │   ├── agent7_dropout.py
│   │   ├── agent8_anomaly.py
│   │   ├── agent9_chatbot.py
│   │   ├── agent10_reengagement.py
│   │   ├── agent11_multilingual.py
│   │   └── agent12_fraud.py
│   ├── models/                # Pydantic schemas
│   ├── db/
│   │   ├── database.py        # PostgreSQL connection
│   │   └── migrations/        # Alembic migrations
│   ├── ml/
│   │   ├── dropout_model.py
│   │   ├── anomaly_model.py
│   │   └── matching_model.py
│   ├── services/
│   │   ├── fhir_service.py
│   │   ├── twilio_service.py
│   │   ├── sendgrid_service.py
│   │   └── s3_service.py
│   ├── tasks/                 # Celery tasks
│   │   └── celery_worker.py
│   ├── auth/
│   │   └── jwt_handler.py
│   ├── requirements.txt
│   └── .env
│
├── docker-compose.yml
├── .env.example
└── README.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — ENVIRONMENT & DEPENDENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BACKEND requirements.txt — install all of these:

fastapi==0.110.0
uvicorn==0.29.0
sqlalchemy==2.0.29
alembic==1.13.1
psycopg2-binary==2.9.9
pydantic==2.6.4
python-jose==3.3.0         # JWT
passlib==1.7.4             # password hashing
celery==5.3.6
redis==5.0.3
boto3==1.34.74             # AWS S3
scrapy==2.11.1
beautifulsoup4==4.12.3
selenium==4.19.0
praw==7.7.1                # Reddit API
tweepy==4.14.0             # Twitter API
requests==2.31.0
spacy==3.7.4
scispacy==0.5.4
pandas==2.2.1
numpy==1.26.4
scikit-learn==1.4.1
scipy==1.13.0
langchain==0.1.16
langchain-community==0.0.38
python-multipart==0.0.9    # file uploads
PyPDF2==3.0.1
fhirclient==4.1.0
twilio==8.13.0
sendgrid==6.11.0
websockets==12.0
httpx==0.27.0

FRONTEND package.json dependencies:

react, react-dom, react-router-dom
axios
tailwindcss
@headlessui/react
recharts                   # charts for dashboard
socket.io-client           # websocket
react-hook-form
react-query
react-toastify

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — DATABASE SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build db/database.py with SQLAlchemy connection to PostgreSQL.

Create these exact tables using Alembic migrations:

TABLE: users
  id, email, hashed_password, role (patient/coordinator/pharma),
  created_at, is_active

TABLE: trials
  id, pharma_user_id, disease, stage, age_min, age_max,
  gender, location_preference, exclusion_criteria,
  patients_needed, status, created_at

TABLE: raw_medical_data
  id, source, raw_json, ingested_at

TABLE: social_raw_posts
  id, source (reddit/twitter/forum), user_handle,
  post_text, post_date, scraped_at

TABLE: extracted_candidates
  id, source, user_handle, extracted_conditions,
  extracted_symptoms, severity, duration, location,
  confidence_score, created_at

TABLE: matched_candidates
  id, trial_id, candidate_id, match_score, match_tier,
  status (pending_consent/consent_given/opted_out/
          no_response/enrolled/fraud_flagged), created_at

TABLE: consent_audit_log
  id, candidate_id, trial_id, channel, message_sent,
  response, timestamp (append only — no updates allowed)

TABLE: verified_patients
  id, hash_id, trial_id, fhir_bundle_json,
  report_s3_url, wearable_data_s3_url,
  match_score, status, enrolled_at

TABLE: dropout_scores
  id, patient_id, trial_id, score, risk_tier,
  days_since_login, symptom_logs_week,
  wearable_uploads_week, scored_at

TABLE: anomaly_alerts
  id, patient_id, trial_id, biometric_type,
  patient_value, cohort_mean, z_score,
  alert_tier, created_at, resolved

TABLE: identity_map
  id, hash_id, real_name, email, phone,
  secondary_consent_given
  (RESTRICTED — admin access only, encrypted column)

TABLE: fraud_flags
  id, candidate_id, reason, flagged_at, resolved

TABLE: symptom_logs
  id, patient_id, trial_id, symptoms_json,
  severity, logged_at

TABLE: wearable_data
  id, patient_id, trial_id, heart_rate, glucose,
  steps, temperature, blood_pressure, recorded_at

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — AUTH SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build auth/jwt_handler.py:
  create_access_token(data, expires_delta)
  verify_token(token)
  get_current_user(token) — dependency injection

Three roles with RBAC:
  patient — can only access their own data
  coordinator — can view all patients in their trials
  pharma — can post trials and view matched candidates

Endpoints:
  POST /auth/register
  POST /auth/login → returns JWT token
  GET  /auth/me → returns current user info

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — BUILD ALL 12 AGENTS IN ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AGENT 1 — agent1_scraper.py

  Function: run_scraper(trial_id, criteria_json)

  Step 1: Call ClinicalTrials.gov
    url = "https://clinicaltrials.gov/api/v2/studies"
    params = {condition: criteria_json.disease,
              status: "RECRUITING"}
    response = requests.get(url, params=params)
    Save each study to raw_medical_data table

  Step 2: Call WHO ICTRP
    url = "https://trialsearch.who.int/Trial2.aspx"
    Parse XML response with ElementTree
    Save to raw_medical_data table

  Step 3: Scrape Reddit with PRAW
    reddit = praw.Reddit(client_id, client_secret, user_agent)
    subreddits = map disease to relevant subreddit list
    for post in reddit.subreddit(sub).new(limit=500):
        save post.title + post.selftext to social_raw_posts

  Step 4: Scrape Twitter with Tweepy
    client = tweepy.Client(bearer_token)
    query = f"{disease} -is:retweet lang:en"
    tweets = client.search_recent_tweets(query, max_results=100)
    save each tweet to social_raw_posts

  Step 5: Scrape PatientsLikeMe with Scrapy spider
    CrawlSpider targeting public forum threads
    Save post text and username to social_raw_posts

  After all sources done:
    push job to Celery queue → trigger Agent 2

─────────────────────────────────────────────────────────────────────

AGENT 2 — agent2_nlp.py

  Function: run_nlp_extraction(trial_id)

  Load scispaCy model:
    nlp = spacy.load("en_ner_bc5cdr_md")

  For each row in social_raw_posts:
    Step 1: Clean text
      remove URLs, HTML tags, emojis with regex
    Step 2: Run NER
      doc = nlp(cleaned_text)
      extract DISEASE, SYMPTOM, SEVERITY, DURATION entities
    Step 3: Normalise to ICD-10
      use local ICD-10 dictionary JSON file to map terms
    Step 4: Build candidate JSON
      {source, user_handle, extracted_conditions,
       extracted_symptoms, severity, duration,
       location, confidence_score}
    Step 5: Save to extracted_candidates table

  After all posts processed:
    push job → trigger Agent 3

─────────────────────────────────────────────────────────────────────

AGENT 3 — agent3_matching.py

  Function: run_matching(trial_id)

  Load trial criteria from trials table
  Load all extracted_candidates for this trial
  Load all raw_medical_data FHIR records

  Build feature vectors:
    condition_match (0 or 1)
    symptom_overlap_score (0.0 to 1.0)
    severity_match (0 or 1)
    age_in_range (0 or 1)
    location_score (0.0 to 1.0)
    exclusion_clear (0 or 1)

  Use sklearn cosine_similarity to score each candidate
  against trial requirement vector

  Deduplication:
    hash user_handle to detect same person
    across multiple sources — keep highest score

  Tier assignment:
    score >= 0.85 → HIGH
    score 0.60-0.84 → MEDIUM
    score < 0.60 → skip

  Save HIGH and MEDIUM to matched_candidates table
  status = pending_consent

  Trigger Agent 12 (fraud check) before Agent 4

─────────────────────────────────────────────────────────────────────

AGENT 12 — agent12_fraud.py

  Function: run_fraud_check(trial_id)

  For each matched_candidate:
    Check 1: Duplicate detection
      hash email/username against all existing verified_patients
      if match found → flag as duplicate

    Check 2: Inconsistency detection
      if age reported on Twitter ≠ age in FHIR record → flag

    Check 3: Bot detection
      if Twitter account age < 30 days → flag
      if Reddit karma < 10 → flag

    Check 4: Impossible symptom combinations
      use rule-based checker against ICD-10 logic

  Flagged candidates → status = fraud_flagged
  Save to fraud_flags table
  Clean candidates → trigger Agent 4

─────────────────────────────────────────────────────────────────────

AGENT 4 — agent4_outreach.py

  Function: run_outreach(trial_id)

  For each clean matched_candidate (HIGH + MEDIUM):
    Step 1: Generate message with LangChain
      template = load plain language template
      fill {condition}, {trial_benefit}, {link}

    Step 2: Select channel
      if source == reddit → send DM via PRAW
      if source == twitter → send DM via Tweepy
      if email in FHIR → send via SendGrid
      if phone in FHIR → send SMS via Twilio

    Step 3: Log every message to consent_audit_log
      (append only — never update this table)

    Step 4: Start webhook listener on FastAPI
      POST /consent/respond
      body: {candidate_id, response: YES/NO}

    Step 5: Process response
      YES → update status to consent_given
             trigger Agent 9 (Trust Chatbot)
      NO  → update status to opted_out
      7 days no response → status = no_response

─────────────────────────────────────────────────────────────────────

AGENT 9 — agent9_chatbot.py

  Function: run_trust_chatbot(candidate_id)

  Triggered after candidate says YES

  Build LangChain conversational chain:
    system_prompt = "You are a friendly clinical trial
    assistant. Answer questions about the trial honestly
    in simple language. Never give medical advice."

  Expose via WebSocket endpoint:
    WS /chatbot/{candidate_id}

  Patient asks questions → LLM answers in real time
  Session ends when patient clicks
  "I am ready to proceed" button

  Log full conversation to consent_audit_log
  Trigger Agent 6

─────────────────────────────────────────────────────────────────────

AGENT 6 — agent6_consent.py

  Function: run_consent_simplification(trial_id, candidate_id)

  Step 1: Pharma uploads consent PDF to AWS S3
    POST /consent/upload → saves to s3://trialgo-consent-docs/

  Step 2: Extract text
    PyPDF2.PdfReader → extract all pages as string

  Step 3: Send to LangChain
    prompt = "Summarise this medical consent document in
    plain English bullet points. Grade 8 reading level.
    Include: what patient must do, risks, benefits,
    how to withdraw. Keep each point under 20 words."
    chain = LLMChain(llm=open_source_llm, prompt=prompt)
    summary = chain.run(consent_text)

  Step 4: Show patient both versions
    Simple summary first
    Full PDF link below

  Step 5: Patient clicks I Agree or I Disagree
    Log decision to consent_audit_log with timestamp
    If AGREE → trigger Agent 5
    If DISAGREE → status = withdrawn

─────────────────────────────────────────────────────────────────────

AGENT 11 — agent11_multilingual.py

  Function: translate_content(text, target_language)

  Supported languages:
    Hindi, Tamil, Telugu, Bengali, Marathi,
    Kannada, Malayalam, Gujarati, English

  Use LangChain with open source multilingual LLM
  (mBART or NLLB-200 model via HuggingFace)

  Apply to:
    Consent summary → translated before showing patient
    Chatbot responses → translated in real time
    Symptom log form labels → translated on UI
    Outreach messages → translated per patient location

  Patient selects language on registration
  All content auto-translated from that point

─────────────────────────────────────────────────────────────────────

AGENT 5 — agent5_history.py

  Function: collect_patient_history(candidate_id)

  Step 1: Send patient a secure form link
    GET /patient/history-form/{candidate_id}
    React form with fields:
      full_name, age, gender, city, country
      diagnosed_conditions (multi-select)
      symptom_description, duration
      current_medications (text)
      previous_treatments (text)
      test_reports (PDF upload)
      wearable_data (JSON upload)
      doctor_contact (optional)

  Step 2: On submit POST /patient/history/submit
    Upload PDFs to s3://trialgo-patient-reports/
    Upload wearable JSON to s3://trialgo-wearable-data/

  Step 3: De-identify
    import hashlib
    hash_id = hashlib.sha256(full_name + email).hexdigest()
    Store real identity in identity_map (encrypted)
    All other tables use hash_id only

  Step 4: Convert to FHIR R4
    Use fhirclient to build Patient resource bundle
    Add Condition, Observation, MedicationStatement resources
    Save FHIR JSON to s3://trialgo-fhir-bundles/
    Save s3 URL to verified_patients table

  Step 5: Completeness check
    Required fields validator
    If incomplete → send reminder via Agent 10
    If complete → status = enrolled
                  trigger Agents 7 and 8 monitoring

─────────────────────────────────────────────────────────────────────

AGENT 7 — agent7_dropout.py

  Function: run_dropout_prediction()
  Schedule: Celery beat every 24 hours

  For every enrolled patient:
    Pull features from last 7 days:
      days_since_last_login
      symptom_logs_this_week (count from symptom_logs)
      wearable_uploads_this_week (count from wearable_data)
      messages_responded_to (% from consent_audit_log)
      appointments_missed (count)

    Load pre-trained sklearn LogisticRegression model
    (train on Synthea engagement simulation data)

    score = model.predict_proba([features])[0][1]

    if score >= 0.75 → RED
      push WebSocket alert to coordinator dashboard
      trigger Agent 10 (re-engagement)
    if 0.50 <= score < 0.75 → AMBER
      push AMBER flag to dashboard
    if score < 0.50 → GREEN

    Save to dropout_scores table

─────────────────────────────────────────────────────────────────────

AGENT 10 — agent10_reengagement.py

  Function: run_reengagement(patient_id, risk_tier)

  Triggered by Agent 7 on RED or AMBER flag

  RED action:
    Send personalised SMS via Twilio
    "Hi, we noticed you haven't logged in recently.
     Your health journey matters. Need any help?
     Reply YES to speak to your coordinator."
    Add to coordinator intervention queue (priority HIGH)
    Coordinator sees patient at top of dashboard list

  AMBER action:
    Send gentle email reminder via SendGrid
    Add to coordinator queue (priority MEDIUM)

  Track response:
    If patient responds → update dropout_scores
    If no response in 48 hours → escalate to RED

─────────────────────────────────────────────────────────────────────

AGENT 8 — agent8_anomaly.py

  Function: run_anomaly_detection(patient_id, wearable_json)
  Trigger: Every time patient uploads wearable data

  Parse wearable_json:
    heart_rate, glucose, steps, temperature, blood_pressure

  For each biometric:
    Pull cohort mean and std from wearable_data table
    for all patients in same trial

    z = (patient_value - cohort_mean) / cohort_std

    if abs(z) > 3.0:
      tier = RED if abs(z) > 4.5 else AMBER
      Save to anomaly_alerts table
      Push WebSocket notification to coordinator dashboard
      Send SMS to patient via Twilio
      "We noticed an unusual reading in your health data.
       Please contact your coordinator."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — FASTAPI BACKEND MAIN ROUTERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

routers/trials.py
  POST /trials/create
    → save trial to DB
    → push Celery job → Agent 1

  GET /trials/{trial_id}/candidates
    → return matched_candidates ordered by match_score

  GET /trials/{trial_id}/enrolled
    → return verified_patients for this trial

routers/patients.py
  GET  /patient/history-form/{candidate_id}
  POST /patient/history/submit
  POST /patient/symptom-log
  POST /patient/wearable-upload → triggers Agent 8
  GET  /patient/my-trial-info

routers/consent.py
  POST /consent/upload → pharma uploads PDF to S3
  POST /consent/respond → YES/NO from patient
  GET  /consent/audit/{candidate_id}

routers/monitoring.py
  GET  /monitoring/dropout/{trial_id}
  GET  /monitoring/anomalies/{trial_id}
  GET  /monitoring/cohort/{trial_id}
  WS   /ws/dashboard/{trial_id} → WebSocket stream

routers/pharma.py
  GET  /pharma/trials
  GET  /pharma/candidates/{trial_id}
  POST /pharma/request-identity/{candidate_id}
    → only works if patient gave secondary consent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6 — CELERY TASK QUEUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

tasks/celery_worker.py

  app = Celery('trialgo', broker='redis://localhost:6379/0')

  @app.task
  def task_run_scraper(trial_id, criteria): ...

  @app.task
  def task_run_nlp(trial_id): ...

  @app.task
  def task_run_matching(trial_id): ...

  @app.task
  def task_run_fraud(trial_id): ...

  @app.task
  def task_run_outreach(trial_id): ...

  Celery beat schedule:
  @app.on_after_configure.connect
  def setup_periodic_tasks(sender):
    sender.add_periodic_task(
      86400.0,               # every 24 hours
      task_dropout_prediction.s(),
    )

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7 — FRONTEND BUILD (React + Tailwind)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SURFACE 1 — Patient Web App
  Pages:
    /register → role selection + signup form
    /login
    /trials → list of open trials with match scores
    /trial/{id} → trial details + consent flow
    /consent → simplified consent with I Agree button
    /history → medical history upload form
    /dashboard → symptom log + wearable upload
    /chatbot → live chatbot (WebSocket)

SURFACE 2 — Coordinator Dashboard
  Pages:
    /coordinator/login
    /coordinator/cohort/{trial_id}
      → table of all patients with RAG status badges
      → RED patients at top of list
      → click patient → full profile view
    /coordinator/anomalies
      → real time feed via WebSocket
    /coordinator/audit/{patient_id}
      → full consent audit trail

SURFACE 3 — Pharma Portal
  Pages:
    /pharma/login
    /pharma/create-trial → trial criteria form
    /pharma/trials → list of their active trials
    /pharma/candidates/{trial_id}
      → ranked list of verified patients
      → download FHIR bundle button
      → request identity reveal button
    /pharma/analytics
      → enrollment rate chart (Recharts)
      → dropout trend chart (Recharts)
      → cohort diversity chart (Recharts)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 8 — ML MODEL TRAINING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ml/dropout_model.py
  Load Synthea patient dataset (FHIR JSON)
  Engineer features:
    login_frequency, symptom_log_count,
    wearable_upload_count, response_rate,
    appointments_missed
  Label: dropped_out (0 or 1)
  Train: LogisticRegression(max_iter=1000)
  Evaluate: classification_report, roc_auc_score
  Save model: joblib.dump(model, 'dropout_model.pkl')

ml/matching_model.py
  Build feature vectors for candidates and trials
  Use TfidfVectorizer on symptom text
  Use cosine_similarity from sklearn.metrics.pairwise
  Return ranked scores

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 9 — DOCKER & DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

docker-compose.yml services:

  db:
    image: postgres:15
    env: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
    volumes: postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    command: uvicorn main:app --host 0.0.0.0 --port 8000
    depends_on: db, redis
    env_file: .env

  celery_worker:
    build: ./backend
    command: celery -A tasks.celery_worker worker --loglevel=info
    depends_on: db, redis

  celery_beat:
    build: ./backend
    command: celery -A tasks.celery_worker beat --loglevel=info
    depends_on: redis

  frontend:
    build: ./frontend
    command: npm start
    ports: 3000:3000

Run entire system:
  docker-compose up --build

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 10 — ENV VARIABLES (.env)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE_URL=postgresql://user:pass@db:5432/trialgo
REDIS_URL=redis://redis:6379/0
JWT_SECRET=your_secret_key_here
JWT_ALGORITHM=HS256

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_CONSENT=trialgo-consent-docs
S3_BUCKET_REPORTS=trialgo-patient-reports
S3_BUCKET_WEARABLE=trialgo-wearable-data
S3_BUCKET_FHIR=trialgo-fhir-bundles

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

SENDGRID_API_KEY=

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=TrialGoBot/1.0

TWITTER_BEARER_TOKEN=

FHIR_BASE_URL=https://hapi.fhir.org/baseR4

HF_MODEL_NAME=facebook/nllb-200-distilled-600M

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE INTEGRATION TEST FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run this test to verify full system end to end:

1. Pharma registers → POST /auth/register (role=pharma)
2. Pharma creates trial → POST /trials/create
   {disease: "blood cancer", stage: "2", patients_needed: 10}
3. Verify Celery picks up job → check logs
4. Agent 1 runs → verify social_raw_posts table has data
5. Agent 2 runs → verify extracted_candidates has NLP output
6. Agent 12 runs → verify fraud flags working
7. Agent 3 runs → verify matched_candidates scored and ranked
8. Agent 4 runs → verify outreach messages sent (check Twilio logs)
9. Simulate patient YES response → POST /consent/respond
10. Agent 9 chatbot → open WS /chatbot/{id} → ask a question
11. Agent 6 consent → upload PDF → verify summary generated
12. Agent 5 history → submit form → verify FHIR bundle in S3
13. Agent 7 dropout → manually trigger → verify score in DB
14. Agent 8 anomaly → upload wearable JSON with high heart rate
    → verify alert created and WebSocket fires
15. Coordinator dashboard → verify RED patient appears at top
16. Pharma portal → verify candidate list with FHIR download