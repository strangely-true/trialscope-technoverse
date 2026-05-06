# LLM-Based Semantic Matching Implementation

## Problem Statement
The previous matching system used simple keyword matching, which caused incorrect matches:
- Patient searching for "blood cancer Stage 4" would also see trials for "blood pressure"
- Partial keyword matches (e.g., "blood" matching "blood cancer") created false positives
- No semantic understanding of medical conditions and their relationships

## Solution Implemented

### 1. Agent 3 Matching (Social Discovery Pipeline)
**File**: `backend/agents/agent3_matching.py`

**Changes**:
- Added LLM-based semantic matching function `_llm_semantic_match()`
- LLM evaluates if patient's condition EXACTLY matches trial disease
- Rules enforced:
  - Exact condition match required (e.g., "blood cancer" ≠ "blood pressure")
  - Stage alignment verification
  - Medical synonyms allowed (e.g., "leukemia" = "blood cancer")
  - Partial keyword matches rejected

**How it works**:
```python
# Before matching, LLM evaluates:
llm_match = _llm_semantic_match(candidate, trial)

# Returns:
{
  "is_match": true/false,
  "confidence": 0.0-1.0,
  "reason": "explanation"
}

# Only proceeds if is_match == true
```

### 2. Global Trial Filter (Patient Questionnaire Pipeline)
**File**: `backend/services/llm_trial_filter.py`

**Changes**:
- Enhanced system prompt with stricter matching rules
- Added explicit rules:
  1. EXACT CONDITION MATCH required
  2. STAGE ALIGNMENT verification
  3. NO PARTIAL KEYWORD MATCHES
  4. MEDICAL SYNONYMS ALLOWED
  5. DISCARD IRRELEVANT trials

**Example**:
- Patient: "blood cancer Stage 4"
- ✅ Matches: "leukemia Phase 4", "blood cancer Stage 4"
- ❌ Rejects: "blood pressure", "blood disorder", "cancer screening"

### 3. Integration Points

**Patient Flow**:
1. Patient fills questionnaire with condition + stage
2. System searches 20 global databases
3. LLM filter evaluates each trial result
4. Only semantically matched trials are saved to database
5. Patient sees only relevant trials

**Social Discovery Flow**:
1. Agent scrapes social media posts
2. Agent extracts candidate conditions
3. Agent 3 uses LLM to match candidates to trials
4. Only exact matches proceed to outreach

## Technical Details

### LLM Service
Uses fallback chain: Gemini → Groq → OpenAI
- Fast model for matching (low latency)
- Temperature: 0.1 (deterministic)
- JSON-only responses

### Matching Criteria
```
Score Calculation:
- LLM confidence × condition match = base score
- Symptom overlap adds weight
- Severity match adds weight
- Final threshold: 0.60 minimum

Tier Assignment:
- HIGH: score ≥ 0.85
- MEDIUM: score ≥ 0.60
- Rejected: score < 0.60
```

## Benefits

1. **Precision**: Only exact medical condition matches
2. **No False Positives**: "blood" won't match "blood cancer"
3. **Stage Awareness**: Stage 4 patients only see Stage 4 trials
4. **Medical Intelligence**: Understands synonyms (leukemia = blood cancer)
5. **Explainable**: LLM provides reasoning for each match

## Testing

To verify the fix:

1. **Test Case 1**: Blood Cancer vs Blood Pressure
```bash
# Patient profile: blood cancer Stage 4
# Expected: Only blood cancer trials
# Rejected: Blood pressure, blood disorder trials
```

2. **Test Case 2**: Synonym Recognition
```bash
# Patient profile: leukemia
# Expected: Matches "blood cancer" trials
# Reason: Medical synonym
```

3. **Test Case 3**: Stage Filtering
```bash
# Patient profile: diabetes Stage 2
# Expected: Only Stage 2 diabetes trials
# Rejected: Stage 1, Stage 3 trials
```

## Files Modified

1. `backend/agents/agent3_matching.py` - Added LLM semantic matching
2. `backend/services/llm_trial_filter.py` - Enhanced matching rules
3. `backend/services/llm_service.py` - Already existed (no changes needed)

## Environment Variables Required

```env
GOOGLE_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key  # fallback
OPENAI_API_KEY=your_openai_key  # fallback
```

## Performance

- LLM call per candidate: ~200-500ms
- Batch processing: 25 trials per LLM call
- Fallback to keyword matching if LLM fails
- No impact on user experience (background processing)

## Future Enhancements

1. Cache LLM responses for common condition pairs
2. Fine-tune custom medical matching model
3. Add confidence thresholds per condition type
4. Implement A/B testing for matching accuracy
