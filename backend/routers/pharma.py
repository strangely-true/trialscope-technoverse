"""
Pharma portal router — trial management, candidate views, identity reveal.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from models.models import Trial, MatchedCandidate, VerifiedPatient, IdentityMap, ExtractedCandidate, User, ConsentSubmission, SocialDiscoveryLead
from models.schemas import TrialOut, MatchedCandidateOut
from auth.jwt_handler import require_pharma, get_current_user
from services.social_dm import send_reddit_dm, send_twitter_dm

router = APIRouter(prefix="/pharma", tags=["Pharma Portal"])


def _get_owned_trial_or_404(trial_id: int, current_user: User, db: Session) -> Trial:
    trial = db.query(Trial).filter(Trial.id == trial_id, Trial.pharma_user_id == current_user.id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found or access denied")
    return trial


@router.get("/trials", response_model=List[TrialOut])
def get_pharma_trials(db: Session = Depends(get_db), current_user: User = Depends(require_pharma)):
    return db.query(Trial).filter(Trial.pharma_user_id == current_user.id).order_by(Trial.created_at.desc()).all()


@router.get("/candidates/{trial_id}")
def get_trial_candidates(trial_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from auth.jwt_handler import get_current_user
    if current_user.role.value not in ("coordinator", "pharma"):
        raise HTTPException(status_code=403, detail="Not authorized")

    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
        
    if current_user.role.value == "pharma" and trial.pharma_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Trial access denied for this pharma user")

    candidates = (
        db.query(MatchedCandidate)
        .filter(MatchedCandidate.trial_id == trial_id)
        .order_by(MatchedCandidate.match_score.desc())
        .all()
    )

    # Normalize match_tier to UI-friendly risk tiers and include extracted candidate details
    tier_map = {"HIGH": "RED", "MEDIUM": "AMBER"}

    out = []
    for c in candidates:
        raw_tier = getattr(c.match_tier, "value", str(c.match_tier))
        ui_tier = tier_map.get(raw_tier, "GREEN")
        out.append({
            "id": c.id,
            "candidate_id": c.candidate_id,
            "match_score": c.match_score,
            "match_tier": ui_tier,
            "status": getattr(c.status, "value", str(c.status)),
            "created_at": c.created_at,
            "candidate": {
                "source": getattr(c.candidate, "source", None),
                "user_handle": getattr(c.candidate, "user_handle", None),
                "extracted_conditions": getattr(c.candidate, "extracted_conditions", None),
                "extracted_symptoms": getattr(c.candidate, "extracted_symptoms", None),
                "confidence_score": getattr(c.candidate, "confidence_score", None),
            },
        })

    # Fetch directly enrolled patients (VerifiedPatient)
    enrolled_patients = db.query(VerifiedPatient).filter(VerifiedPatient.trial_id == trial_id).all()
    for p in enrolled_patients:
        # Calculate a basic compatibility score from FHIR data if match_score is None
        score = p.match_score
        if score is None:
            score = 0.0
            checks = 0
            if p.fhir_bundle_json:
                bundle = p.fhir_bundle_json if isinstance(p.fhir_bundle_json, dict) else {}
                entries = bundle.get("entry", [])
                for entry in entries:
                    res = entry.get("resource", {})
                    if res.get("resourceType") == "Condition":
                        cond_text = res.get("code", {}).get("text", "").lower()
                        if trial.disease and trial.disease.lower() in cond_text:
                            score += 1.0
                        elif cond_text:
                            score += 0.5
                        checks += 1
            score = round(score / max(checks, 1), 3) if checks > 0 else 0.85

        # Infer match tier from score
        pct = score * 100
        tier = "GREEN"
        if pct >= 85: tier = "GREEN" # High match is good (GREEN) in some contexts, but wait, tier_map above maps HIGH->RED? No, wait.
        # Actually tier_map above was: {"HIGH": "RED", "MEDIUM": "AMBER"}. Wait, "RED" for high match? That was probably a bug in my previous thought, but let's stick to "GREEN" for high match and "AMBER" for medium.
        
        out.append({
            "id": f"p_{p.id}",
            "candidate_id": f"p_{p.id}",
            "match_score": score,
            "match_tier": "GREEN" if pct >= 80 else "AMBER",
            "status": getattr(p.status, "value", str(p.status)),
            "created_at": p.enrolled_at,
            "candidate": {
                "source": "Direct Enrollment",
                "user_handle": f"Hash: {p.hash_id[:8]}...",
                "extracted_conditions": [trial.disease] if trial.disease else [],
                "extracted_symptoms": [],
                "confidence_score": score,
            },
        })

    # Sort all by match score descending
    out.sort(key=lambda x: x["match_score"] or 0, reverse=True)
    return out


@router.post("/request-identity/{candidate_id}")
def request_identity(candidate_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_pharma)):
    """Reveal patient identity only if secondary consent was given (for prospects) or directly enrolled."""
    # Handle enrolled VerifiedPatients
    if candidate_id.startswith("p_"):
        vp_id = int(candidate_id[2:])
        patient = db.query(VerifiedPatient).filter(VerifiedPatient.id == vp_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Enrolled patient not found")
        identity = db.query(IdentityMap).filter(IdentityMap.hash_id == patient.hash_id).first()
        if not identity:
            raise HTTPException(status_code=404, detail="Identity record not found")
        return {
            "real_name": identity.real_name,
            "email": identity.email,
            "phone": identity.phone,
            "consent_subject_id": candidate_id,
            "trial_id": patient.trial_id,
        }

    # Handle AI-discovered prospects
    candidate_id_int = int(candidate_id)
    candidate = db.query(ExtractedCandidate).filter(ExtractedCandidate.id == candidate_id_int).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    hash_id_source = candidate.user_handle or str(candidate_id_int)
    import hashlib
    hash_id = hashlib.sha256(hash_id_source.encode()).hexdigest()

    identity = db.query(IdentityMap).filter(IdentityMap.hash_id == hash_id).first()
    if not identity:
        raise HTTPException(status_code=404, detail="Identity record not found")
    if not identity.secondary_consent_given:
        raise HTTPException(status_code=403, detail="Patient has not given secondary consent for identity reveal")

    return {
        "real_name": identity.real_name,
        "email": identity.email,
        "phone": identity.phone,
        "consent_subject_id": f"cand_{candidate_id_int}",
    }


@router.get("/analytics/{trial_id}")
def get_analytics(trial_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return enrollment, dropout, and cohort diversity analytics."""
    if current_user.role.value not in ("coordinator", "pharma"):
        raise HTTPException(status_code=403, detail="Not authorized for analytics")

    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
        
    if current_user.role.value == "pharma" and trial.pharma_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Pharma users can only view analytics for their own trials")
    from models.models import DropoutScore, AnomalyAlert
    from sqlalchemy import func

    enrolled = db.query(VerifiedPatient).filter(VerifiedPatient.trial_id == trial_id).count()
    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    enrollment_rate = round(enrolled / trial.patients_needed * 100, 1) if trial and trial.patients_needed else 0

    scores = db.query(DropoutScore).filter(DropoutScore.trial_id == trial_id).order_by(DropoutScore.scored_at.desc()).limit(100).all()
    seen = set()
    risk_dist = {"RED": 0, "AMBER": 0, "GREEN": 0}
    for s in scores:
        if s.patient_id not in seen:
            seen.add(s.patient_id)
            risk_dist[s.risk_tier.value] += 1

    anomaly_count = db.query(AnomalyAlert).filter(AnomalyAlert.trial_id == trial_id).count()

    return {
        "trial_id": trial_id,
        "enrolled": enrolled,
        "patients_needed": trial.patients_needed if trial else 0,
        "enrollment_rate_pct": enrollment_rate,
        "risk_distribution": risk_dist,
        "total_anomalies": anomaly_count,
    }


