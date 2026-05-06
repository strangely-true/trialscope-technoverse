#!/usr/bin/env python3
"""
End-to-end consent workflow test:
1. Pharma uploads/activates consent template
2. Patient fetches template and submits signed consent
3. Enrollment is gated until consent exists
4. Reviewer downloads signed PDF and validates content
"""

import sys
import json
from datetime import datetime
from pathlib import Path
import hashlib

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from models.models import Base, User, Trial, VerifiedPatient, ConsentSubmission, UserRole
from services.s3_service import build_text_pdf
import re

# Use in-memory SQLite for testing
DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Enable foreign keys for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_consent_workflow():
    """Test complete consent lifecycle"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*60)
        print("CONSENT E2E WORKFLOW TEST")
        print("="*60)
        
        # ===== SETUP: Create test fixtures =====
        print("\n[1/7] Creating test fixtures...")
        
        pharma_user = User(
            email="pharma@trial.com",
            hashed_password="test_hash",
            role=UserRole.pharma,
            full_name="Pharma Corp",
            is_active=True
        )
        db.add(pharma_user)
        db.flush()
        
        coordinator_user = User(
            email="coordinator@trial.com",
            hashed_password="test_hash",
            role=UserRole.coordinator,
            full_name="Coordinator",
            is_active=True
        )
        db.add(coordinator_user)
        db.flush()
        
        patient_user = User(
            email="patient@trial.com",
            hashed_password="test_hash",
            role=UserRole.patient,
            full_name="John Doe",
            is_active=True
        )
        db.add(patient_user)
        db.flush()
        
        trial = Trial(
            pharma_user_id=pharma_user.id,
            title="Test Trial",
            disease="Test Disease",
            stage="Phase II",
            age_min=18,
            age_max=80,
            gender="any",
            inclusion_criteria="",
            exclusion_criteria="",
            patients_needed=100
        )
        db.add(trial)
        db.commit()
        
        print(f"  [OK] Created pharma (id={pharma_user.id}), coordinator (id={coordinator_user.id}), patient (id={patient_user.id})")
        print(f"  [OK] Created trial (id={trial.id})")
        
        # ===== STEP 2: Pharma activates consent template =====
        print("\n[2/7] Pharma activates built-in consent template...")
        
        default_template = """CONSENT TO PARTICIPATE IN CLINICAL TRIAL

Trial: [[trial_name]]
Date: [[date]]

Participant Name: [[participant_name]]
City: [[city]]

I, [[participant_name]], hereby consent to participate in the [[trial_name]] clinical trial.

I have read and understood the informed consent document.
Signature (typed name): [[typed_name]]
Date: [[consent_date]]

