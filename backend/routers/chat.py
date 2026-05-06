"""
Chatbot router — AI Trust Assistant for trials.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import User
from auth.jwt_handler import get_current_user
from services.llm_service import invoke_llm_chain
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    trial_id: int
    message: str
    history: List[dict] = []

@router.post("/trust-assistant")
def chat_trust_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI chatbot provides simple answers about the trial and data privacy."""
    from models.models import Trial
    trial = db.query(Trial).filter(Trial.id == payload.trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")

    lang = current_user.preferred_language or "English"
    
    system_prompt = f"You are a friendly clinical trial assistant named TrialGo AI. Your goal is to explain the trial '{trial.title}' to a patient in simple, non-technical language. The patient's preferred language is {lang}. Always reply in {lang}. If they ask about data privacy, explain that TrialGo uses decentralized identity and zero-knowledge proof to protect them. Be concise (under 100 words)."
    
    human_prompt = f"Trial Description: {trial.description}\n\nPatient Question: {{message}}"
    
    try:
        response = invoke_llm_chain(system_prompt, human_prompt, {"message": payload.message}, model_type="fast")
        return {"reply": response.content}
    except Exception as e:
        return {"reply": "I am having trouble connecting to my brain. Please try again in a moment."}