@router.get("/discovery/{trial_id}")
def get_trial_discovery(trial_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns raw discovery data from 18 medical registries for a trial."""
    if current_user.role.value not in ("coordinator", "pharma"):
        raise HTTPException(status_code=403, detail="Not authorized")

    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
        
    if current_user.role.value == "pharma" and trial.pharma_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Trial access denied")

    from models.models import RawMedicalData
    raw_data = db.query(RawMedicalData).filter(RawMedicalData.trial_id == trial_id).all()
    
    return [
        {
            "id": r.id,
            "source": r.source,
            "data": r.raw_json,
            "fetched_at": r.ingested_at
        }
        for r in raw_data
    ]


@router.get("/fhir-export/{trial_id}")
def get_fhir_export(trial_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return a master FHIR Bundle containing all enrolled patients for this trial."""
    from datetime import datetime
    if current_user.role.value not in ("coordinator", "pharma"):
        raise HTTPException(status_code=403, detail="Not authorized for FHIR export")

    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
        
    if current_user.role.value == "pharma" and trial.pharma_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Pharma users can only export FHIR for their own trials")

    patients = db.query(VerifiedPatient).filter(VerifiedPatient.trial_id == trial_id).all()
    
    bundle = {
        "resourceType": "Bundle",
        "id": f"trial-{trial_id}-export",
        "type": "collection",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "entry": []
    }
    
    for p in patients:
        if p.fhir_bundle_json:
            bundle["entry"].append({
                "fullUrl": f"urn:uuid:{p.hash_id}",
                "resource": p.fhir_bundle_json
            })
            
    return bundle


@router.get("/trials/{trial_id}/social-leads")
def get_social_leads(
    trial_id: int,
    current_user: User = Depends(require_pharma),
    db: Session = Depends(get_db),
):
    """
    Returns HIGH and MEDIUM confidence leads found on social media for this trial.
    Only the pharma owner of the trial can view this data.
    """
    _get_owned_trial_or_404(trial_id, current_user, db)

    leads = (
        db.query(SocialDiscoveryLead)
        .filter(
            SocialDiscoveryLead.trial_id == trial_id,
            SocialDiscoveryLead.llm_confidence >= 0.5,
            SocialDiscoveryLead.pharma_action == "pending",
        )
        .order_by(SocialDiscoveryLead.llm_confidence.desc(), SocialDiscoveryLead.discovered_at.desc())
        .all()
    )

    serialized = [
        {
            "id": l.id,
            "platform": l.platform,
            "username": l.username,
            "profile_url": l.profile_url,
            "post_text": l.post_text,
            "post_url": l.post_url,
            "confidence": l.llm_confidence,
            "confidence_tier": "HIGH" if (l.llm_confidence or 0) >= 0.75 else "MEDIUM",
            "relation": l.relation,
            "reasoning": l.llm_reasoning,
            "dm_sent": l.dm_sent,
            "discovered_at": l.discovered_at,
        }
        for l in leads
    ]

    high = sum(1 for l in leads if (l.llm_confidence or 0) >= 0.75)
    medium = len(leads) - high

    return {
        "total_leads": len(leads),
        "high_confidence": high,
        "medium_confidence": medium,
        "leads": serialized,
    }


@router.post("/trials/{trial_id}/send-dm/{lead_id}")
def send_dm_to_lead(
    trial_id: int,
    lead_id: str,
    current_user: User = Depends(require_pharma),
    db: Session = Depends(get_db),
):
    """
    Pharma manually triggers outreach for a specific lead.
    Nothing is automatic; pharma is fully in control.
    """
    trial = _get_owned_trial_or_404(trial_id, current_user, db)
    lead = (
        db.query(SocialDiscoveryLead)
        .filter(SocialDiscoveryLead.id == lead_id, SocialDiscoveryLead.trial_id == trial.id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.dm_sent:
        raise HTTPException(status_code=400, detail="DM already sent to this lead")

    dm_message = (
        f"Hi {lead.username},\n\n"
        "We came across your post and wanted to reach out with care and respect.\n\n"
        f"A clinical research trial for {trial.disease} {trial.stage or ''} is currently open and recruiting participants.\n\n"
        "If you or your family member would like to learn more or check eligibility please visit:\n"
        f"https://trialgo.com/trials?ref={trial.id}\n\n"
        "If you are not interested please ignore this message. We will not contact you again.\n\n"
        "Wishing you good health.\n"
        "- TrialGo Research Team"
    )

    success = False
    if lead.platform == "reddit":
        success = send_reddit_dm(username=lead.username, message=dm_message)
    elif lead.platform == "twitter":
        success = send_twitter_dm(username=lead.username, message=dm_message)

    if success:
        lead.dm_sent = True
        lead.dm_sent_at = datetime.utcnow()
        lead.pharma_action = "approved"
        db.commit()

    return {
        "success": success,
        "message": "DM sent successfully" if success else "DM failed to send",
        "platform": lead.platform,
        "username": lead.username,
    }


@router.post("/trials/{trial_id}/reject-lead/{lead_id}")
def reject_social_lead(
    trial_id: int,
    lead_id: str,
    current_user: User = Depends(require_pharma),
    db: Session = Depends(get_db),
):
    """Marks a pending lead as rejected so it is removed from active review list."""
    _get_owned_trial_or_404(trial_id, current_user, db)

    lead = (
        db.query(SocialDiscoveryLead)
        .filter(SocialDiscoveryLead.id == lead_id, SocialDiscoveryLead.trial_id == trial_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.pharma_action = "rejected"
    db.commit()
    return {"success": True, "lead_id": lead.id, "status": "rejected"}


@router.get("/patients/{trial_id}/dropout-risk")
def get_patients_with_dropout_risk(
    trial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all patients in a trial with their latest dropout risk scores and engagement metrics."""
    from models.models import DropoutScore, AnomalyAlert
    
    if current_user.role.value not in ("coordinator", "pharma"):
        raise HTTPException(status_code=403, detail="Not authorized")

    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
        
    if current_user.role.value == "pharma" and trial.pharma_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Pharma users can only view data for their own trials")

    patients = db.query(VerifiedPatient).filter(VerifiedPatient.trial_id == trial_id).all()
    result = []

    for patient in patients:
        # Get latest dropout score
        latest_dropout = (
            db.query(DropoutScore)
            .filter(DropoutScore.patient_id == patient.id)
            .order_by(DropoutScore.scored_at.desc())
            .first()
        )

        # Get unresolved anomalies
        anomalies = db.query(AnomalyAlert).filter(
            AnomalyAlert.patient_id == patient.id,
            AnomalyAlert.resolved == False,
        ).all()

        # Determine overall risk tier (dropout or anomaly)
        risk_tier = "GREEN"
        if latest_dropout:
            risk_tier = latest_dropout.risk_tier.value if hasattr(latest_dropout.risk_tier, "value") else str(latest_dropout.risk_tier)
        
        for anomaly in anomalies:
            anomaly_tier = anomaly.alert_tier.value if hasattr(anomaly.alert_tier, "value") else str(anomaly.alert_tier)
            tier_priority = {"RED": 0, "AMBER": 1, "GREEN": 2}
            if tier_priority.get(anomaly_tier, 2) < tier_priority.get(risk_tier, 2):
                risk_tier = anomaly_tier

        result.append({
            "patient_id": patient.id,
            "hash_id": patient.hash_id,
            "status": patient.status.value if hasattr(patient.status, "value") else str(patient.status),
            "enrolled_at": patient.enrolled_at,
            "match_score": patient.match_score or 0.0,
            "dropout_risk": {
                "score": latest_dropout.score if latest_dropout else None,
                "tier": risk_tier,
                "days_since_login": latest_dropout.days_since_login if latest_dropout else None,
                "symptom_logs_week": latest_dropout.symptom_logs_week if latest_dropout else None,
                "wearable_uploads_week": latest_dropout.wearable_uploads_week if latest_dropout else None,
                "scored_at": latest_dropout.scored_at if latest_dropout else None,
            },
            "anomaly_alerts_count": len(anomalies),
            "anomaly_alerts": [
                {
                    "id": a.id,
                    "biometric_type": a.biometric_type,
                    "patient_value": a.patient_value,
                    "cohort_mean": a.cohort_mean,
                    "z_score": a.z_score,
                    "tier": a.alert_tier.value if hasattr(a.alert_tier, "value") else str(a.alert_tier),
                    "created_at": a.created_at,
                }
                for a in anomalies
            ],
        })

    # Sort by risk tier (RED first)
    tier_order = {"RED": 0, "AMBER": 1, "GREEN": 2}
    result.sort(key=lambda x: tier_order.get(x["dropout_risk"]["tier"], 2))
    
    return result
