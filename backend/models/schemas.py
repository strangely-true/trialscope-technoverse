"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    patient = "patient"
    coordinator = "coordinator"
    pharma = "pharma"


class TrialStatus(str, Enum):
    active = "active"
    paused = "paused"
    completed = "completed"
    draft = "draft"


class CandidateStatus(str, Enum):
    pending_consent = "pending_consent"
    consent_given = "consent_given"
    opted_out = "opted_out"
    no_response = "no_response"
    enrolled = "enrolled"
    fraud_flagged = "fraud_flagged"
    withdrawn = "withdrawn"


class AlertTier(str, Enum):
    RED = "RED"
    AMBER = "AMBER"
    GREEN = "GREEN"


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole
    preferred_language: str = "English"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    full_name: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    phone_number: Optional[str]
    phone_verified: bool
    role: UserRole
    preferred_language: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Trial Schemas ───────────────────────────────────────────────────────────

class TrialCreate(BaseModel):
    title: str
    disease: str
    stage: Optional[str] = None
    age_min: int = 18
    age_max: int = 80
    gender: str = "any"
    location_preference: Optional[str] = None
    exclusion_criteria: Optional[str] = None
    inclusion_criteria: Optional[str] = None
    patients_needed: int
    description: Optional[str] = None


class TrialOut(BaseModel):
    id: int
    pharma_user_id: int
    title: str
    disease: str
    stage: Optional[str]
    age_min: int
    age_max: int
    gender: str
    location_preference: Optional[str]
    exclusion_criteria: Optional[str]
    inclusion_criteria: Optional[str]
    patients_needed: int
    description: Optional[str]
    consent_template_url: Optional[str] = None
    consent_template_name: Optional[str] = None
    consent_template_text: Optional[str] = None
    consent_version: Optional[int] = None
    status: TrialStatus
    created_at: datetime
    consent_summary: Optional[List[str]] = None

    class Config:
        from_attributes = True


# ─── Candidate Schemas ───────────────────────────────────────────────────────

class MatchedCandidateOut(BaseModel):
    id: int
    trial_id: int
    candidate_id: int
    match_score: float
    match_tier: str
    status: CandidateStatus
    created_at: datetime

    class Config:
        from_attributes = True


class ConsentResponse(BaseModel):
    candidate_id: int
    trial_id: int
    response: str  # YES / NO


class ConsentTemplateOut(BaseModel):
    trial_id: int
    title: str
    consent_template_url: Optional[str] = None
    consent_template_name: Optional[str] = None
    consent_template_text: str
    consent_version: int
    source: str = "default"


class ConsentSubmit(BaseModel):
    trial_id: int
    typed_name: str
    acknowledged: bool = True
    field_values: dict[str, Any] = Field(default_factory=dict)


class ConsentSubmissionOut(BaseModel):
    id: int
    trial_id: int
    hash_id: str
    typed_name: str
    acknowledged: bool
    signed_pdf_url: Optional[str] = None
    signed_at: datetime

    class Config:
        from_attributes = True


# ─── Patient History Schema ───────────────────────────────────────────────────

class PatientHistorySubmit(BaseModel):
    candidate_id: Optional[int] = None
    trial_id: Optional[int] = None
    full_name: str
    age: int
    gender: str
    consent_given: bool = False
    city: str
    country: str
    diagnosed_conditions: List[str]
    symptom_description: str
    duration: str
    current_medications: Optional[str] = None
    previous_treatments: Optional[str] = None
    doctor_contact: Optional[str] = None


# ─── Symptom Log Schema ───────────────────────────────────────────────────────

class SymptomLogCreate(BaseModel):
    trial_id: int
    symptoms_json: dict


# ─── Wearable Data Schema ────────────────────────────────────────────────────

class WearableUpload(BaseModel):
    trial_id: int
    heart_rate: Optional[float] = None
    glucose: Optional[float] = None
    steps: Optional[int] = None
    temperature: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None


# ─── Monitoring Schemas ──────────────────────────────────────────────────────

class DropoutScoreOut(BaseModel):
    id: int
    patient_id: int
    trial_id: int
    score: float
    risk_tier: AlertTier
    days_since_login: int
    symptom_logs_week: int
    wearable_uploads_week: int
    scored_at: datetime

    class Config:
        from_attributes = True


class AnomalyAlertOut(BaseModel):
    id: int
    patient_id: int
    trial_id: int
    biometric_type: str
    patient_value: float
    cohort_mean: float
    z_score: float
    alert_tier: AlertTier
    created_at: datetime
    resolved: bool

    class Config:
        from_attributes = True


# ─── Chatbot Schema ───────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # user / assistant
    content: str
