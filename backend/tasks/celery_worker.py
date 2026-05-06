"""
Celery Task Queue — orchestrates the full 12-agent pipeline.
"""
from celery import Celery
from celery.schedules import crontab
import os
import sys
from dotenv import load_dotenv

# Ensure /app is in Python path for subprocess workers
sys.path.insert(0, '/app')

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "sqla+sqlite:///celery_broker.db")
BACKEND_URL = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL if REDIS_URL.startswith("redis") else "db+sqlite:///celery_backend.db")

app = Celery("trialgo", broker=REDIS_URL, backend=BACKEND_URL)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
)

@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=8, minute=0),
        task_send_daily_reminders.s(),
        name="daily wearable reminder 8am"
    )

@app.task
def task_send_daily_reminders():
    """
    Runs every day at 8am
    Sends SMS to every enrolled patient
    who has NOT uploaded wearable data today
    """
    from db.database import SessionLocal
    from models.models import User, Trial, VerifiedPatient, WearableData
    from twilio.rest import Client
    import os
    from datetime import date

    db = SessionLocal()
    client = Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN")
    )

    today = date.today()

    enrolled_patients = db.query(VerifiedPatient).filter(
        VerifiedPatient.status == "enrolled"
    ).all()

    for patient in enrolled_patients:
        user = db.query(User).filter(
            User.id == patient.patient_id
        ).first()

        if not user or not user.phone_number:
            continue
        if not user.phone_verified:
            continue

        already_uploaded = db.query(WearableData).filter(
            WearableData.patient_id == patient.patient_id,
            WearableData.recorded_at >= today
        ).first()

        if already_uploaded:
            continue

        trial = db.query(Trial).filter(
            Trial.id == patient.trial_id
        ).first()

        trial_name = trial.disease if trial else "your trial"

        message = (
            f"Hi! This is TrialGo. "
            f"Please upload your daily health data "
            f"for {trial_name} today. "
            f"Open the app: http://localhost:3000/dashboard "
            f"Your data helps the research team monitor "
            f"your health. Reply STOP to unsubscribe."
        )

        try:
            client.messages.create(
                body=message,
                from_=os.getenv("TWILIO_PHONE_NUMBER"),
                to=user.phone_number
            )
        except Exception as e:
            print(f"SMS failed for {user.id}: {e}")
            continue

    db.close()


def _get_db():
    """Get a synchronous DB session for Celery tasks."""
    from db.database import SessionLocal
    return SessionLocal()


# ─── Pipeline Tasks ───────────────────────────────────────────────────────────

@app.task(bind=True, name="tasks.run_pipeline", max_retries=3)
def task_run_pipeline(self, trial_id: int, criteria: dict):
    """Master pipeline: Agent 1 → 2 → 12 → 3 → 4."""
    db = _get_db()
    try:
        from agents.agent1_scraper import run_scraper
        from agents.agent2_nlp import run_nlp_extraction
        from agents.agent3_matching import run_matching
        from agents.agent12_fraud import run_fraud_check
        from agents.agent4_outreach import run_outreach

        import asyncio
        print(f"[Pipeline] Starting for trial {trial_id}")
        asyncio.run(run_scraper(trial_id, criteria, db))
        run_nlp_extraction(trial_id, db)
        run_matching(trial_id, db)
        run_fraud_check(trial_id, db)
        run_outreach(trial_id, db)
        print(f"[Pipeline] Complete for trial {trial_id}")
        return {"status": "complete", "trial_id": trial_id}
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@app.task(bind=True, name="tasks.run_scraper")
def task_run_scraper(self, trial_id: int, criteria: dict):
    db = _get_db()
    try:
        import asyncio
        return asyncio.run(run_scraper(trial_id, criteria, db))
    finally:
        db.close()


@app.task(bind=True, name="tasks.run_nlp")
def task_run_nlp(self, trial_id: int):
    db = _get_db()
    try:
        from agents.agent2_nlp import run_nlp_extraction
        return run_nlp_extraction(trial_id, db)
    finally:
        db.close()


@app.task(bind=True, name="tasks.run_matching")
def task_run_matching(self, trial_id: int):
    db = _get_db()
    try:
        from agents.agent3_matching import run_matching
        return run_matching(trial_id, db)
    finally:
        db.close()


@app.task(bind=True, name="tasks.run_fraud")
def task_run_fraud(self, trial_id: int):
    db = _get_db()
    try:
        from agents.agent12_fraud import run_fraud_check
        return run_fraud_check(trial_id, db)
    finally:
        db.close()


@app.task(bind=True, name="tasks.run_outreach")
def task_run_outreach(self, trial_id: int):
    db = _get_db()
    try:
        from agents.agent4_outreach import run_outreach
        return run_outreach(trial_id, db)
    finally:
        db.close()


@app.task(bind=True, name="tasks.run_dropout_prediction")
def task_dropout_prediction(self):
    """Scheduled: runs every 24 hours for all enrolled patients."""
    db = _get_db()
    try:
        from agents.agent7_dropout import run_dropout_prediction
        return run_dropout_prediction(db)
    finally:
        db.close()


# ─── Celery Beat Schedule ────────────────────────────────────────────────────

app.conf.beat_schedule = {
    "dropout-prediction-daily": {
        "task": "tasks.run_dropout_prediction",
        "schedule": 86400.0,  # every 24 hours
    },
}
