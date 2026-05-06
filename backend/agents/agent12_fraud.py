"""
Agent 12 — Fraud Detection
Runs before outreach. Checks for duplicates, inconsistencies, bots, and impossible symptoms.
"""
import hashlib
from sqlalchemy.orm import Session
from models.models import MatchedCandidate, ExtractedCandidate, VerifiedPatient, FraudFlag

# ICD-10 impossible co-occurrence rules (simplified)
IMPOSSIBLE_COMBOS = [
    ({"C50.9"}, {"C61"}),    # breast cancer + prostate cancer simultaneously flagged
    ({"E10.9"}, {"E11.9"}),  # Type 1 and Type 2 diabetes simultaneously
]

MIN_REDDIT_KARMA = 10
MIN_TWITTER_ACCOUNT_AGE_DAYS = 30


def _check_duplicate(candidate: ExtractedCandidate, db: Session) -> bool:
    """Check if the user_handle already exists in verified_patients."""
    if not candidate.user_handle:
        return False
    hash_id = hashlib.sha256(candidate.user_handle.encode()).hexdigest()
    return db.query(VerifiedPatient).filter(VerifiedPatient.hash_id == hash_id).first() is not None


def _check_bot_signals(candidate: ExtractedCandidate) -> tuple[bool, str]:
    """Simple heuristic bot detection based on metadata."""
    if candidate.source == "reddit" and candidate.user_handle:
        # If handle starts with common bot patterns
        if any(candidate.user_handle.lower().startswith(p) for p in ["bot_", "auto_", "spam"]):
            return True, "Handle matches bot pattern"
    if candidate.source == "twitter" and candidate.user_handle:
        if candidate.user_handle.startswith("user_") and len(candidate.user_handle) > 15:
            return True, "Possible automated Twitter account"
    return False, ""


def _check_impossible_combos(candidate: ExtractedCandidate) -> tuple[bool, str]:
    """Check if extracted ICD-10 codes form an impossible combination."""
    conditions = candidate.extracted_conditions or []
    icd_codes = {c.get("icd10") for c in conditions if isinstance(c, dict)}
    for set_a, set_b in IMPOSSIBLE_COMBOS:
        if set_a.issubset(icd_codes) and set_b.issubset(icd_codes):
            return True, f"Impossible symptom combination: {set_a} + {set_b}"
    return False, ""


def _flag_candidate(candidate_id: int, matched_id: int, reason: str, db: Session):
    """Create a fraud flag and update candidate status."""
    db.add(FraudFlag(candidate_id=candidate_id, reason=reason))
    matched = db.query(MatchedCandidate).filter(MatchedCandidate.id == matched_id).first()
    if matched:
        matched.status = "fraud_flagged"


def run_fraud_check(trial_id: int, db: Session) -> dict:
    """Run all fraud checks on pending candidates for a trial."""
    candidates = (
        db.query(MatchedCandidate)
        .filter(MatchedCandidate.trial_id == trial_id, MatchedCandidate.status == "pending_consent")
        .all()
    )

    flagged = 0
    clean = 0

    for matched in candidates:
        extracted = db.query(ExtractedCandidate).filter(
            ExtractedCandidate.id == matched.candidate_id
        ).first()
        if not extracted:
            continue

        fraud_reason = None

        if _check_duplicate(extracted, db):
            fraud_reason = "Duplicate: user_handle already in verified_patients"
        else:
            is_bot, reason = _check_bot_signals(extracted)
            if is_bot:
                fraud_reason = f"Bot detected: {reason}"
            else:
                is_impossible, reason = _check_impossible_combos(extracted)
                if is_impossible:
                    fraud_reason = reason

        if fraud_reason:
            _flag_candidate(extracted.id, matched.id, fraud_reason, db)
            flagged += 1
        else:
            clean += 1

    db.commit()
    result = {"flagged": flagged, "clean": clean, "trial_id": trial_id}
    print(f"[Agent12] Fraud check done: {result}")
    return result
