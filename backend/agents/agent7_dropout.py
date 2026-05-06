"""
Agent 7 — Dropout Prediction
Scheduled every 24 hours via Celery Beat.
Uses LogisticRegression trained on engagement features (falls back to heuristics).
On RED flag: triggers Agent 10 re-engagement + WebSocket push.
Factors: Days since login, symptom logs, wearable uploads, call acceptance rate, message response rate.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.models import VerifiedPatient, DropoutScore, SymptomLog, WearableData, ConsentAuditLog, CallLog, User
import numpy as np
import os


def _get_engagement_features(patient: VerifiedPatient, db: Session) -> dict:
    """Build engagement feature dict for the past 7 days including call acceptance rate."""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Days since last login
    if patient.last_login:
        days_since_login = (now - patient.last_login).days
    else:
        days_since_login = 14  # assume disengaged

    # Symptom logs this week
    symptom_count = db.query(SymptomLog).filter(
        SymptomLog.patient_id == patient.id,
        SymptomLog.logged_at >= week_ago,
    ).count()

    # Wearable uploads this week
    wearable_count = db.query(WearableData).filter(
        WearableData.patient_id == patient.id,
        WearableData.recorded_at >= week_ago,
    ).count()

    # Call acceptance rate (this month)
    total_calls = db.query(CallLog).filter(
        CallLog.patient_id == patient.id,
        CallLog.initiated_at >= month_ago,
    ).count()
    
    # Count calls that were accepted (status = 'completed' or 'in-progress')
    accepted_calls = db.query(CallLog).filter(
        CallLog.patient_id == patient.id,
        CallLog.initiated_at >= month_ago,
        CallLog.status.in_(["completed", "in-progress"]),
    ).count()
    
    call_acceptance_rate = (accepted_calls / total_calls) if total_calls > 0 else 0.5

    # Messages responded to (as % proxy — count YES responses)
    total_messages = db.query(ConsentAuditLog).filter(
        ConsentAuditLog.candidate_id == patient.id,
    ).count()
    yes_responses = db.query(ConsentAuditLog).filter(
        ConsentAuditLog.candidate_id == patient.id,
        ConsentAuditLog.response == "YES",
    ).count()
    message_response_rate = (yes_responses / total_messages) if total_messages > 0 else 0.5

    return {
        "days_since_login": days_since_login,
        "symptom_logs_week": symptom_count,
        "wearable_uploads_week": wearable_count,
        "call_acceptance_rate": call_acceptance_rate,
        "message_response_rate": message_response_rate,
        "total_calls_month": total_calls,
        "accepted_calls_month": accepted_calls,
    }


def _predict_dropout_score(features: dict) -> float:
    """
    Rule-based dropout scoring (fallback when no trained model).
    Returns probability 0.0 (no risk) to 1.0 (high risk).
    
    Scoring logic:
    - Days since login (60%): more days = higher risk
    - Low engagement (symptom/wearable logs) (20%): expected 3+ per week
    - Call acceptance rate (10%): low acceptance = risk
    - Message response rate (10%): low response = risk
    """
    try:
        import joblib
        model_path = os.path.join(os.path.dirname(__file__), "../ml/dropout_model.pkl")
        model = joblib.load(model_path)
        # Convert dict to feature vector in consistent order
        feature_vector = [
            features["days_since_login"],
            features["symptom_logs_week"],
            features["wearable_uploads_week"],
            features["call_acceptance_rate"],
            features["message_response_rate"],
        ]
        return float(model.predict_proba([feature_vector])[0][1])
    except Exception:
        # Heuristic scoring
        score = 0.0
        
        # Days since login (60% weight): high days = high risk
        days = features["days_since_login"]
        days_score = min(days / 14.0, 1.0)  # normalize to [0, 1]
        score += days_score * 0.60
        
        # Engagement: symptom logs (10% weight)
        symptom_logs = features["symptom_logs_week"]
        symptom_score = max(0.0, (3 - symptom_logs) / 3.0)  # expect 3/week
        score += symptom_score * 0.10
        
        # Engagement: wearable uploads (10% weight)
        wearable_uploads = features["wearable_uploads_week"]
        wearable_score = max(0.0, (3 - wearable_uploads) / 3.0)  # expect 3/week
        score += wearable_score * 0.10
        
        # Call acceptance rate (10% weight): low acceptance = risk
        call_acceptance = features["call_acceptance_rate"]
        call_score = max(0.0, 1.0 - call_acceptance)  # inverse: low acceptance = high score
        score += call_score * 0.10
        
        # Message response rate (10% weight): low response = risk
        message_response = features["message_response_rate"]
        message_score = max(0.0, 1.0 - message_response)  # inverse: low response = high score
        score += message_score * 0.10
        
        return round(min(score, 1.0), 3)


def run_dropout_prediction(db: Session) -> dict:
    """Score all enrolled patients for dropout risk based on multiple engagement factors."""
    patients = db.query(VerifiedPatient).filter(VerifiedPatient.status == "enrolled").all()
    results = {"RED": 0, "AMBER": 0, "GREEN": 0, "total": len(patients)}

    for patient in patients:
        try:
            features = _get_engagement_features(patient, db)
            score = _predict_dropout_score(features)

            if score >= 0.75:
                tier = "RED"
            elif score >= 0.50:
                tier = "AMBER"
            else:
                tier = "GREEN"

            db.add(DropoutScore(
                patient_id=patient.id,
                trial_id=patient.trial_id,
                score=score,
                risk_tier=tier,
                days_since_login=features["days_since_login"],
                symptom_logs_week=features["symptom_logs_week"],
                wearable_uploads_week=features["wearable_uploads_week"],
            ))
            results[tier] += 1

            # Trigger re-engagement for RED and AMBER patients
            if tier in ("RED", "AMBER"):
                try:
                    from agents.agent10_reengagement import run_reengagement
                    run_reengagement(patient.id, tier, db)
                except Exception as e:
                    print(f"[Agent7] Agent10 trigger error for patient {patient.id}: {e}")

        except Exception as e:
            print(f"[Agent7] Error scoring patient {patient.id}: {e}")

    db.commit()
    print(f"[Agent7] Dropout prediction done: {results}")
    return results
