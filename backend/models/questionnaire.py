"""
Pydantic schemas for the Patient Onboarding Questionnaire feature.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QuestionnaireSubmit(BaseModel):
    primary_condition: str
    condition_stage: Optional[str] = None
    condition_duration: Optional[str] = None
    prior_treatments: Optional[str] = None
    current_medications: Optional[str] = None
    country: str
    age: int
    gender: str
    additional_notes: Optional[str] = None


class QuestionnaireResponse(BaseModel):
    id: int
    patient_id: int
    primary_condition: str
    search_query_built: Optional[str] = None
    completed_at: Optional[datetime] = None
    message: str


class ExternalTrialMatchOut(BaseModel):
    id: int
    source_database: str
    source_database_url: Optional[str] = None
    trial_name: str
    condition: Optional[str] = None
    location: Optional[str] = None
    phase: Optional[str] = None
    status: Optional[str] = None
    eligibility_summary: Optional[str] = None
    external_url: Optional[str] = None
    match_score: float
    match_tier: str
    fetched_at: Optional[datetime] = None
