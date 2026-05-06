import asyncio
from services.llm_trial_filter import filter_trials_with_llm

async def test():
    print("Testing LLM Trial Filter...")
    patient = {
        "primary_condition": "Lung Cancer",
        "condition_stage": "Stage 4 NSCLC",
        "age": "65",
        "country": "USA"
    }
    raw_trials = [
        {
            "trial_name": "Targeted Therapy for Stage 4 Non-Small Cell Lung Cancer",
            "condition": "NSCLC",
            "eligibility_summary": "Evaluating new TKIs for metastatic lung cancer patients.",
            "source_database": "ClinicalTrials.gov"
        },
        {
            "trial_name": "Study on High Blood Pressure",
            "condition": "Hypertension",
            "eligibility_summary": "Evaluating new drugs for high blood pressure.",
            "source_database": "ClinicalTrials.gov"
        }
    ]
    results = filter_trials_with_llm(patient, raw_trials)
    print(f"Filtered {len(raw_trials)} -> {len(results)}")
    for r in results:
        print(f"- {r['trial_name']} (Score: {r['match_score']})")
        print(f"  Reason: {r['match_reason']}")

if __name__ == "__main__":
    asyncio.run(test())
