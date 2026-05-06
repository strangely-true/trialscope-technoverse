"""
LLM Filtering Engine — Strict Medical Reasoning Layer.
Uses the primary Gemini 3.1 Flash Lite model to evaluate raw trial results against patient medical history.
"""
import json
import re
from services.llm_service import get_fallback_llm
from langchain_core.prompts import ChatPromptTemplate

_STOP_WORDS = {
    "the", "and", "for", "with", "from", "into", "that", "this", "trial", "trials",
    "study", "studies", "patient", "patients", "disease", "condition", "clinical",
}


def _extract_terms(text: str) -> set[str]:
    raw_terms = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {term for term in raw_terms if len(term) >= 3 and term not in _STOP_WORDS}


def _tier_from_score(score: float) -> str:
    if score >= 0.75:
        return "HIGH"
    if score >= 0.5:
        return "MEDIUM"
    return "LOW"


def _coerce_score(value, default: float = 0.0) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError):
        score = default
    return max(0.0, min(1.0, score))


def _trial_haystack(trial: dict) -> str:
    return " ".join(
        [
            str(trial.get("trial_name", "")),
            str(trial.get("condition", "")),
            str(trial.get("eligibility_summary", "")),
            str(trial.get("external_url", "")),
        ]
    ).lower()


def _trial_key(trial: dict) -> tuple[str, str, str]:
    return (
        str(trial.get("source_database", "")).strip().lower(),
        str(trial.get("external_trial_id", trial.get("external_url", ""))).strip().lower(),
        str(trial.get("trial_name", "")).strip().lower(),
    )


def _fallback_filter(patient_profile: dict, raw_trials: list, minimum_score: float = 0.3) -> list:
    condition_terms = _extract_terms(
        f"{patient_profile.get('primary_condition', '')} {patient_profile.get('condition_stage', '')}"
    )
    if not condition_terms:
        return []

    fallback_results = []
    for trial in raw_trials:
        haystack = _trial_haystack(trial)
        hit_count = sum(1 for term in condition_terms if term in haystack)
        if hit_count == 0:
            continue

        score = min(0.95, 0.3 + (0.12 * hit_count))
        if score < minimum_score:
            continue
        fallback_results.append({
            **trial,
            "match_score": score,
            "match_tier": _tier_from_score(score),
            "match_reason": f"Keyword overlap on: {', '.join(sorted(condition_terms)[:4])}",
            "why_relevant": "Matched disease terms from your profile in trial title/summary.",
            "concerns": "LLM unavailable; this match used deterministic keyword fallback.",
        })

    fallback_results.sort(key=lambda x: x["match_score"], reverse=True)
    return fallback_results


