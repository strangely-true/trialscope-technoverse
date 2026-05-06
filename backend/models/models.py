"""
SQLAlchemy ORM Models — All TrialGo database tables.
"""
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid
from db.database import Base


# ─── Enumerations ────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    patient = "patient"
    coordinator = "coordinator"
    pharma = "pharma"


class CandidateStatus(str, enum.Enum):
    pending_consent = "pending_consent"
    consent_given = "consent_given"
    opted_out = "opted_out"
    no_response = "no_response"
    enrolled = "enrolled"
    fraud_flagged = "fraud_flagged"
    withdrawn = "withdrawn"


class MatchTier(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"


class AlertTier(str, enum.Enum):
    RED = "RED"
    AMBER = "AMBER"
    GREEN = "GREEN"


class TrialStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"
    draft = "draft"


# ─── Tables ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.patient)
    full_name = Column(String(255))
    phone_number = Column(String(20))
    phone_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    preferred_language = Column(String(50), default="English")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CallLog(Base):
    __tablename__ = "call_logs"
    id = Column(Integer, primary_key=True, index=True)
    coordinator_id = Column(Integer, ForeignKey("users.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    twilio_call_sid = Column(String(100))
    status = Column(String(50))
    duration_seconds = Column(Integer)
    initiated_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True))

class Trial(Base):
    __tablename__ = "trials"
    id = Column(Integer, primary_key=True, index=True)
    pharma_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    disease = Column(String(255), nullable=False)
    stage = Column(String(50))
    age_min = Column(Integer, default=18)
    age_max = Column(Integer, default=80)
    gender = Column(String(20), default="any")
    location_preference = Column(String(255))
    exclusion_criteria = Column(Text)
    inclusion_criteria = Column(Text)
    patients_needed = Column(Integer, nullable=False)
    description = Column(Text)
    consent_template_url = Column(String(500))
    consent_template_name = Column(String(255))
    consent_template_text = Column(Text)
    consent_version = Column(Integer, default=1)
    status = Column(SAEnum(TrialStatus), default=TrialStatus.draft)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pharma_user = relationship("User", foreign_keys=[pharma_user_id])
    matched_candidates = relationship("MatchedCandidate", back_populates="trial")


class RawMedicalData(Base):
    __tablename__ = "raw_medical_data"
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"))
    source = Column(String(100))  # clinicaltrials/who/fhir
    raw_json = Column(JSON)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())


class SocialRawPost(Base):
    __tablename__ = "social_raw_posts"
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"))
    source = Column(String(50))  # reddit/twitter/forum
    user_handle = Column(String(255))
    post_text = Column(Text)
    post_date = Column(DateTime(timezone=True))
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())


class SocialDiscoveryLead(Base):
    __tablename__ = "social_discovery_leads"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"), nullable=False, index=True)
    platform = Column(String(20), nullable=False)  # reddit/twitter
    username = Column(String(100), nullable=False)
    profile_url = Column(String(300))
    post_text = Column(Text)
    post_url = Column(String(300))
    llm_confidence = Column(Float, default=0.0)
    llm_reasoning = Column(Text)
    relation = Column(String(50), default="unknown")  # self/family_member/unknown
    pharma_action = Column(String(50), default="pending")  # pending/approved/rejected
    dm_sent = Column(Boolean, default=False)
    dm_sent_at = Column(DateTime(timezone=True))
    discovered_at = Column(DateTime(timezone=True), server_default=func.now())


class ExtractedCandidate(Base):
    __tablename__ = "extracted_candidates"
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"))
    source = Column(String(50))
    user_handle = Column(String(255))
    extracted_conditions = Column(JSON)  # list of ICD-10 codes
    extracted_symptoms = Column(JSON)    # list of symptom strings
    severity = Column(String(50))
    duration = Column(String(100))
    location = Column(String(255))
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MatchedCandidate(Base):
    __tablename__ = "matched_candidates"
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"))
    candidate_id = Column(Integer, ForeignKey("extracted_candidates.id"))
    match_score = Column(Float, nullable=False)
    match_tier = Column(SAEnum(MatchTier), nullable=False)
    status = Column(SAEnum(CandidateStatus), default=CandidateStatus.pending_consent)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trial = relationship("Trial", back_populates="matched_candidates")
    candidate = relationship("ExtractedCandidate")


