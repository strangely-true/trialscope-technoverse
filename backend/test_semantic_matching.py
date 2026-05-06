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
            "name": "Blood Cancer vs Blood Pressure (Should Reject)",
            "patient": {
                "primary_condition": "Blood Cancer",
                "condition_stage": "Stage 4",
                "age": "45"
            },
            "trials": [
                {
                    "trial_name": "Blood Pressure Phase 4 Study",
                    "condition": "Hypertension",
                    "eligibility_summary": "Looking for patients with high blood pressure.",
                    "source_database": "WHO"
                }
            ],
            "should_match": False
        },
        {
            "name": "Blood Cancer vs Leukemia (Should Match Synonyms)",
            "patient": {
                "primary_condition": "Blood Cancer",
                "condition_stage": "Stage 4",
                "age": "45"
            },
            "trials": [
                {
                    "trial_name": "New Treatment for Leukemia",
                    "condition": "Leukemia",
                    "eligibility_summary": "Stage 4 patients needed.",
                    "source_database": "ClinicalTrials.gov"
                }
            ],
            "should_match": True
        },
        {
            "name": "Generic Cancer vs Specific Blood Cancer (Should Reject)",
            "patient": {
                "primary_condition": "Cancer",
                "condition_stage": "Stage 4",
                "age": "45"
            },
            "trials": [
                {
                    "trial_name": "Advanced Blood Cancer Research",
                    "condition": "Multiple Myeloma",
                    "eligibility_summary": "Specific blood cancer trial.",
                    "source_database": "EU_CTR"
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
