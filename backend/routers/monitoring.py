"""
Monitoring router — dropout scores, anomaly alerts, WebSocket dashboard.
Also serves coordinator-specific routes.
"""
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
import asyncio
from db.database import get_db
from models.models import DropoutScore, AnomalyAlert, VerifiedPatient, ConsentSubmission
from models.schemas import DropoutScoreOut, AnomalyAlertOut
from auth.jwt_handler import require_coordinator, get_current_user

router = APIRouter(tags=["Monitoring"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, trial_id: int):
        await websocket.accept()
        self.active_connections.setdefault(trial_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, trial_id: int):
        if trial_id in self.active_connections:
            try:
                self.active_connections[trial_id].remove(websocket)
            except ValueError:
                pass

    async def broadcast(self, trial_id: int, message: dict):
        for ws in self.active_connections.get(trial_id, []):
            try:
                await ws.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


# ─── Monitoring routes (prefix /monitoring) ───────────────────────────────────

monitoring_router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


@monitoring_router.get("/dropout/{trial_id}", response_model=List[DropoutScoreOut])
def get_dropout_scores(trial_id: int, db: Session = Depends(get_db), current_user=Depends(require_coordinator)):
    return db.query(DropoutScore).filter(DropoutScore.trial_id == trial_id).order_by(DropoutScore.scored_at.desc()).all()


@monitoring_router.get("/anomalies/{trial_id}", response_model=List[AnomalyAlertOut])
def get_anomalies(trial_id: int, resolved: bool = False, db: Session = Depends(get_db), current_user=Depends(require_coordinator)):
    return db.query(AnomalyAlert).filter(AnomalyAlert.trial_id == trial_id, AnomalyAlert.resolved == resolved).order_by(AnomalyAlert.created_at.desc()).all()


@monitoring_router.post("/anomalies/{alert_id}/resolve")
def resolve_anomaly(alert_id: int, db: Session = Depends(get_db), current_user=Depends(require_coordinator)):
    alert = db.query(AnomalyAlert).filter(AnomalyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    db.commit()
    return {"status": "resolved"}


@monitoring_router.get("/cohort/{trial_id}")
def get_cohort_summary(trial_id: int, db: Session = Depends(get_db), current_user=Depends(require_coordinator)):
    patients = db.query(VerifiedPatient).filter(VerifiedPatient.trial_id == trial_id).all()
    total = len(patients)
    avg_score = sum(p.match_score or 0 for p in patients) / total if total else 0
    scores = db.query(DropoutScore).filter(DropoutScore.trial_id == trial_id).order_by(DropoutScore.scored_at.desc()).all()
    seen = set()
    risk_dist = {"RED": 0, "AMBER": 0, "GREEN": 0}
    for s in scores:
        if s.patient_id not in seen:
            seen.add(s.patient_id)
            tier = s.risk_tier.value if hasattr(s.risk_tier, "value") else str(s.risk_tier)
            risk_dist[tier] = risk_dist.get(tier, 0) + 1
    return {
        "trial_id": trial_id,
        "total_enrolled": total,
        "avg_match_score": round(avg_score, 3),
        "risk_distribution": risk_dist,
    }


# ─── Coordinator routes (prefix /coordinator) ─────────────────────────────────

coordinator_router = APIRouter(prefix="/coordinator", tags=["Coordinator"])


@coordinator_router.get("/cohort/{trial_id}")
def coordinator_cohort(trial_id: int, db: Session = Depends(get_db), current_user=Depends(require_coordinator)):
    """Full patient table with latest dropout RAG badges for coordinator dashboard."""
    patients = db.query(VerifiedPatient).filter(VerifiedPatient.trial_id == trial_id).all()

    result = []
    for p in patients:
        # Get latest dropout score
        latest_score = (
            db.query(DropoutScore)
            .filter(DropoutScore.patient_id == p.id)
            .order_by(DropoutScore.scored_at.desc())
            .first()
        )
        # Calculate risk tier based on DropoutScore and AnomalyAlerts
        dropout_tier = (latest_score.risk_tier.value if latest_score and hasattr(latest_score.risk_tier, "value")
                        else str(latest_score.risk_tier) if latest_score else "GREEN")
        
        # Check for unresolved anomalies
        unresolved_alerts = db.query(AnomalyAlert).filter(
            AnomalyAlert.patient_id == p.id,
            AnomalyAlert.resolved == False,
        ).all()
        
        anomaly_tier = "GREEN"
        for alert in unresolved_alerts:
            alert_tier = alert.alert_tier.value if hasattr(alert.alert_tier, "value") else str(alert.alert_tier)
            if alert_tier == "RED":
                anomaly_tier = "RED"
                break
            elif alert_tier == "AMBER":
                anomaly_tier = "AMBER"
        
        # Highest risk wins: RED > AMBER > GREEN
        tier_priority = {"RED": 0, "AMBER": 1, "GREEN": 2}
        risk_tier = dropout_tier if tier_priority[dropout_tier] < tier_priority[anomaly_tier] else anomaly_tier
        
        dropout_score = latest_score.score if latest_score else None

        # Count unresolved anomaly alerts
        alert_count = db.query(AnomalyAlert).filter(
            AnomalyAlert.patient_id == p.id,
            AnomalyAlert.resolved == False,
        ).count()

        # Compute match_score if not available
        match_score = p.match_score
        if match_score is None:
            # Calculate a basic compatibility score from FHIR data vs trial criteria
            from models.models import Trial
            trial = db.query(Trial).filter(Trial.id == trial_id).first()
            score = 0.0
            checks = 0
            if p.fhir_bundle_json and trial:
                bundle = p.fhir_bundle_json if isinstance(p.fhir_bundle_json, dict) else {}
                entries = bundle.get("entry", [])
                
                # Check age match
                for entry in entries:
                    res = entry.get("resource", {})
                    if res.get("resourceType") == "Patient":
                        try:
                            birth_year = int(res.get("birthDate", "0"))
                            from datetime import datetime
                            age = datetime.utcnow().year - birth_year
                            if trial.age_min <= age <= trial.age_max:
                                score += 1.0
                            checks += 1
                        except (ValueError, TypeError):
                            pass
                        # Check gender
                        gender = res.get("gender", "")
                        if trial.gender == "any" or gender.lower() == trial.gender.lower():
                            score += 1.0
                        checks += 1
                    
                    # Check condition match
                    if res.get("resourceType") == "Condition":
                        cond_text = res.get("code", {}).get("text", "").lower()
                        if trial.disease and trial.disease.lower() in cond_text:
                            score += 1.0
                        elif cond_text:
                            score += 0.5  # partial match for having a condition
                        checks += 1
                
                match_score = round(score / max(checks, 1), 3)
            else:
                match_score = 0.65  # default for enrolled patients without FHIR data

        result.append({
            "id": p.id,
            "hash_id": p.hash_id,
            "trial_id": p.trial_id,
            "match_score": match_score,
            "status": p.status.value if hasattr(p.status, "value") else str(p.status),
            "enrolled_at": p.enrolled_at,
            "risk_tier": risk_tier,
            "dropout_score": dropout_score,
            "active_alerts": alert_count,
        })

    # Sort RED first, then AMBER, then GREEN
    tier_order = {"RED": 0, "AMBER": 1, "GREEN": 2}
    result.sort(key=lambda x: tier_order.get(x["risk_tier"], 2))
    return result


@coordinator_router.get("/patient/{patient_id}")
def coordinator_patient_profile(patient_id: int, db: Session = Depends(get_db), current_user=Depends(require_coordinator)):
    """Full individual patient profile for coordinator."""
    from models.models import SymptomLog, WearableData, ConsentAuditLog, IdentityMap

    patient = db.query(VerifiedPatient).filter(VerifiedPatient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Look up contact details from the IdentityMap via hash_id
    identity = db.query(IdentityMap).filter(IdentityMap.hash_id == patient.hash_id).first()

    # --- Fallback: look up the User table for patients who registered directly ---
    # IdentityMap is only populated by AI pipeline agents. Patients who signed up
    # via the registration form and verified OTP only have data in the User table.
    # Since hash_id = sha256(user.email), we can reliably find the linked User row.
    import hashlib

    fallback_user: User | None = None
    if not (identity and identity.phone):
        # Find the User whose sha256(email) matches the VerifiedPatient hash_id
        # We first check IdentityMap email (O(1)), then do a targeted DB scan.
        candidate_email = identity.email if identity else None
        if candidate_email:
            fallback_user = db.query(User).filter(User.email == candidate_email).first()
        else:
            # Scan users — only look at phone_verified ones to keep it fast
            for u in db.query(User).filter(User.phone_verified == True).all():
                if hashlib.sha256(u.email.encode()).hexdigest() == patient.hash_id:
                    fallback_user = u
                    break

    # Resolve final values: prefer IdentityMap, fall back to User table
    resolved_phone = (identity.phone if identity and identity.phone else None) or \
                     (fallback_user.phone_number if fallback_user else None)
    resolved_name  = (identity.real_name if identity and identity.real_name else None) or \
                     (fallback_user.full_name if fallback_user else None)
    resolved_email = (identity.email if identity and identity.email else None) or \
                     (fallback_user.email if fallback_user else None)

    scores = db.query(DropoutScore).filter(DropoutScore.patient_id == patient_id).order_by(DropoutScore.scored_at.desc()).limit(10).all()
    alerts = db.query(AnomalyAlert).filter(AnomalyAlert.patient_id == patient_id).order_by(AnomalyAlert.created_at.desc()).limit(20).all()
    symptoms = db.query(SymptomLog).filter(SymptomLog.patient_id == patient_id).order_by(SymptomLog.logged_at.desc()).limit(10).all()
    wearables = db.query(WearableData).filter(WearableData.patient_id == patient_id).order_by(WearableData.recorded_at.desc()).limit(10).all()
    consent = (
        db.query(ConsentSubmission)
        .filter(ConsentSubmission.hash_id == patient.hash_id)
        .order_by(ConsentSubmission.signed_at.desc())
        .first()
    )

    return {
        "patient": {
            "id": patient.id,
            "hash_id": patient.hash_id,
            "trial_id": patient.trial_id,
            "match_score": patient.match_score,
            "status": patient.status.value if hasattr(patient.status, "value") else str(patient.status),
            "enrolled_at": patient.enrolled_at,
            "fhir_bundle_s3": patient.report_s3_url,
            "consent_subject_id": f"p_{patient.id}",
            "phone_number": resolved_phone,
            "full_name": resolved_name,
            "email": resolved_email,
        },
        "consent": {
            "id": consent.id if consent else None,
            "signed_at": consent.signed_at if consent else None,
            "signed_pdf_url": consent.signed_pdf_url if consent else None,
            "template_name": consent.template_name if consent else None,
            "template_version": consent.template_version if consent else None,
        },
        "dropout_scores": [
            {"score": s.score, "risk_tier": s.risk_tier.value if hasattr(s.risk_tier, "value") else str(s.risk_tier), "scored_at": s.scored_at}
            for s in scores
        ],
        "anomaly_alerts": [
            {"biometric": a.biometric_type, "value": a.patient_value, "z_score": a.z_score,
             "tier": a.alert_tier.value if hasattr(a.alert_tier, "value") else str(a.alert_tier),
             "resolved": a.resolved, "created_at": a.created_at}
            for a in alerts
        ],
        "symptom_logs": [
            {"symptoms": s.symptoms_json, "severity": s.severity, "logged_at": s.logged_at}
            for s in symptoms
        ],
        "wearable_data": [
            {"heart_rate": w.heart_rate, "glucose": w.glucose, "steps": w.steps,
             "temperature": w.temperature, "recorded_at": w.recorded_at}
            for w in wearables
        ],
    }


@coordinator_router.get("/anomalies/{trial_id}")
def coordinator_anomalies(trial_id: int, db: Session = Depends(get_db), current_user=Depends(require_coordinator)):
    """Live anomaly alert feed for coordinator."""
    alerts = (
        db.query(AnomalyAlert)
        .filter(AnomalyAlert.trial_id == trial_id)
        .order_by(AnomalyAlert.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": a.id,
            "patient_id": a.patient_id,
            "biometric_type": a.biometric_type,
            "patient_value": a.patient_value,
            "cohort_mean": a.cohort_mean,
            "z_score": a.z_score,
            "alert_tier": a.alert_tier.value if hasattr(a.alert_tier, "value") else str(a.alert_tier),
            "created_at": a.created_at,
            "resolved": a.resolved,
        }
        for a in alerts
    ]


@coordinator_router.post("/intervene/{patient_id}")
def coordinator_intervene(patient_id: int, db: Session = Depends(get_db), current_user=Depends(require_coordinator)):
    """Mark coordinator intervention on RED-flagged patient."""
    patient = db.query(VerifiedPatient).filter(VerifiedPatient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Log intervention in consent_audit_log (append-only)
    from models.models import ConsentAuditLog
    log = ConsentAuditLog(
        candidate_id=patient_id,  # using patient_id as proxy
        trial_id=patient.trial_id,
        channel="coordinator_intervention",
        message_sent=f"Coordinator {current_user.full_name or current_user.email} intervened on patient {patient_id}",
        response="INTERVENTION",
    )
    db.add(log)
    db.commit()
    return {"status": "intervention_logged", "patient_id": patient_id, "coordinator": current_user.email}



@monitoring_router.post("/run-dropout")
def run_dropout_manual(db: Session = Depends(get_db), current_user=Depends(require_coordinator)):
    """Manually trigger dropout prediction for all enrolled patients (testing)."""
    from agents.agent7_dropout import run_dropout_prediction
    result = run_dropout_prediction(db)
    return {"status": "complete", "results": result}

from models.models import User, CallLog
from datetime import datetime

@monitoring_router.post("/call/patient/{patient_id}")
async def call_patient(
    patient_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Coordinator clicks this endpoint.
    Twilio first calls the coordinator.
    When coordinator picks up Twilio then
    connects the patient on the same call.
    Both can talk in real time.
    """
    if current_user.role.value != "coordinator":
        raise HTTPException(status_code=403, detail="Only coordinators can initiate calls")

    # patient_id refers to VerifiedPatient.id — find the linked User via hash_id
    from models.models import VerifiedPatient, IdentityMap
    import hashlib as _hashlib

    vp = db.query(VerifiedPatient).filter(VerifiedPatient.id == int(patient_id)).first()
    if not vp:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Try to find the User: match sha256(user.email) == vp.hash_id
    patient_user: User | None = None
    identity = db.query(IdentityMap).filter(IdentityMap.hash_id == vp.hash_id).first()
    if identity and identity.email:
        patient_user = db.query(User).filter(User.email == identity.email).first()
    if not patient_user:
        # Scan users whose hashed email matches
        for u in db.query(User).filter(User.phone_number != None).all():
            if _hashlib.sha256(u.email.encode()).hexdigest() == vp.hash_id:
                patient_user = u
                break

    if not patient_user or not patient_user.phone_number:
        raise HTTPException(status_code=404, detail="Patient phone number not found")

    if not patient_user.phone_verified:
        raise HTTPException(status_code=400, detail="Patient phone number not verified")

    coordinator = db.query(User).filter(User.id == current_user.id).first()

    if not coordinator.phone_number:
        raise HTTPException(status_code=400, detail="Coordinator phone number not set in profile")

    import os
    from twilio.rest import Client

    client = Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN")
    )

    patient_phone = patient_user.phone_number
    twiml_instructions = f'''<Response>
        <Say>Connecting you to your patient now. Please wait.</Say>
        <Dial>{patient_phone}</Dial>
    </Response>'''

    call = client.calls.create(
        to=coordinator.phone_number,
        from_=os.getenv("TWILIO_PHONE_NUMBER"),
        twiml=twiml_instructions
    )

    db_log = CallLog(
        coordinator_id=current_user.id,
        patient_id=int(patient_id),
        twilio_call_sid=call.sid,
        status="initiated",
        initiated_at=datetime.now()
    )
    db.add(db_log)
    db.commit()

    return {
        "message": "Calling coordinator now. Please pick up your phone. You will be connected to the patient.",
        "call_sid": call.sid,
        "status": "initiated"
    }


@monitoring_router.get("/call/twiml")
async def call_twiml(patient_phone: str):
    """
    Twilio calls this endpoint after coordinator picks up.
    This TwiML instruction tells Twilio to now
    dial the patient and connect both on same call.
    """
    from twilio.twiml.voice_response import VoiceResponse, Dial
    import os
    from fastapi.responses import Response

    response = VoiceResponse()
    response.say("Connecting you to your patient now. Please wait.", voice="alice")
    dial = Dial(caller_id=os.getenv("TWILIO_PHONE_NUMBER"), timeout=30)
    dial.number(patient_phone)
    response.append(dial)

    return Response(content=str(response), media_type="application/xml")

@monitoring_router.get("/call/logs/{patient_id}")
async def get_call_logs(patient_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    logs = db.query(CallLog).filter(CallLog.patient_id == int(patient_id)).order_by(CallLog.initiated_at.desc()).all()
    results = []
    for log in logs:
        coord = db.query(User).filter(User.id == log.coordinator_id).first()
        results.append({
            "id": log.id,
            "coordinator_name": coord.full_name if coord else "Unknown",
            "status": log.status,
            "duration_seconds": log.duration_seconds,
            "initiated_at": log.initiated_at
        })
    return results
