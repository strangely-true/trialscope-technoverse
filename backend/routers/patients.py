"""
Patients router — history form, symptom logs, wearable uploads.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
import hashlib
from db.database import get_db
from models.models import VerifiedPatient, SymptomLog, WearableData, User, IdentityMap, ConsentSubmission
from models.schemas import PatientHistorySubmit, SymptomLogCreate, WearableUpload
from auth.jwt_handler import get_current_user, require_patient
from agents.agent5_history import collect_patient_history
from agents.agent8_anomaly import run_anomaly_detection

router = APIRouter(prefix="/patient", tags=["Patients"])


@router.get("/history-form/{trial_id}")
def get_history_form(
    trial_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Return the field definitions, pre-fill data, and application status for the form."""
    from models.models import PatientQuestionnaire, VerifiedPatient
    import hashlib
    
    # Check if user has already applied for this specific trial
    email_hash = hashlib.sha256(current_user.email.encode()).hexdigest()
    application = db.query(VerifiedPatient).filter(
        VerifiedPatient.hash_id == email_hash,
        VerifiedPatient.trial_id == trial_id
    ).first()
    
    already_applied = application is not None
    
    # Try to find existing questionnaire data to pre-fill
    q = db.query(PatientQuestionnaire).filter(PatientQuestionnaire.patient_id == current_user.id).first()
    
    prefill = {}
    if q:
        prefill = {
            "age": q.age,
            "gender": q.gender,
            "diagnosed_conditions": q.primary_condition,
            "symptom_description": q.additional_notes,
            "current_medications": q.current_medications,
            "previous_treatments": q.prior_treatments,
            "country": q.country,
            "full_name": current_user.full_name if hasattr(current_user, "full_name") else "",
        }

    return {
        "candidate_id": trial_id,
        "prefill": prefill,
        "already_applied": already_applied,
        "fields": [
            {"name": "full_name", "label": "Full Name", "type": "text", "required": True},
            {"name": "age", "label": "Age", "type": "number", "required": True},
            {"name": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female", "Other"], "required": True},
            {"name": "city", "label": "City", "type": "text", "required": True},
            {"name": "country", "label": "Country", "type": "text", "required": True},
            {"name": "diagnosed_conditions", "label": "Diagnosed Conditions (ICD-10)", "type": "select", "options": [
                "I10 - Essential (primary) hypertension", 
                "E11.9 - Type 2 diabetes mellitus", 
                "I50.9 - Heart failure, unspecified",
                "I20.9 - Angina pectoris, unspecified",
                "C34.9 - Malignant neoplasm of unspecified part of bronchus or lung",
                "C50.9 - Malignant neoplasm of breast",
                "I25.1 - Atherosclerotic heart disease",
                "G30.9 - Alzheimer's disease, unspecified",
                "M17.9 - Osteoarthritis of knee, unspecified",
                "J44.9 - Chronic obstructive pulmonary disease, unspecified"
            ], "required": True},
            {"name": "symptom_description", "label": "Symptom Description", "type": "textarea", "required": True},
            {"name": "duration", "label": "Duration of Symptoms", "type": "text", "required": True},
            {"name": "current_medications", "label": "Current Medications", "type": "textarea", "required": False},
            {"name": "previous_treatments", "label": "Previous Treatments", "type": "textarea", "required": False},
            {"name": "test_reports", "label": "Upload Test Reports (PDF)", "type": "file", "required": False},
            {"name": "wearable_data", "label": "Upload Wearable Data (JSON)", "type": "file", "required": False},
            {"name": "doctor_contact", "label": "Doctor Contact", "type": "text", "required": False},
        ],
    }


@router.post("/history/submit")
async def submit_history(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process and store patient medical history, create FHIR bundle.

    This endpoint accepts a flexible JSON payload and validates it against
    `PatientHistorySubmit` so we can return clearer validation errors instead
    of a generic 422 with no context.
    """
    try:
        payload_json = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    try:
        print("[submit_history] raw payload:", payload_json)
        headers_dict = {k: v for k, v in request.headers.items()}
        print("[submit_history] request headers:", headers_dict)
    except Exception as _:
        pass

    from pydantic import ValidationError

    try:
        validated = PatientHistorySubmit.parse_obj(payload_json)
    except ValidationError as ve:
        raise HTTPException(status_code=422, detail=ve.errors())

    hash_id = hashlib.sha256(current_user.email.encode()).hexdigest()
    consent = (
        db.query(ConsentSubmission)
        .filter(
            ConsentSubmission.trial_id == validated.trial_id,
            ConsentSubmission.hash_id == hash_id,
        )
        .first()
    )
    if not consent:
        raise HTTPException(status_code=400, detail="Consent must be completed before enrollment")

    validated.consent_given = True

    result = collect_patient_history(validated, db, current_user.email)
    return result


@router.post("/symptom-log")
def log_symptoms(
    payload: SymptomLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Patient logs weekly symptoms."""
    import hashlib
    hash_id = hashlib.sha256(current_user.email.encode()).hexdigest()

    patient = db.query(VerifiedPatient).filter(VerifiedPatient.hash_id == hash_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    symptoms = payload.symptoms_json
    try:
        fatigue = int(symptoms.get("fatigue", 0))
        pain = int(symptoms.get("pain", 0))
        nausea = int(symptoms.get("nausea", 0))
        headache = int(symptoms.get("headache", 0))
        severity = max(fatigue, pain, nausea, headache)
        if severity == 0:
            severity = 1
    except ValueError:
        severity = 1

    log = SymptomLog(
        patient_id=patient.id,
        trial_id=payload.trial_id,
        symptoms_json=payload.symptoms_json,
        severity=severity,
    )
    db.add(log)
    db.commit()
    return {"status": "logged", "message": "Symptom log recorded successfully"}


@router.post("/wearable-upload")
def upload_wearable(
    payload: WearableUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Patient uploads wearable data — triggers anomaly detection."""
    import hashlib
    hash_id = hashlib.sha256(current_user.email.encode()).hexdigest()

    patient = db.query(VerifiedPatient).filter(VerifiedPatient.hash_id == hash_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    record = WearableData(
        patient_id=patient.id,
        trial_id=payload.trial_id,
        heart_rate=payload.heart_rate,
        glucose=payload.glucose,
        steps=payload.steps,
        temperature=payload.temperature,
        blood_pressure_systolic=payload.blood_pressure_systolic,
        blood_pressure_diastolic=payload.blood_pressure_diastolic,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Trigger anomaly detection
    alerts = run_anomaly_detection(patient.id, payload.trial_id, payload.dict(), db)
    return {"status": "uploaded", "anomalies_detected": len(alerts), "alerts": alerts}


@router.get("/my-trial-info")
def get_my_trial_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Patient retrieves their enrolled trial info."""
    from models.models import Trial
    # Find by email hash
    hash_id = hashlib.sha256(current_user.email.encode()).hexdigest()

    consent_rows = (
        db.query(ConsentSubmission)
        .filter(ConsentSubmission.hash_id == hash_id)
        .order_by(ConsentSubmission.signed_at.desc())
        .all()
    )
    
    # A patient could theoretically be in multiple trials.
    enrollments = db.query(VerifiedPatient, Trial).join(
        Trial, VerifiedPatient.trial_id == Trial.id
    ).filter(VerifiedPatient.hash_id == hash_id).all()
    
    if not enrollments:
        return []
        
    result = []
    for vp, trial in enrollments:
        consent = next((row for row in consent_rows if row.trial_id == trial.id), None)
        result.append({
            "patient": {
                "id": vp.id,
                "hash_id": vp.hash_id,
                "trial_id": vp.trial_id,
                "match_score": vp.match_score,
                "status": vp.status,
                "enrolled_at": vp.enrolled_at.isoformat() if vp.enrolled_at else None,
                "consent_signed_at": consent.signed_at.isoformat() if consent and consent.signed_at else None,
                "consent_pdf_url": consent.signed_pdf_url if consent else None,
                "consent_subject_id": f"p_{vp.id}",
            },
            "trial": {
                "id": trial.id,
                "title": trial.title,
                "disease": trial.disease,
                "stage": trial.stage,
                "pharma_user_id": trial.pharma_user_id,
            }
        })
    return result


@router.get("/dropout-risk")
def get_my_dropout_risk(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    """Patient retrieves their own dropout risk scores across all enrolled trials."""
    from models.models import DropoutScore, Trial
    
    hash_id = hashlib.sha256(current_user.email.encode()).hexdigest()
    
    # Find all trials where this patient is enrolled
    enrollments = db.query(VerifiedPatient).filter(VerifiedPatient.hash_id == hash_id).all()
    
    if not enrollments:
        return {"trials": [], "latest_scores": []}
    
    result_by_trial = []
    all_scores = []
    
    for patient_record in enrollments:
        trial = db.query(Trial).filter(Trial.id == patient_record.trial_id).first()
        if not trial:
            continue
        
        # Get latest dropout score for this trial
        latest_score = (
            db.query(DropoutScore)
            .filter(DropoutScore.patient_id == patient_record.id)
            .order_by(DropoutScore.scored_at.desc())
            .first()
        )
        
        # Get last 5 historical scores
        historical_scores = (
            db.query(DropoutScore)
            .filter(DropoutScore.patient_id == patient_record.id)
            .order_by(DropoutScore.scored_at.desc())
            .limit(5)
            .all()
        )
        
        if latest_score:
            result_by_trial.append({
                "trial_id": trial.id,
                "trial_title": trial.title,
                "trial_disease": trial.disease,
                "risk_tier": latest_score.risk_tier.value if hasattr(latest_score.risk_tier, "value") else str(latest_score.risk_tier),
                "dropout_score": latest_score.score,
                "scored_at": latest_score.scored_at,
                "metrics": {
                    "days_since_login": latest_score.days_since_login,
                    "symptom_logs_week": latest_score.symptom_logs_week,
                    "wearable_uploads_week": latest_score.wearable_uploads_week,
                },
                "historical": [
                    {
                        "score": s.score,
                        "tier": s.risk_tier.value if hasattr(s.risk_tier, "value") else str(s.risk_tier),
                        "scored_at": s.scored_at,
                    }
                    for s in reversed(historical_scores)
                ],
            })
            all_scores.append(latest_score)
    
    # Sort by risk tier (RED first)
    tier_order = {"RED": 0, "AMBER": 1, "GREEN": 2}
    result_by_trial.sort(key=lambda x: tier_order.get(x["risk_tier"], 2))
    
    return {
        "trials": result_by_trial,
        "latest_scores": [
            {
                "score": s.score,
                "tier": s.risk_tier.value if hasattr(s.risk_tier, "value") else str(s.risk_tier),
            }
            for s in all_scores
        ],
    }