class ConsentAuditLog(Base):
    """Append-only consent audit trail — never update rows."""
    __tablename__ = "consent_audit_log"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("extracted_candidates.id"))
    trial_id = Column(Integer, ForeignKey("trials.id"))
    channel = Column(String(50))   # reddit/twitter/email/sms/chatbot/consent_form
    message_sent = Column(Text)
    response = Column(String(50))  # YES/NO/PENDING/CHATBOT_SESSION
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class ConsentSubmission(Base):
    __tablename__ = "consent_submissions"
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"), nullable=False, index=True)
    hash_id = Column(String(64), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("extracted_candidates.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    template_url = Column(String(500))
    template_name = Column(String(255))
    template_version = Column(Integer, default=1)
    typed_name = Column(String(255), nullable=False)
    field_values = Column(JSON, default=dict)
    acknowledged = Column(Boolean, default=False)
    signed_pdf_url = Column(String(500))
    signed_pdf_key = Column(String(500))
    signed_at = Column(DateTime(timezone=True), server_default=func.now())


class VerifiedPatient(Base):
    __tablename__ = "verified_patients"
    id = Column(Integer, primary_key=True, index=True)
    hash_id = Column(String(64), unique=True, nullable=False, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"))
    fhir_bundle_json = Column(JSON)
    report_s3_url = Column(String(500))
    wearable_data_s3_url = Column(String(500))
    match_score = Column(Float)
    status = Column(SAEnum(CandidateStatus), default=CandidateStatus.enrolled)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))


class DropoutScore(Base):
    __tablename__ = "dropout_scores"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("verified_patients.id"))
    trial_id = Column(Integer, ForeignKey("trials.id"))
    score = Column(Float, nullable=False)
    risk_tier = Column(SAEnum(AlertTier), nullable=False)
    days_since_login = Column(Integer, default=0)
    symptom_logs_week = Column(Integer, default=0)
    wearable_uploads_week = Column(Integer, default=0)
    scored_at = Column(DateTime(timezone=True), server_default=func.now())


class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("verified_patients.id"))
    trial_id = Column(Integer, ForeignKey("trials.id"))
    biometric_type = Column(String(100))
    patient_value = Column(Float)
    cohort_mean = Column(Float)
    z_score = Column(Float)
    alert_tier = Column(SAEnum(AlertTier), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved = Column(Boolean, default=False)


class IdentityMap(Base):
    """Restricted table — stores encrypted PII, admin-only access."""
    __tablename__ = "identity_map"
    id = Column(Integer, primary_key=True, index=True)
    hash_id = Column(String(64), unique=True, nullable=False, index=True)
    real_name = Column(String(255))   # Should be encrypted at rest
    email = Column(String(255))        # Should be encrypted at rest
    phone = Column(String(50))         # Should be encrypted at rest
    secondary_consent_given = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FraudFlag(Base):
    __tablename__ = "fraud_flags"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("extracted_candidates.id"))
    reason = Column(Text, nullable=False)
    flagged_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved = Column(Boolean, default=False)


class SymptomLog(Base):
    __tablename__ = "symptom_logs"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("verified_patients.id"))
    trial_id = Column(Integer, ForeignKey("trials.id"))
    symptoms_json = Column(JSON)
    severity = Column(Integer)  # 1-10
    logged_at = Column(DateTime(timezone=True), server_default=func.now())


class WearableData(Base):
    __tablename__ = "wearable_data"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("verified_patients.id"))
    trial_id = Column(Integer, ForeignKey("trials.id"))
    heart_rate = Column(Float)
    glucose = Column(Float)
    steps = Column(Integer)
    temperature = Column(Float)
    blood_pressure_systolic = Column(Float)
    blood_pressure_diastolic = Column(Float)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())


class PatientQuestionnaire(Base):
    """Patient onboarding questionnaire — one row per patient."""
    __tablename__ = "patient_questionnaire"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    primary_condition = Column(String(255), nullable=False)
    condition_stage = Column(String(100))
    condition_duration = Column(String(100))
    prior_treatments = Column(Text)
    current_medications = Column(Text)
    country = Column(String(100))
    age = Column(Integer)
    gender = Column(String(50))
    additional_notes = Column(Text)
    search_query_built = Column(Text)
    search_status = Column(String(50), default="completed")
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ExternalTrialMatch(Base):
    """External trial matches from global clinical trial databases."""
    __tablename__ = "external_trial_matches"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_database = Column(String(255))
    source_database_url = Column(String(500))
    external_trial_id = Column(String(255))
    trial_name = Column(Text)
    condition = Column(String(255))
    location = Column(String(255))
    phase = Column(String(100))
    status = Column(String(100))
    eligibility_summary = Column(Text)
    external_url = Column(Text)
    match_score = Column(Float)
    match_tier = Column(String(20))
    match_reason = Column(Text)
    why_relevant = Column(Text)
    concerns = Column(Text)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

