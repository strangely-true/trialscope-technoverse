"""
Questionnaire Router — Patient onboarding + global trial search endpoints.
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from auth.jwt_handler import get_current_user
from models.questionnaire import QuestionnaireSubmit
from models.models import PatientQuestionnaire, ExternalTrialMatch, User
from services.query_builder import build_search_query, build_api_params
from services.scraper_engine import search_all_databases_unified as search_all_databases
from services.llm_trial_filter import filter_trials_with_llm
from services.global_trial_scraper import get_global_database_catalog
from db.database import get_db

router = APIRouter(prefix="/questionnaire", tags=["Patient Questionnaire"])


@router.post("/submit")
async def submit_questionnaire(
    data: QuestionnaireSubmit,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Saves questionnaire to DB, builds search query,
    fires global database search in background.
    """
    patient_id = current_user.id

    search_query = build_search_query(data.model_dump())
    api_params = build_api_params(data.model_dump())

    # Upsert: update if exists, create if not
    existing = (
        db.query(PatientQuestionnaire)
        .filter(PatientQuestionnaire.patient_id == patient_id)
        .first()
    )

    if existing:
        for key, value in data.model_dump().items():
            setattr(existing, key, value)
        existing.search_query_built = search_query
        existing.search_status = "searching"
        existing.updated_at = datetime.now()
        db.commit()
        db.refresh(existing)
        questionnaire_record = existing
    else:
        questionnaire_record = PatientQuestionnaire(
            patient_id=patient_id,
            search_query_built=search_query,
            search_status="searching",
            **data.model_dump(),
        )
        db.add(questionnaire_record)
        db.commit()
        db.refresh(questionnaire_record)

    # Fire global search in background
    background_tasks.add_task(
        run_global_search,
        patient_id=patient_id,
        search_query=search_query,
        api_params=api_params,
        questionnaire=data.model_dump(),
    )

    return {
        "message": "Questionnaire saved. Searching global databases...",
        "search_query": search_query,
        "questionnaire_id": questionnaire_record.id,
        "status": "searching",
    }


async def run_global_search(
    patient_id: int,
    search_query: str,
    api_params: dict,
    questionnaire: dict,
):
    """
    Background task: searches all 20 databases and saves results to DB.
    Uses its own DB session (background tasks run outside request scope).
    """
    from db.database import SessionLocal

    db = SessionLocal()
    try:
        # Clear previous matches for this patient
        db.query(ExternalTrialMatch).filter(
            ExternalTrialMatch.patient_id == patient_id
        ).delete()
        db.commit()

        # Search all databases
        raw_results = await search_all_databases(search_query, api_params)

        # Filter with LLM — replaces keyword matching
        filtered_results = filter_trials_with_llm(
            patient_profile=questionnaire,
            raw_trials=raw_results,
        )

        saved = 0
        for trial in filtered_results:
            match_record = ExternalTrialMatch(
                patient_id=patient_id,
                source_database=trial.get("source_database", ""),
                source_database_url=trial.get("source_database_url", ""),
                external_trial_id=trial.get("external_trial_id", ""),
                trial_name=trial.get("trial_name", "Unknown"),
                condition=trial.get("condition", ""),
                location=trial.get("location", ""),
                phase=trial.get("phase", "Unknown"),
                status=trial.get("status", "RECRUITING"),
                eligibility_summary=trial.get("eligibility_summary", ""),
                external_url=trial.get("external_url", ""),
                match_score=trial.get("match_score", 0.5),
                match_tier=trial.get("match_tier", "MEDIUM"),
                match_reason=trial.get("match_reason", ""),
                why_relevant=trial.get("why_relevant", ""),
                concerns=trial.get("concerns"),
            )
            db.add(match_record)
            saved += 1

        db.commit()
        print(f"[GlobalSearch] Saved {saved} external matches for patient {patient_id}")
        
        # Mark search as completed
        pq = db.query(PatientQuestionnaire).filter(PatientQuestionnaire.patient_id == patient_id).first()
        if pq:
            pq.search_status = "completed"
            db.commit()

    except Exception as e:
        print(f"[GlobalSearch] Error: {e}")
        db.rollback()
        # Mark as completed even on error so UI doesn't hang forever
        pq = db.query(PatientQuestionnaire).filter(PatientQuestionnaire.patient_id == patient_id).first()
        if pq:
            pq.search_status = "completed"
            db.commit()
    finally:
        db.close()


