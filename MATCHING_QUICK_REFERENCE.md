# Quick Reference: LLM Semantic Matching

## What Changed?

### Before (Keyword Matching)
```python
# Simple substring check
disease_lower = trial.disease.lower()
condition_match = any(disease_lower in str(c).lower() for c in conditions)

# Problem: "blood" matches "blood cancer" ❌
```

### After (LLM Semantic Matching)
```python
# LLM evaluates semantic meaning
llm_match = _llm_semantic_match(candidate, trial)

# Returns:
{
  "is_match": true/false,
  "confidence": 0.0-1.0,
  "reason": "explanation"
}

# Only proceeds if is_match == true ✅
```

## Key Files Modified

1. **backend/agents/agent3_matching.py**
   - Added `_llm_semantic_match()` function
   - Integrated LLM check before scoring
   - Rejects non-matches early

2. **backend/services/llm_trial_filter.py**
   - Enhanced system prompt with strict rules
   - Added explicit condition matching requirements
   - Prevents partial keyword matches

## How It Works

### Flow Diagram
```
Patient Input: "blood cancer Stage 4"
        ↓
Search 20 Databases
        ↓
Raw Results: [blood cancer, blood pressure, blood disorder, ...]
        ↓
LLM Filter (for each trial):
  - Is "blood cancer" == "blood pressure"? NO → Reject
  - Is "blood cancer" == "leukemia"? YES (synonym) → Accept
  - Is Stage 4 == Stage 4? YES → Accept
        ↓
Filtered Results: [blood cancer trials, leukemia trials]
        ↓
Display to Patient
```

## LLM Prompt Structure

```
You are a clinical trial matching expert.

Trial Disease: {trial.disease}
Trial Stage: {trial.stage}
Patient Conditions: {conditions}
Patient Symptoms: {symptoms}

Rules:
1. EXACT condition match required
2. Stage must align
3. No partial keyword matches
4. Medical synonyms allowed

Output JSON:
{
  "is_match": true/false,
  "confidence": 0.0-1.0,
  "reason": "explanation"
}
```

## Matching Rules

| Rule | Example | Result |
|------|---------|--------|
| Exact Match | blood cancer → blood cancer | ✅ Match |
| Medical Synonym | heart attack → myocardial infarction | ✅ Match |
| Partial Keyword | blood → blood cancer | ❌ Reject |
| Different Condition | blood cancer → blood pressure | ❌ Reject |
| Stage Mismatch | Stage 2 → Stage 3 | ❌ Reject |
| Stage Match | Stage 4 → Stage 4 | ✅ Match |

## Configuration

### Environment Variables
```env
GOOGLE_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
```

### LLM Settings
```python
llm = get_fallback_llm(
    model_type="fast",  # Uses Gemini Flash Lite
    temperature=0.1     # Low temperature for consistency
)
```

## Testing

### Manual Test
```bash
# 1. Start backend
cd backend
uvicorn main:app --reload

# 2. Create patient with "blood cancer Stage 4"
# 3. Check matched trials
# 4. Verify NO "blood pressure" trials appear
```

### Automated Test
```bash
cd backend
python test_semantic_matching.py
```

## Performance

- **Latency**: ~200-500ms per LLM call
- **Batch Size**: 25 trials per call
- **Fallback**: Keyword matching if LLM fails
- **Cost**: ~$0.0001 per match (Gemini Flash Lite)

## Troubleshooting

### Issue: LLM not rejecting false matches
**Solution**: Check system prompt in `llm_trial_filter.py`

### Issue: All trials rejected
**Solution**: Verify patient condition format matches trial database

### Issue: Slow matching
**Solution**: Increase batch size or use faster LLM model

### Issue: LLM API errors
**Solution**: Check API keys and fallback chain

## Future Improvements

1. **Caching**: Cache LLM responses for common condition pairs
2. **Fine-tuning**: Train custom model on medical matching data
3. **Confidence Tuning**: Adjust thresholds per condition type
4. **A/B Testing**: Compare LLM vs keyword matching accuracy

## Support

For questions or issues:
1. Check `MATCHING_IMPROVEMENTS.md` for detailed documentation
2. Review test cases in `test_semantic_matching.py`
3. Examine LLM prompts in source files
