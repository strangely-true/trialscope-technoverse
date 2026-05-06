"""
Agent 3 — Candidate Matching
Scores extracted candidates against trial criteria using LLM-based semantic matching.
"""
import hashlib
from typing import List
import math
import json
from sqlalchemy.orm import Session
from models.models import Trial, ExtractedCandidate, MatchedCandidate
from services.llm_service import get_fallback_llm

def _cosine_similarity(vec1: list, vec2: list) -> float:
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)


def _build_trial_vector(trial: Trial) -> list:
    """Build a simple feature vector for a trial."""
    return [
        1.0,                                     # condition_match placeholder
        1.0,                                     # symptom_overlap target
        1.0 if trial.stage else 0.5,             # stage importance
        float(trial.age_min) / 100.0,            # age_min normalised
        float(trial.age_max) / 100.0,            # age_max normalised
        1.0 if trial.exclusion_criteria else 0.0, # has exclusion criteria
    ]


def _llm_semantic_match(candidate: ExtractedCandidate, trial: Trial) -> dict:
    """Use LLM to semantically match candidate condition with trial disease."""
    conditions = candidate.extracted_conditions or []
    symptoms = candidate.extracted_symptoms or []
    
    llm = get_fallback_llm(model_type="fast", temperature=0.1)
    
    prompt = f"""You are the Antigravity Clinical Matching Expert.
Your goal is to perform deep medical reasoning to match patients to global trials.

MATCHING RULES:
1. PERFECT CONDITION MATCH: The patient's condition must match the trial disease.
   - YES: "Leukemia" matches "Blood Cancer" (synonym).
   - YES: "Breast Cancer" matches "Breast Cancer" (exact).
   - NO: "Blood Pressure" does NOT match "Blood Cancer".
   - NO: "Cancer" alone is TOO GENERIC for "Blood Cancer".
2. STAGE ALIGNMENT: 
   - If trial specifies a stage (e.g., {trial.stage or 'Not specified'}), the patient's severity/stage ({candidate.severity or 'Not specified'}) must be compatible.
   - Do NOT confuse "Stage 4" with "Phase 4".
3. NO PARTIAL KEYWORD MATCHES: "blood" alone does NOT match "blood cancer".

Trial Disease: {trial.disease}
Trial Stage: {trial.stage or 'Not specified'}
Patient Conditions: {', '.join(map(str, conditions)) if conditions else 'None'}
Patient Symptoms: {', '.join(map(str, symptoms)) if symptoms else 'None'}
Patient Severity: {candidate.severity or 'Not specified'}

Respond ONLY with valid JSON:
{{
  "is_match": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief medical explanation"
}}"""
    
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
        result = json.loads(content)
        return result
    except Exception as e:
        print(f"[Agent3] LLM matching error: {e}")
        return {"is_match": False, "confidence": 0.0, "reason": "LLM error"}


def _build_candidate_vector(candidate: ExtractedCandidate, trial: Trial, llm_match: dict) -> list:
    """Build a feature vector for a candidate against the trial."""
    symptoms = candidate.extracted_symptoms or []

    condition_match = float(llm_match["is_match"]) * llm_match["confidence"]
    symptom_overlap = min(len(symptoms) / 5.0, 1.0)
    severity_match = 1.0 if candidate.severity in ["severe", "moderate", "chronic"] else 0.5
    age_proxy = 0.5
    age_max_proxy = 0.7
    exclusion_clear = 0.8

    return [
        condition_match,
        symptom_overlap,
        severity_match,
        age_proxy,
        age_max_proxy,
        exclusion_clear,
    ]


def run_matching(trial_id: int, db: Session) -> dict:
    """Score all extracted candidates for a trial."""
    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    if not trial:
        return {"error": "Trial not found"}

    candidates = db.query(ExtractedCandidate).filter(ExtractedCandidate.trial_id == trial_id).all()
    if not candidates:
        return {"matched": 0, "trial_id": trial_id}

    trial_vec = _build_trial_vector(trial)

    # Deduplicate by user_handle (keep highest confidence)
    handle_map: dict = {}
    for c in candidates:
        handle = hashlib.md5((c.user_handle or str(c.id)).encode()).hexdigest()
        if handle not in handle_map or c.confidence_score > handle_map[handle].confidence_score:
            handle_map[handle] = c

    matched_count = 0
    for candidate in handle_map.values():
        llm_match = _llm_semantic_match(candidate, trial)
        
        if not llm_match["is_match"]:
            print(f"[Agent3] Rejected: {llm_match['reason']}")
            continue
        
        cand_vec = _build_candidate_vector(candidate, trial, llm_match)
        score = _cosine_similarity(trial_vec, cand_vec)
        score = round(min(max(score, 0.0), 1.0), 4)

        if score < 0.60:
            continue

        tier = "HIGH" if score >= 0.85 else "MEDIUM"

        # Upsert matched candidate record
        existing = db.query(MatchedCandidate).filter(
            MatchedCandidate.trial_id == trial_id,
            MatchedCandidate.candidate_id == candidate.id,
        ).first()

        if existing:
            existing.match_score = score
            existing.match_tier = tier
        else:
            db.add(MatchedCandidate(
                trial_id=trial_id,
                candidate_id=candidate.id,
                match_score=score,
                match_tier=tier,
                status="pending_consent",
            ))
        matched_count += 1

    db.commit()
    result = {"matched": matched_count, "trial_id": trial_id}
    print(f"[Agent3] Matching done: {result}")
    return result