@router.get("/status")
async def get_questionnaire_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns whether patient has completed questionnaire.
    Frontend uses this to decide questionnaire vs trial results.
    """
    questionnaire = (
        db.query(PatientQuestionnaire)
        .filter(PatientQuestionnaire.patient_id == current_user.id)
        .first()
    )

    external_count = (
        db.query(ExternalTrialMatch)
        .filter(ExternalTrialMatch.patient_id == current_user.id)
        .count()
    )

    return {
        "questionnaire_completed": questionnaire is not None,
        "search_query": questionnaire.search_query_built if questionnaire else None,
        "external_matches_found": external_count,
        "searching": questionnaire.search_status == "searching" if questionnaire else False,
        "questionnaire_data": {
            "primary_condition": questionnaire.primary_condition,
            "condition_stage": questionnaire.condition_stage,
            "condition_duration": questionnaire.condition_duration,
            "prior_treatments": questionnaire.prior_treatments,
            "current_medications": questionnaire.current_medications,
            "country": questionnaire.country,
            "age": questionnaire.age,
            "gender": questionnaire.gender,
            "additional_notes": questionnaire.additional_notes,
        }
        if questionnaire
        else None,
    }


@router.get("/external-matches")
async def get_external_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all external trial matches for this patient.
    Ordered by match_score descending across all tiers.
    """
    database_catalog = get_global_database_catalog()
    catalog_name_map = {
        source["name"].strip().lower(): source["name"]
        for source in database_catalog
    }

    def normalize_source_name(raw_name):
        normalized = (raw_name or "").strip()
        if not normalized:
            return "Unknown"
        return catalog_name_map.get(normalized.lower(), normalized)

    matches = (
        db.query(ExternalTrialMatch)
        .filter(
            ExternalTrialMatch.patient_id == current_user.id,
            ExternalTrialMatch.is_active == True,
        )
        .order_by(ExternalTrialMatch.match_score.desc())
        .all()
    )

    source_counts = {}
    source_samples = {}
    for m in matches:
        source_name = normalize_source_name(m.source_database)
        source_counts[source_name] = source_counts.get(source_name, 0) + 1
        if source_name not in source_samples:
            source_samples[source_name] = {
                "trial_name": m.trial_name,
                "external_url": m.external_url,
                "status": m.status,
                "phase": m.phase,
            }

    database_summary = [
        {
            "name": source["name"],
            "url": source["url"],
            "match_count": source_counts.get(source["name"], 0),
            "match_status": "matched" if source_counts.get(source["name"], 0) > 0 else "no_match",
            "sample_trial_name": source_samples.get(source["name"], {}).get("trial_name"),
            "sample_trial_url": source_samples.get(source["name"], {}).get("external_url"),
            "sample_status": source_samples.get(source["name"], {}).get("status"),
            "sample_phase": source_samples.get(source["name"], {}).get("phase"),
        }
        for source in database_catalog
    ]

    return {
        "total": len(matches),
        "databases_total": len(database_catalog),
        "databases_with_matches": sum(1 for item in database_summary if item["match_count"] > 0),
        "database_summary": database_summary,
        "matches": [
            {
                "id": m.id,
                "trial_name": m.trial_name,
                "condition": m.condition,
                "location": m.location,
                "phase": m.phase,
                "status": m.status,
                "eligibility_summary": m.eligibility_summary,
                "external_url": m.external_url,
                "source_database": normalize_source_name(m.source_database),
                "source_database_url": m.source_database_url,
                "match_score": m.match_score,
                "match_tier": m.match_tier,
                "match_reason": m.match_reason,
                "why_relevant": m.why_relevant,
                "concerns": m.concerns,
                "fetched_at": m.fetched_at.isoformat() if m.fetched_at else None,
            }
            for m in matches
        ],
    }


@router.put("/update")
async def update_questionnaire(
    data: QuestionnaireSubmit,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Patient can update their questionnaire answers.
    This re-triggers the global search with new data.
    """
    return await submit_questionnaire(data, background_tasks, current_user, db)
