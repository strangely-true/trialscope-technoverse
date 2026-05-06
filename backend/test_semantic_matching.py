import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the current directory to sys.path so we can import services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from services.llm_trial_filter import filter_trials_with_llm

async def run_semantic_tests():
    print("=" * 80)
    print("RUNNING LLM SEMANTIC MATCHING PRECISION TESTS")
    print("=" * 80)
    
    test_cases = [
        {
            "name": "User Screenshot Case: Blood Cancer Stage 1",
            "patient": {
                "primary_condition": "Blood Cancer",
                "condition_stage": "Stage 1",
                "age": "35",
                "country": "India",
                "prior_treatments": "Chemotherapy (R-CHOP regimen) Radiation therapy (localized) Immunotherapy (Rituximab)"
            },
            "trials": [
                {
                    "trial_name": "Phase III CAR-T Cell Therapy for Relapsed Blood Cancer",
                    "condition": "Relapsed Blood Cancer",
                    "eligibility_summary": "Patients with relapsed or refractory B-cell malignancies.",
                    "source_database": "ClinicalTrials.gov"
                },
                {
                    "trial_name": "Blood Pressure Medication Study Phase 4",
                    "condition": "Hypertension",
                    "eligibility_summary": "Evaluating blood pressure medication.",
                    "source_database": "WHO"
                }
            ],
            "should_match": True # Should match the first one
        },
        {
            "name": "Blood Pressure Rejection Test",
            "patient": {
                "primary_condition": "Blood Cancer",
                "condition_stage": "Stage 1"
            },
            "trials": [
                {
                    "trial_name": "New Blood Pressure Drug",
                    "condition": "Hypertension",
                    "eligibility_summary": "Focusing on systolic blood pressure reduction.",
                    "source_database": "WHO"
                }
            ],
            "should_match": False
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n[Test {i}] {test['name']}")
        results = filter_trials_with_llm(test['patient'], test['trials'])
        
        is_matched = len(results) > 0
        if is_matched == test['should_match']:
            print(f"  RESULT: PASS")
            passed += 1
        else:
            print(f"  RESULT: FAIL (Expected match: {test['should_match']}, Got: {is_matched})")
        
        if is_matched:
            for r in results:
                print(f"  Match Reason: {r['match_reason']}")
    
    print("\n" + "=" * 80)
    print(f"TEST SUMMARY: {passed}/{total} Passed")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_semantic_tests())
