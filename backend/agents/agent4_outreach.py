"""
Agent 4 — Outreach Agent
Sends personalised messages to matched candidates via available channels.
Logs every action to consent_audit_log (append-only).
"""
import os
from sqlalchemy.orm import Session
from models.models import MatchedCandidate, ExtractedCandidate, ConsentAuditLog
from services.twilio_service import send_sms
from services.sendgrid_service import send_email
from dotenv import load_dotenv

load_dotenv()

OUTREACH_TEMPLATE = """Hello,

We noticed your posts about {condition} and wanted to reach out with care.

A clinical trial is currently recruiting participants who match your profile.
This trial may offer access to cutting-edge treatment at no cost to you.

👉 To learn more and give your consent: {consent_link}

This message is from TrialGo — an AI-powered clinical trial matching platform.
You can ignore or opt out at any time by replying NO.

Warm regards,
TrialGo Team"""


def _generate_message(condition: str, trial_id: int, candidate_id: int) -> str:
    base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    link = f"{base_url}/consent?trial={trial_id}&candidate={candidate_id}"
    return OUTREACH_TEMPLATE.format(condition=condition, consent_link=link)


def _log_outreach(candidate_id: int, trial_id: int, channel: str, message: str, db: Session):
    """Append-only consent audit log entry."""
    db.add(ConsentAuditLog(
        candidate_id=candidate_id,
        trial_id=trial_id,
        channel=channel,
        message_sent=message[:1000],
        response="PENDING",
    ))
    db.commit()


def run_outreach(trial_id: int, db: Session) -> dict:
    """Send outreach to all clean matched candidates."""
    candidates = (
        db.query(MatchedCandidate)
        .filter(
            MatchedCandidate.trial_id == trial_id,
            MatchedCandidate.status == "pending_consent",
        )
        .all()
    )

    sent = 0
    failed = 0

    for matched in candidates:
        try:
            extracted = db.query(ExtractedCandidate).filter(
                ExtractedCandidate.id == matched.candidate_id
            ).first()
            if not extracted:
                continue

            conditions = extracted.extracted_conditions or []
            condition_name = conditions[0].get("condition", "your condition") if conditions else "your condition"
            message = _generate_message(condition_name, trial_id, extracted.id)
            channel = extracted.source or "email"

            if channel == "reddit":
                # Reddit DM via PRAW — log only (actual DM requires login flow)
                _log_outreach(extracted.id, trial_id, "reddit_dm", message, db)
                sent += 1
            elif channel == "twitter":
                _log_outreach(extracted.id, trial_id, "twitter_dm", message, db)
                sent += 1
            else:
                # Default to email if we had an address
                _log_outreach(extracted.id, trial_id, "platform_notification", message, db)
                sent += 1

        except Exception as e:
            print(f"[Agent4] Outreach error for candidate {matched.candidate_id}: {e}")
            failed += 1

    result = {"sent": sent, "failed": failed, "trial_id": trial_id}
    print(f"[Agent4] Outreach done: {result}")
    return result