def filter_trials_with_llm(patient_profile: dict, raw_trials: list) -> list:
    """
    Evaluates global trial results using LLM medical reasoning.
    Returns all medically relevant matches (HIGH/MEDIUM/LOW) so frontend can show
    every matched source without dropping low-confidence but relevant records.
    """
    if not raw_trials:
        return []

    # 1. Sanitize & Prepare Patient Profile
    patient_md = f"""### PATIENT PROFILE
- Primary Condition: {patient_profile.get('primary_condition')}
- Stage/Subtype: {patient_profile.get('condition_stage', 'N/A')}
- Prior Treatments: {patient_profile.get('prior_treatments', 'None')}
- Age: {patient_profile.get('age', 'Unknown')}
- Country: {patient_profile.get('country', 'Global')}"""

    # 2. Process all trials in manageable chunks (keeps prompts reliable while covering all sources)
    chunk_size = 25

    # 3. Define Strict Antigravity System Prompt
    system_prompt = """You are the Antigravity Clinical Matching AI.
Your goal is to perform deep medical reasoning to match patients to global trials.

MATCHING RULES:
1. ACCURACY FIRST: Only match if the trial explicitly treats the patient's condition subtype.
2. DISCARD NOISE: If a patient has "Leukemia" and the trial is for "Blood Pressure", DISCARD it.
3. REASONING: Provide a 'match_reason' (why it matches) and 'concerns' (contraindications or missing data).

OUTPUT SCHEMA (STRICT JSON ARRAY ONLY):
[
  {{
    "index": integer,
    "match_score": float (0.0 to 1.0),
    "match_tier": "HIGH" | "MEDIUM" | "LOW",
    "match_reason": "...",
    "why_relevant": "...",
    "concerns": "..." | null
  }}
]

If no trials match, return []. Do not include any text outside the JSON array."""

    final_output = []
    seen_trials = set()
    condition_terms = _extract_terms(
        f"{patient_profile.get('primary_condition', '')} {patient_profile.get('condition_stage', '')}"
    )
    try:
        llm = get_fallback_llm(model_type="fast", temperature=0)
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "PATIENT:\n{patient_md}\n\nTRIALS TO EVALUATE:\n{trials_block}"),
        ])
        chain = prompt | llm

        for offset in range(0, len(raw_trials), chunk_size):
            processed_trials = raw_trials[offset: offset + chunk_size]
            trials_block = ""
            for i, t in enumerate(processed_trials):
                trials_block += f"""
TRIAL_ID: {i}
Title: {t.get('trial_name')}
Condition: {t.get('condition')}
Phase: {t.get('phase')}
Summary: {t.get('eligibility_summary', '')[:300]}
Source: {t.get('source_database')}
---"""

            llm_matched_indexes = set()
            try:
                response = chain.invoke({
                    "patient_md": patient_md,
                    "trials_block": trials_block
                })

                raw_content = response.content
                if isinstance(raw_content, list):
                    raw_content = "".join(
                        [item.get("text", "") if isinstance(item, dict) else str(item) for item in raw_content]
                    )
                elif not isinstance(raw_content, str):
                    raw_content = str(raw_content)

                raw_json = raw_content.strip()
                if "```json" in raw_json:
                    raw_json = raw_json.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_json:
                    raw_json = raw_json.split("```")[1].split("```")[0].strip()

                matches = json.loads(raw_json)
                if not isinstance(matches, list):
                    matches = []

                for m in matches:
                    if not isinstance(m, dict):
                        continue
                    idx = m.get("index")
                    if idx is None or not (0 <= idx < len(processed_trials)):
                        continue
                    source_trial = processed_trials[idx]
                    trial_key = _trial_key(source_trial)
                    if trial_key in seen_trials:
                        continue

                    score = _coerce_score(m.get("match_score", 0.0))
                    if score <= 0:
                        continue

                    raw_tier = str(m.get("match_tier", "")).upper()
                    tier = raw_tier if raw_tier in {"HIGH", "MEDIUM", "LOW"} else _tier_from_score(score)

                    final_output.append({
                        **source_trial,
                        "match_score": score,
                        "match_tier": tier,
                        "match_reason": str(m.get("match_reason", "")),
                        "why_relevant": str(m.get("why_relevant", "")),
                        "concerns": m.get("concerns")
                    })
                    seen_trials.add(trial_key)
                    llm_matched_indexes.add(idx)
            except Exception as chunk_error:
                print(f"[Antigravity-LLM] Chunk parse failed at offset {offset}: {chunk_error}")

            # Backfill within each chunk so one strict/empty LLM response does not hide other database matches.
            if condition_terms:
                for idx, source_trial in enumerate(processed_trials):
                    if idx in llm_matched_indexes:
                        continue
                    trial_key = _trial_key(source_trial)
                    if trial_key in seen_trials:
                        continue

                    haystack = _trial_haystack(source_trial)
                    hit_count = sum(1 for term in condition_terms if term in haystack)
                    if hit_count == 0:
                        continue

                    score = min(0.7, 0.28 + (0.1 * hit_count))
                    if score < 0.3:
                        continue

                    final_output.append({
                        **source_trial,
                        "match_score": score,
                        "match_tier": _tier_from_score(score),
                        "match_reason": f"Keyword overlap on: {', '.join(sorted(condition_terms)[:4])}",
                        "why_relevant": "Matched disease terms from your profile in trial title/summary.",
                        "concerns": "Added by deterministic fallback because LLM chunk was strict/empty.",
                    })
                    seen_trials.add(trial_key)
    except Exception as e:
        print(f"[Antigravity-LLM] Filter failed: {e}")
        return _fallback_filter(patient_profile, raw_trials)

    if not final_output:
        return _fallback_filter(patient_profile, raw_trials)

    final_output.sort(key=lambda x: x["match_score"], reverse=True)
    return final_output
