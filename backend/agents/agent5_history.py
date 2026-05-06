"""
Agent 5 — Patient History Collection & FHIR R4 Builder
De-identifies patient data, converts to FHIR, stores in S3.
"""
import hashlib
import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from models.models import VerifiedPatient, IdentityMap, MatchedCandidate
from models.schemas import PatientHistorySubmit
from services.s3_service import upload_json_to_s3
from dotenv import load_dotenv

load_dotenv()


def _build_fhir_bundle(payload: PatientHistorySubmit, hash_id: str) -> dict:
    """Build a FHIR R4 Patient bundle from the submitted history."""
    return {
        "resourceType": "Bundle",
        "id": hash_id,
        "type": "collection",
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "id": hash_id,
                    "gender": payload.gender.lower(),
                    "birthDate": str(datetime.utcnow().year - payload.age),
                    "address": [{"city": payload.city, "country": payload.country}],
                }
            },
            *[
                {
                    "resource": {
                        "resourceType": "Condition",
                        "subject": {"reference": f"Patient/{hash_id}"},
                        "code": {"text": cond},
                        "clinicalStatus": {"coding": [{"code": "active"}]},
                    }
                }
                for cond in payload.diagnosed_conditions
            ],
            {
                "resource": {
                    "resourceType": "Observation",
                    "subject": {"reference": f"Patient/{hash_id}"},
                    "code": {"text": "symptom_description"},
                    "valueString": payload.symptom_description,
                    "note": [{"text": f"Duration: {payload.duration}"}],
                }
            },
        ],
    }


def collect_patient_history(payload: PatientHistorySubmit, db: Session, user_email: str = None) -> dict:
    """De-identify, build FHIR bundle, store in S3, create verified patient record."""
    if user_email:
        hash_id = hashlib.sha256(user_email.encode()).hexdigest()
    else:
        raw_id = f"{payload.full_name}:{payload.candidate_id}"
        hash_id = hashlib.sha256(raw_id.encode()).hexdigest()

    # Ensure IdentityMap entry exists
    identity = db.query(IdentityMap).filter(IdentityMap.hash_id == hash_id).first()
    if not identity:
        db.add(IdentityMap(
            hash_id=hash_id,
            real_name=payload.full_name,
            email=user_email if user_email else None,
            secondary_consent_given=payload.consent_given,
        ))
    else:
        # Update consent if it was previously false
        if payload.consent_given:
            identity.secondary_consent_given = True

    # Resolve trial_id
    trial_id = payload.trial_id
    match_score = None
    matched = None

    if payload.candidate_id:
        matched = db.query(MatchedCandidate).filter(
            MatchedCandidate.candidate_id == payload.candidate_id
        ).order_by(MatchedCandidate.created_at.desc()).first()
        if matched:
            trial_id = matched.trial_id
            match_score = matched.match_score

    # Build FHIR bundle
    fhir_bundle = _build_fhir_bundle(payload, hash_id)

    # Upload FHIR bundle to S3
    bucket = os.getenv("S3_BUCKET_FHIR", "trialgo-fhir-bundles")
    s3_key = f"patients/{hash_id}/fhir_bundle.json"
    s3_url = upload_json_to_s3(fhir_bundle, bucket, s3_key)

    # Upsert verified patient — always set trial_id
    existing = db.query(VerifiedPatient).filter(VerifiedPatient.hash_id == hash_id).first()
    if existing:
        existing.fhir_bundle_json = fhir_bundle
        existing.report_s3_url = s3_url
        existing.status = "enrolled"
        if trial_id:
            existing.trial_id = trial_id
        if match_score:
            existing.match_score = match_score
    else:
        db.add(VerifiedPatient(
            hash_id=hash_id,
            trial_id=trial_id,
            fhir_bundle_json=fhir_bundle,
            report_s3_url=s3_url,
            match_score=match_score,
            status="enrolled",
        ))

    # Update the matched_candidate status to enrolled
    if matched:
        matched.status = "enrolled"

    db.commit()

    result = {
        "hash_id": hash_id,
        "fhir_s3_url": s3_url,
        "trial_id": trial_id,
        "status": "enrolled",
        "message": "Patient history collected and FHIR bundle created",
    }
    print(f"[Agent5] History collected: {hash_id}, trial_id: {trial_id}")
    return result
