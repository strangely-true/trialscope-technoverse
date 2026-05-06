from datetime import datetime, timedelta
import json
import random
from sqlalchemy.exc import IntegrityError

try:
    from backend.db.database import SessionLocal, engine
    from backend.models import models
except Exception:
    # Some containers mount the repo root so modules are top-level
    from db.database import SessionLocal, engine
    from models import models


def create_users(session):
    users = []
    roles = ["pharma", "coordinator", "patient"]
    # collect existing emails to avoid duplicate inserts
    existing_emails = set(u.email for u in session.query(models.User).all())
    # pharma users
    if "pharma@example.com" not in existing_emails:
        pharma = models.User(
            email="pharma@example.com",
            hashed_password="devpassword",
            full_name="Pharma Team",
            role="pharma",
            is_active=True,
        )
        session.add(pharma)
        users.append(pharma)
        existing_emails.add("pharma@example.com")

    if "coord@example.com" not in existing_emails:
        coord = models.User(
            email="coord@example.com",
            hashed_password="devpassword",
            full_name="Site Coordinator",
            role="coordinator",
            is_active=True,
        )
        session.add(coord)
        users.append(coord)
        existing_emails.add("coord@example.com")

    # patients
    for i in range(1, 11):
        email = f"patient{i}@example.com"
        if email in existing_emails:
            existing = session.query(models.User).filter_by(email=email).first()
            if existing:
                users.append(existing)
                continue

        u = models.User(
            email=email,
            hashed_password="devpassword",
            full_name=f"Patient {i}",
            role="patient",
            is_active=True,
        )
        session.add(u)
        users.append(u)
        existing_emails.add(email)

    session.flush()
    return users


def create_trials(session, pharma_user):
    trials = []
    for i in range(1, 4):
        t = models.Trial(
            pharma_user_id=pharma_user.id,
            title=f"Trial {i} - Cardio Study",
            disease="Cardiovascular",
            patients_needed=50,
            description=f"A demo trial {i} for cardio monitoring",
            stage="II",
            age_min=30,
            age_max=75,
        )
        session.add(t)
        trials.append(t)
    session.flush()
    return trials


def create_extracted_and_matched(session, trials, patient_users):
    extracted = []
    matched = []
    for trial in trials:
        for pu in patient_users[:5]:
            e = models.ExtractedCandidate(
                trial_id=trial.id,
                source="twitter",
                user_handle=f"user_{pu.id}",
                extracted_conditions=["I10"],
                extracted_symptoms=["fatigue", "shortness_of_breath"],
                severity=random.choice(["mild", "moderate", "severe"]),
                duration=f"{random.randint(1,30)} days",
                location="USA",
                confidence_score=round(random.uniform(0.6, 0.98), 2),
            )
            session.add(e)
            extracted.append(e)

    session.flush()

    for e in extracted:
        m = models.MatchedCandidate(
            trial_id=e.trial_id,
            candidate_id=e.id,
            match_score=round(random.uniform(70,99), 2),
            match_tier=random.choice([models.MatchTier.HIGH, models.MatchTier.MEDIUM]),
        )
        session.add(m)
        matched.append(m)

    session.flush()
    return extracted, matched


def create_verified_patients(session, matched_candidates, patient_users):
    verified = []
    for i, m in enumerate(matched_candidates[:8]):
        user = patient_users[i % len(patient_users)]
        vp = models.VerifiedPatient(
            hash_id=f"hash-{random.getrandbits(64):x}",
            trial_id=m.trial_id,
            fhir_bundle_json={"resourceType": "Patient", "id": f"vp-{user.id}", "name": [{"text": user.full_name}]},
            match_score=m.match_score if hasattr(m, 'match_score') else round(random.uniform(70,99),2),
            enrolled_at=datetime.utcnow(),
        )
        session.add(vp)
        verified.append(vp)

    session.flush()
    return verified


def create_consent_logs(session, verified_patients):
    for vp in verified_patients:
        ca = models.ConsentAuditLog(
            candidate_id=None,
            trial_id=vp.trial_id,
            channel="consent_form",
            message_sent="Auto-seeded consent",
            response="YES",
            timestamp=datetime.utcnow(),
        )
        session.add(ca)
    session.flush()


def create_identity_map(session, verified_patients):
    for vp in verified_patients:
        im = models.IdentityMap(
            hash_id=vp.hash_id,
            real_name=f"Real {vp.id}",
            email=f"real{vp.id}@example.com",
            phone=f"+1555{random.randint(1000000,9999999)}",
            secondary_consent_given=True,
        )
        session.add(im)
    session.flush()


def create_symptoms_and_wearables(session, verified_patients):
    for vp in verified_patients:
        for d in range(7):
            sl = models.SymptomLog(
                patient_id=vp.id,
                trial_id=vp.trial_id,
                symptoms_json={"symptoms": ["fatigue"]},
                severity=random.randint(1,10),
                logged_at=datetime.utcnow() - timedelta(days=d),
            )
            session.add(sl)

        wd = models.WearableData(
            patient_id=vp.id,
            trial_id=vp.trial_id,
            heart_rate=random.randint(55,110),
            glucose=round(random.uniform(70,120),1),
            steps=random.randint(1000,10000),
            temperature=round(random.uniform(36.0,37.5),1),
            blood_pressure_systolic=round(random.uniform(110,140),1),
            blood_pressure_diastolic=round(random.uniform(70,90),1),
        )
        session.add(wd)
    session.flush()


