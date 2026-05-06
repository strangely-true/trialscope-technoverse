"""
Agent 2 — NLP Entity Extraction
Extracts medical entities from social posts using regex + keyword matching.
Falls back gracefully if scispaCy is not installed.
"""
import re
import json
from sqlalchemy.orm import Session
from models.models import SocialRawPost, ExtractedCandidate

# ICD-10 keyword mapping (simplified)
ICD10_MAP = {
    "cancer": "C80.1", "blood cancer": "C96.9", "leukemia": "C91.0",
    "lymphoma": "C85.9", "breast cancer": "C50.9", "lung cancer": "C34.1",
    "diabetes": "E11.9", "type 2 diabetes": "E11.9", "type 1 diabetes": "E10.9",
    "alzheimer": "G30.9", "dementia": "F03.90", "parkinson": "G20",
    "multiple sclerosis": "G35", "ms": "G35",
    "heart disease": "I51.9", "hypertension": "I10", "stroke": "I63.9",
    "asthma": "J45.909", "copd": "J44.1", "pneumonia": "J18.9",
    "depression": "F32.9", "anxiety": "F41.9", "schizophrenia": "F20.9",
    "arthritis": "M13.9", "rheumatoid arthritis": "M06.9", "lupus": "M32.9",
    "kidney disease": "N18.9", "ckd": "N18.9", "renal failure": "N19",
    "hiv": "B20", "aids": "B24", "hepatitis": "B19.9",
    "covid": "U07.1", "covid-19": "U07.1",
}

SYMPTOM_KEYWORDS = [
    "pain", "fatigue", "tired", "shortness of breath", "nausea", "vomiting",
    "fever", "cough", "headache", "dizziness", "weakness", "swelling",
    "chest pain", "weight loss", "night sweats", "rash", "joint pain",
    "memory loss", "confusion", "tremors", "seizure", "numbness",
]

SEVERITY_KEYWORDS = {"severe": "severe", "mild": "mild", "moderate": "moderate",
                     "debilitating": "severe", "chronic": "chronic", "acute": "acute"}

DURATION_PATTERN = re.compile(
    r"(\d+)\s*(day|week|month|year)s?", re.IGNORECASE
)


def clean_text(text: str) -> str:
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"[^\w\s.,!?'-]", " ", text)
    return text.strip().lower()


def extract_conditions(text: str) -> list:
    found = []
    for keyword, icd in ICD10_MAP.items():
        if keyword in text:
            found.append({"condition": keyword, "icd10": icd})
    return found


def extract_symptoms(text: str) -> list:
    return [s for s in SYMPTOM_KEYWORDS if s in text]


def extract_severity(text: str) -> str:
    for kw, sev in SEVERITY_KEYWORDS.items():
        if kw in text:
            return sev
    return "unknown"


def extract_duration(text: str) -> str:
    match = DURATION_PATTERN.search(text)
    if match:
        return f"{match.group(1)} {match.group(2)}s"
    return "unknown"


def compute_confidence(conditions: list, symptoms: list) -> float:
    score = 0.0
    if conditions:
        score += 0.6
    score += min(len(symptoms) * 0.08, 0.4)
    return round(min(score, 1.0), 2)


def run_nlp_extraction(trial_id: int, db: Session) -> dict:
    """Process all raw social posts for a trial and extract candidate profiles."""
    posts = db.query(SocialRawPost).filter(SocialRawPost.trial_id == trial_id).all()
    processed = 0
    skipped = 0

    for post in posts:
        try:
            text = clean_text(post.post_text or "")
            conditions = extract_conditions(text)
            symptoms = extract_symptoms(text)

            if not conditions:
                skipped += 1
                continue

            severity = extract_severity(text)
            duration = extract_duration(text)
            confidence = compute_confidence(conditions, symptoms)

            candidate = ExtractedCandidate(
                trial_id=trial_id,
                source=post.source,
                user_handle=post.user_handle,
                extracted_conditions=conditions,
                extracted_symptoms=symptoms,
                severity=severity,
                duration=duration,
                location=None,
                confidence_score=confidence,
            )
            db.add(candidate)
            processed += 1
        except Exception as e:
            print(f"[Agent2] Error on post {post.id}: {e}")
            skipped += 1

    db.commit()
    result = {"processed": processed, "skipped": skipped, "trial_id": trial_id}
    print(f"[Agent2] NLP extraction done: {result}")
    return result