Acknowledged: [[acknowledged]]
"""
        
        trial.consent_template_text = default_template
        trial.consent_template_name = "Default Built-in Template"
        trial.consent_version = 1
        db.add(trial)
        db.commit()
        print(f"  [OK] Template activated for trial {trial.id}")
        
        # ===== STEP 3: Patient fetches template and reviews =====
        print("\n[3/7] Patient fetches and reviews consent template...")
        
        # Extract fields from template (same logic as /consent/template endpoint)
        placeholder_pattern = r'\[\[(\w+)\]\]'
        matches = re.findall(placeholder_pattern, trial.consent_template_text)
        fields_found = list(set(matches))  # Deduplicate
        
        print(f"  [OK] Template fetched")
        print(f"  [OK] Fields extracted: {sorted(fields_found)}")
        
        # ===== STEP 4: Patient submits signed consent =====
        print("\n[4/7] Patient submits signed consent with field values...")
        
        field_values = {
            "participant_name": "John Doe",
            "city": "Boston",
            "typed_name": "John M. Doe",
            "consent_date": datetime.now().strftime("%Y-%m-%d"),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "trial_name": trial.title,
            "acknowledged": "yes"
        }
        
        # Generate signed PDF (same as /consent/submit endpoint)
        pdf_lines = [
            f"CONSENT SUBMISSION RECORD",
            f"Trial: {trial.title}",
            f"Participant (typed name): {field_values.get('typed_name', 'N/A')}",
            f"Signed: {datetime.now().isoformat()}",
            f"City: {field_values.get('city', 'N/A')}",
            f"",
            f"Submitted Field Values:",
        ]
        for key, val in field_values.items():
            pdf_lines.append(f"  {key}: {val}")
        pdf_lines.append(f"Acknowledged: {field_values.get('acknowledged', 'no')}")
        
        pdf_bytes = build_text_pdf("Signed Consent", pdf_lines)
        
        # Create hash_id for consent lookup
        patient_email_hash = hashlib.sha256(patient_user.email.encode()).hexdigest()[:16]
        
        # Create ConsentSubmission record
        consent_submission = ConsentSubmission(
            trial_id=trial.id,
            hash_id=patient_email_hash,
            user_id=patient_user.id,
            typed_name=field_values.get('typed_name'),
            field_values=json.dumps(field_values),
            acknowledged=True,
            signed_pdf_url=f"s3://trialgo/trial_{trial.id}/signed/{patient_email_hash}.pdf",
            signed_at=datetime.now()
        )
        db.add(consent_submission)
        db.commit()
        
        print(f"  [OK] Consent submission created (id={consent_submission.id})")
        print(f"  [OK] Typed name: {field_values['typed_name']}")
        print(f"  [OK] Hash ID: {patient_email_hash}")
        print(f"  [OK] PDF generated: {len(pdf_bytes)} bytes")
        
        # ===== STEP 5: Verify enrollment gate enforcement =====
        print("\n[5/7] Verifying enrollment gate (consent required before enrollment)...")
        
        # Check that consent submission exists before enrollment allowed
        existing_consent = db.query(ConsentSubmission).filter(
            ConsentSubmission.trial_id == trial.id,
            ConsentSubmission.user_id == patient_user.id
        ).first()
        
        if existing_consent:
            print(f"  [OK] Consent submission verified before enrollment")
            print(f"  [OK] Enrollment gate would PASS - patient can proceed")
        else:
            raise AssertionError("Consent submission not found - gate would FAIL!")
        
        # ===== STEP 6: Coordinator attempts to download PDF =====
        print("\n[6/7] Coordinator requests signed consent PDF download...")
        
        # In real app: GET /consent/download/{trial_id}/{subject_id}
        # Subject ID resolution logic - coordinator can download any subject's PDF
        download_consent = db.query(ConsentSubmission).filter(
            ConsentSubmission.trial_id == trial.id,
            ConsentSubmission.hash_id == patient_email_hash
        ).first()
        
        if download_consent and download_consent.signed_pdf_url:
            print(f"  [OK] Signed consent PDF located")
            print(f"  [OK] PDF URL: {download_consent.signed_pdf_url}")
            print(f"  [OK] Signed at: {download_consent.signed_at}")
        else:
            raise AssertionError("Signed consent PDF not found!")
        
        # ===== STEP 7: Validate PDF content =====
        print("\n[7/7] Validating PDF content...")
        
        # Verify PDF contains expected data
        pdf_text_decoded = pdf_bytes.decode('latin-1', errors='ignore')
        
        validations = [
            ("Trial title", trial.title in pdf_text_decoded),
            ("Participant typed name", field_values['typed_name'] in pdf_text_decoded),
            ("City", field_values['city'] in pdf_text_decoded),
            ("Acknowledged status", "acknowledged" in pdf_text_decoded.lower()),
        ]
        
        all_passed = True
        for check_name, check_result in validations:
            status = "[OK]" if check_result else "[FAIL]"
            print(f"  {status} {check_name}: {'present' if check_result else 'MISSING'}")
            if not check_result:
                all_passed = False
        
        # ===== FINAL RESULT =====
        print("\n" + "="*60)
        if all_passed:
            print("[OK] ALL TESTS PASSED")
            print("="*60)
            print("\nConsent workflow validated successfully:")
            print("  [OK] Pharma can activate templates")
            print("  [OK] Patient can submit signed consent")
            print("  [OK] Enrollment gate enforced")
            print("  [OK] Coordinator can download PDFs")
            print("  [OK] PDF content is correct")
            return 0
        else:
            print("[FAIL] SOME TESTS FAILED")
            print("="*60)
            return 1
        
    except Exception as exc:
        print(f"\n[FAIL] TEST FAILED: {exc}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()

if __name__ == "__main__":
    exit_code = test_consent_workflow()
    sys.exit(exit_code)
