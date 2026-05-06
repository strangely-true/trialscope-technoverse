"""
Agent 7 — Dropout Prediction
Scheduled every 24 hours via Celery Beat.
Uses LogisticRegression trained on engagement features (falls back to heuristics).
On RED flag: triggers Agent 10 re-engagement + WebSocket push.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.models import VerifiedPatient, DropoutScore, SymptomLog, WearableData, ConsentAuditLog
import numpy as np
import os


def _get_engagement_features(patient: VerifiedPatient, db: Session) -> list:
    """Build a 5-feature engagement vector for the past 7 days."""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

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

    # Messages responded to (as % proxy — count YES responses)
    total_messages = db.query(ConsentAuditLog).filter(
        ConsentAuditLog.candidate_id == patient.id,
    ).count()
    yes_responses = db.query(ConsentAuditLog).filter(
        ConsentAuditLog.candidate_id == patient.id,
        ConsentAuditLog.response == "YES",
    ).count()
    response_rate = (yes_responses / total_messages) if total_messages > 0 else 0.5

    return [days_since_login, symptom_count, wearable_count, response_rate, 0]


def _predict_dropout_score(features: list) -> float:
    """
    Rule-based dropout scoring (fallback when no trained model).
    Returns probability 0.0 (no risk) to 1.0 (high risk).
    """
    try:
        import joblib
        model_path = os.path.join(os.path.dirname(__file__), "../ml/dropout_model.pkl")
        model = joblib.load(model_path)
        return float(model.predict_proba([features])[0][1])
    except Exception:
        # Heuristic: high days_since_login + low engagement = high risk
        days = features[0]
        symptom_logs = features[1]
        wearable_uploads = features[2]
        score = min(days / 14.0, 1.0) * 0.6
        score += max(0.0, (3 - symptom_logs) / 3.0) * 0.2
        score += max(0.0, (3 - wearable_uploads) / 3.0) * 0.2
        return round(min(score, 1.0), 3)


def run_dropout_prediction(db: Session) -> dict:
    """Score all enrolled patients for dropout risk."""
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
                days_since_login=features[0],
                symptom_logs_week=features[1],
                wearable_uploads_week=features[2],
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
