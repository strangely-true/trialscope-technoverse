"""
Agent 10 — Re-engagement Agent
Triggered by Agent 7 on RED/AMBER dropout risk flags.
Sends personalised SMS or email reminders.
"""
from sqlalchemy.orm import Session
from models.models import VerifiedPatient, DropoutScore
from services.twilio_service import send_sms
from services.sendgrid_service import send_email
from models.models import IdentityMap


def run_reengagement(patient_id: int, risk_tier: str, db: Session) -> dict:
    """Send re-engagement message based on risk tier."""
    patient = db.query(VerifiedPatient).filter(VerifiedPatient.id == patient_id).first()
    if not patient:
        return {"error": "Patient not found"}

    identity = db.query(IdentityMap).filter(IdentityMap.hash_id == patient.hash_id).first()

    if risk_tier == "RED":
        sms_body = (
            "Hi! We noticed you haven't logged in recently to your TrialGo trial. "
            "Your health journey matters to us. Need any help? "
            "Reply YES to speak to your coordinator. Reply STOP to unsubscribe."
        )
        if identity and identity.phone:
            result = send_sms(to=identity.phone, body=sms_body)
        else:
            result = {"status": "skipped", "reason": "No phone number on file"}

        print(f"[Agent10] RED re-engagement for patient {patient_id}: {result}")
        return {"tier": "RED", "channel": "sms", "result": result}

    elif risk_tier == "AMBER":
        subject = "We miss you — your trial update"
        body = (
            "Hi there,\n\n"
            "Just a gentle reminder to log your symptoms this week in your TrialGo dashboard.\n"
            "Staying engaged helps ensure the best outcomes for you and the entire trial cohort.\n\n"
            "Log in at: http://localhost:3000/dashboard\n\n"
            "Best,\nThe TrialGo Team"
        )
        if identity and identity.email:
            result = send_email(to=identity.email, subject=subject, body=body)
        else:
            result = {"status": "skipped", "reason": "No email on file"}

        print(f"[Agent10] AMBER re-engagement for patient {patient_id}: {result}")
        return {"tier": "AMBER", "channel": "email", "result": result}

    return {"error": f"Unknown risk tier: {risk_tier}"}