def create_anomalies_and_dropout(session, verified_patients):
    for vp in verified_patients:
        if random.random() < 0.3:
            a = models.AnomalyAlert(
                patient_id=vp.id,
                trial_id=vp.trial_id,
                biometric_type="heart_rate",
                patient_value=random.uniform(100,160),
                cohort_mean=random.uniform(60,80),
                z_score=round(random.uniform(2.0,4.5),2),
                alert_tier=random.choice([models.AlertTier.RED, models.AlertTier.AMBER, models.AlertTier.GREEN]),
            )
            session.add(a)

        ds = models.DropoutScore(
            patient_id=vp.id,
            trial_id=vp.trial_id,
            score=round(random.uniform(0,1), 3),
            risk_tier=random.choice([models.AlertTier.RED, models.AlertTier.AMBER, models.AlertTier.GREEN]),
            days_since_login=random.randint(0,30),
        )
        session.add(ds)
    session.flush()


def create_misc(session, trials):
    for trial in trials:
        rp = models.RawMedicalData(
            trial_id=trial.id,
            source="fhir",
            raw_json={"lab": "CBC", "value": random.randint(10,15)},
        )
        session.add(rp)

        sp = models.SocialRawPost(
            trial_id=trial.id,
            source="twitter",
            user_handle=f"seed_user_{trial.id}",
            post_text=f"Looking for participants for {trial.title}",
            post_date=datetime.utcnow() - timedelta(days=10),
        )
        session.add(sp)
    session.flush()


def create_candidates_for_trials(session, trials, patient_users, per_trial=20):
    """Create randomized extracted and matched candidates for each trial.

    For each trial create `per_trial` ExtractedCandidate rows, then create
    MatchedCandidate entries and some VerifiedPatient rows to simulate enrollments.
    """
    created_extracted = []
    created_matched = []
    created_verified = []

    for trial in trials:
        for i in range(per_trial):
            pu = random.choice(patient_users) if patient_users else None
            e = models.ExtractedCandidate(
                trial_id=trial.id,
                source=random.choice(["twitter", "reddit", "facebook"]),
                user_handle=f"seed_user_{trial.id}_{i}",
                extracted_conditions=random.sample(["I10", "E11", "I20", "J45"], k=random.randint(1,2)),
                extracted_symptoms=random.sample(["fatigue", "cough", "shortness_of_breath", "dizziness"], k=random.randint(1,3)),
                severity=random.choice(["mild", "moderate", "severe"]),
                duration=f"{random.randint(1,90)} days",
                location=random.choice(["USA", "India", "UK", "Canada"]),
                confidence_score=round(random.uniform(0.4, 0.99), 2),
            )
            session.add(e)
            created_extracted.append(e)

    session.flush()

    for e in created_extracted:
        m = models.MatchedCandidate(
            trial_id=e.trial_id,
            candidate_id=e.id,
            match_score=round(random.uniform(50, 99), 2),
            match_tier=random.choice([models.MatchTier.HIGH, models.MatchTier.MEDIUM]),
        )
        session.add(m)
        created_matched.append(m)

    session.flush()

    # Verify a small percentage of matched candidates
    sample_count = max(1, len(created_matched) // 10)
    for m in random.sample(created_matched, k=sample_count):
        user = random.choice(patient_users) if patient_users else None
        vp = models.VerifiedPatient(
            hash_id=f"hash-{random.getrandbits(64):x}",
            trial_id=m.trial_id,
            fhir_bundle_json={"resourceType": "Patient", "id": f"vp-{m.id}", "name": [{"text": user.full_name if user else "Seeded Patient"}]},
            match_score=m.match_score if hasattr(m, 'match_score') else round(random.uniform(50,99),2),
            enrolled_at=datetime.utcnow(),
        )
        session.add(vp)
        created_verified.append(vp)

    session.flush()
    return created_extracted, created_matched, created_verified


def run():
    session = SessionLocal()
    try:
        # Ensure tables exist (no-op if Alembic already applied)
        try:
            models.Base.metadata.create_all(bind=engine)
        except Exception:
            pass

        try:
            users = create_users(session)
        except IntegrityError:
            session.rollback()
            users = session.query(models.User).all()

        pharma_user = next((u for u in users if getattr(u, 'role', None) == "pharma"), None)
        if pharma_user is None:
            pharma_user = session.query(models.User).filter_by(role="pharma").first()
        patient_users = [u for u in users if getattr(u, 'role', None) == "patient"]

        trials = create_trials(session, pharma_user)
        extracted, matched = create_extracted_and_matched(session, trials, patient_users)
        verified = create_verified_patients(session, matched, patient_users)
        # Add many more randomized candidates per trial
        extra_extracted, extra_matched, extra_verified = create_candidates_for_trials(session, trials, patient_users, per_trial=30)
        create_consent_logs(session, verified)
        create_identity_map(session, verified)
        create_symptoms_and_wearables(session, verified)
        create_anomalies_and_dropout(session, verified)
        create_misc(session, trials)

        session.commit()

        # Summary
        counts = {
            "users": session.query(models.User).count(),
            "trials": session.query(models.Trial).count(),
            "extracted_candidates": session.query(models.ExtractedCandidate).count(),
            "matched_candidates": session.query(models.MatchedCandidate).count(),
            "verified_patients": session.query(models.VerifiedPatient).count(),
        }
        print("Seed complete. Summary:", json.dumps(counts, indent=2))

    except Exception as ex:
        session.rollback()
        print("Error during seeding:", ex)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run()
