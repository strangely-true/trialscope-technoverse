"""
Agent 8 — Anomaly Detection
Triggered every time a patient uploads wearable data.
Uses z-score against cohort mean/std to detect outliers.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.models import WearableData, AnomalyAlert
import math

BIOMETRICS = [
    "heart_rate", "glucose", "steps", "temperature",
    "blood_pressure_systolic", "blood_pressure_diastolic",
]

NORMAL_RANGES = {
    "heart_rate": (60, 100),
    "glucose": (70, 140),
    "steps": (0, 30000),
    "temperature": (36.1, 37.5),
    "blood_pressure_systolic": (90, 130),
    "blood_pressure_diastolic": (60, 90),
}


def run_anomaly_detection(patient_id: int, trial_id: int, wearable_data: dict, db: Session) -> list:
    """Detect anomalies via cohort z-score for each biometric."""
    alerts_created = []

    for metric in BIOMETRICS:
        patient_value = wearable_data.get(metric)
        if patient_value is None:
            continue

        # Get cohort values for this metric
        cohort_values = (
            db.query(getattr(WearableData, metric))
            .filter(
                WearableData.trial_id == trial_id,
                getattr(WearableData, metric).isnot(None),
            )
            .all()
        )
        values = [v[0] for v in cohort_values if v[0] is not None]


        if len(values) < 3:
            # Not enough cohort data — use known normal ranges
            low, high = NORMAL_RANGES.get(metric, (0, 1000))
            cohort_mean = (low + high) / 2.0
            cohort_std = (high - low) / 6.0
        else:
            cohort_mean = float(sum(values)) / len(values)
            variance = sum((v - cohort_mean) ** 2 for v in values) / len(values)
            cohort_std = float(math.sqrt(variance)) or 1.0

        z_score = (patient_value - cohort_mean) / cohort_std

        if abs(z_score) > 3.0:
            tier = "RED" if abs(z_score) > 4.5 else "AMBER"
            alert = AnomalyAlert(
                patient_id=patient_id,
                trial_id=trial_id,
                biometric_type=metric,
                patient_value=float(patient_value),
                cohort_mean=cohort_mean,
                z_score=round(z_score, 3),
                alert_tier=tier,
                resolved=False,
            )
            db.add(alert)
            alerts_created.append({
                "metric": metric,
                "value": patient_value,
                "z_score": round(z_score, 3),
                "tier": tier,
            })

    db.commit()
    if alerts_created:
        print(f"[Agent8] Anomalies for patient {patient_id}: {alerts_created}")
    return alerts_created
