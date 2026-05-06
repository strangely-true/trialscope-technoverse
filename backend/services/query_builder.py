"""
Query Builder — Converts patient questionnaire answers into search queries
for global clinical trial databases.
"""


def build_search_query(questionnaire: dict) -> str:
    """
    Takes patient questionnaire answers and builds
    a clean structured search query string that will
    be used to search all 20 external databases.
    """
    condition = questionnaire.get("primary_condition", "")
    stage = questionnaire.get("condition_stage", "")
    country = questionnaire.get("country", "")
    age = questionnaire.get("age", "")
    gender = questionnaire.get("gender", "")
    prior = questionnaire.get("prior_treatments", "none")

    query = f"{condition}"
    if stage:
        query += f" {stage}"
    if age:
        query += f" age {age}"
    if gender:
        query += f" {gender}"
    if country:
        query += f" {country}"
    if prior and prior.lower() != "none":
        query += f" prior treatment {prior}"

    return query.strip()


def build_api_params(questionnaire: dict) -> dict:
    """
    Builds structured params for APIs that accept
    structured queries like ClinicalTrials.gov.
    """
    return {
        "condition": questionnaire.get("primary_condition"),
        "country": questionnaire.get("country"),
        "age": questionnaire.get("age"),
        "status": "RECRUITING",
        "phase": "PHASE2,PHASE3",
    }
