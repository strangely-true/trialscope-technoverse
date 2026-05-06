"""
Trials router — Create trials, view candidates, enrolled patients.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from models.models import Trial, MatchedCandidate, VerifiedPatient, User
from models.schemas import TrialCreate, TrialOut, MatchedCandidateOut
from auth.jwt_handler import require_pharma, require_coordinator, get_current_user
from tasks.celery_worker import task_run_pipeline
from agents.agent1_social_discovery import run_social_discovery

router = APIRouter(prefix="/trials", tags=["Trials"])


@router.post("/create", response_model=TrialOut, status_code=201)
def create_trial(
    payload: TrialCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pharma),
):
    """Pharma creates a new trial and kicks off the AI agent pipeline."""
    trial = Trial(
        pharma_user_id=current_user.id,
        title=payload.title,
        disease=payload.disease,
        stage=payload.stage,
        age_min=payload.age_min,
        age_max=payload.age_max,
        gender=payload.gender,
        location_preference=payload.location_preference,
        exclusion_criteria=payload.exclusion_criteria,
        inclusion_criteria=payload.inclusion_criteria,
        patients_needed=payload.patients_needed,
        description=payload.description,
        status="active",
    )
    db.add(trial)
    db.commit()
    db.refresh(trial)

    # Kick off full AI pipeline via Celery
    criteria = {
        "disease": payload.disease,
        "age_min": payload.age_min,
        "age_max": payload.age_max,
        "gender": payload.gender,
        "exclusion_criteria": payload.exclusion_criteria,
        "inclusion_criteria": payload.inclusion_criteria,
    }
    # Kick off pipeline directly via Celery (not double-wrapped in background_tasks)
    task_run_pipeline.delay(trial.id, criteria)

    # Trigger dynamic social discovery immediately for pharma review (manual DM control).
    background_tasks.add_task(
        run_social_discovery,
        trial_id=trial.id,
        disease=payload.disease,
        stage=payload.stage,
    )

    return trial


@router.get("", response_model=List[TrialOut])
def list_trials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List trials filtered by patient's medical questionnaire."""
    from models.models import PatientQuestionnaire
    from sqlalchemy import or_, func

    # Get user's questionnaire
    q = db.query(PatientQuestionnaire).filter(PatientQuestionnaire.patient_id == current_user.id).first()
    
    # If no questionnaire and user is a patient, return nothing (force onboarding)
    if not q and current_user.role.value == "patient":
        return []
        
    query = db.query(Trial).filter(Trial.status == "active")
    
    if q:
        # Improved keyword-based matching
        condition = (q.primary_condition or "").lower()
        # Create a list of meaningful keywords (more than 3 chars)
        keywords = [word for word in condition.split() if len(word) > 3]
        
        if keywords:
            # Match if any keyword is in disease or title
            keyword_filters = []
            for kw in keywords:
                keyword_filters.append(func.lower(Trial.disease).contains(kw))
                keyword_filters.append(func.lower(Trial.title).contains(kw))
            query = query.filter(or_(*keyword_filters))
        else:
            # Fallback if no valid keywords
            query = query.filter(func.lower(Trial.disease).contains(condition))
        
        # Filter by age
        if q.age and str(q.age).isdigit():
            age = int(q.age)
            query = query.filter(Trial.age_min <= age, Trial.age_max >= age)
            
        # Filter by gender if specified
        if q.gender and q.gender.lower() != "any":
            query = query.filter(or_(Trial.gender == q.gender, Trial.gender == "any"))

    return query.order_by(Trial.created_at.desc()).all()


@router.get("/my", response_model=List[TrialOut])
def my_trials(db: Session = Depends(get_db), current_user: User = Depends(require_pharma)):
    """Pharma sees only their own trials."""
    return db.query(Trial).filter(Trial.pharma_user_id == current_user.id).order_by(Trial.created_at.desc()).all()


@router.get("/{trial_id}", response_model=TrialOut)
def get_trial(trial_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
    
    # Generate Consent Summary via Agent 6
    from agents.agent6_consent import run_consent_simplification
    from agents.agent11_multilingual import translate_consent_summary, translate_content
    
    # Use trial description as base for consent if no PDF available
    consent_summary = run_consent_simplification(trial.id, "", raw_text=trial.description)
    bullets = consent_summary.get("summary_bullets", [])
    
    # Translate if needed
    lang = current_user.preferred_language or "English"
    title = trial.title
    description = trial.description
    
    if lang != "English":
        try:
            bullets = translate_consent_summary(bullets, lang)
            title = translate_content(trial.title, lang)
            description = translate_content(trial.description, lang)
        except Exception as e:
            print(f"[Trials] Translation error: {e}")
    
    # To keep it simple without changing schema too much, I'll return it as a dict
    res = {
        "id": trial.id,
        "pharma_user_id": trial.pharma_user_id,
        "title": title,
        "description": description,
        "disease": trial.disease,
        "stage": trial.stage,
        "age_min": trial.age_min,
        "age_max": trial.age_max,
        "gender": trial.gender,
        "location_preference": trial.location_preference,
        "exclusion_criteria": trial.exclusion_criteria,
        "inclusion_criteria": trial.inclusion_criteria,
        "patients_needed": trial.patients_needed,
        "status": trial.status,
        "created_at": trial.created_at,
        "consent_summary": bullets
    }
    return res


@router.get("/{trial_id}/candidates", response_model=List[MatchedCandidateOut])
def get_candidates(
    trial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # pharma + coordinator can both view
):
    """Return matched candidates ordered by match score."""
    if current_user.role.value not in ("coordinator", "pharma"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only coordinators and pharma can view candidates")
    return (
        db.query(MatchedCandidate)
        .filter(MatchedCandidate.trial_id == trial_id)
        .order_by(MatchedCandidate.match_score.desc())
        .all()
    )



@router.get("/{trial_id}/enrolled")
def get_enrolled(
    trial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator),
):
    """Return enrolled verified patients for a trial."""
    patients = db.query(VerifiedPatient).filter(VerifiedPatient.trial_id == trial_id).all()
    return [
        {
            "id": p.id,
            "hash_id": p.hash_id,
            "match_score": p.match_score,
            "status": p.status.value if hasattr(p.status, "value") else str(p.status),
            "enrolled_at": p.enrolled_at,
        }
        for p in patients
    ]


@router.post("/{trial_id}/run-pipeline")
def trigger_pipeline(
    trial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pharma),
):
    """Manually trigger the full AI pipeline for a trial (testing / re-run)."""
    trial = db.query(Trial).filter(Trial.id == trial_id, Trial.pharma_user_id == current_user.id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found or access denied")
    criteria = {
        "disease": trial.disease,
        "age_min": trial.age_min,
        "age_max": trial.age_max,
        "gender": trial.gender,
        "exclusion_criteria": trial.exclusion_criteria,
        "inclusion_criteria": trial.inclusion_criteria,
    }
    task = task_run_pipeline.delay(trial_id, criteria)
    return {"status": "queued", "task_id": task.id, "trial_id": trial_id}

