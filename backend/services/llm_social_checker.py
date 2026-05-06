import json
import re
from typing import Any, Dict

try:
    from langchain.schema import HumanMessage, SystemMessage
except Exception:
    from langchain_core.messages import HumanMessage, SystemMessage


def _coerce_response_content(response: Any) -> str:
    content = getattr(response, "content", response)
    if isinstance(content, list):
        return " ".join(str(item) for item in content)
    return str(content or "")


def _extract_json_object(raw: str) -> Dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        text = re.sub(r"```$", "", text).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object in LLM response")

    return json.loads(text[start : end + 1])


def check_post_confidence(
    post_text: str,
    username: str,
    disease: str,
    stage: str,
    llm: Any,
) -> Dict[str, Any]:
    """
    Sends a single social media post to LLM.
    LLM decides if this person or their family
    member genuinely has this disease.
    Returns confidence score and reasoning.
    """

    system_prompt = f"""You are a medical text analyst.
Your job is to read a social media post and decide
if the person posting or their family member
genuinely has {disease} {stage}.

STRICT RULES:
1. Only return HIGH confidence if the person
explicitly says they are diagnosed or their
family member is diagnosed.
Example HIGH: "I was diagnosed with leukemia
stage 2 last month"
Example HIGH: "My mother has blood cancer stage 2"

2. Return MEDIUM confidence if they strongly
imply it but have not explicitly said diagnosed.
Example MEDIUM: "fighting leukemia for 6 months"

3. Return LOW or ZERO if they are just asking
a question, sharing news, or it is unclear.
Example LOW: "what are symptoms of blood cancer"
Example ZERO: "blood cancer awareness month"

4. NEVER confuse related conditions.
If disease is blood cancer only match
leukemia lymphoma myeloma etc.
Do not match blood pressure or blood vessels.

Return ONLY this JSON nothing else:
{{
  "confidence": 0.0,
  "confidence_tier": "HIGH",
  "relation": "self",
  "reasoning": "one sentence explaining your decision",
  "recruit_worthy": true
}}
"""

    user_message = f"""
Disease we are looking for: {disease} {stage}
Username: {username}
Post text: {post_text}

Is this person or their family member a genuine
{disease} patient?
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message),
    ]

    try:
        if hasattr(llm, "invoke"):
            response = llm.invoke(messages)
        else:
            response = llm(messages)

        parsed = _extract_json_object(_coerce_response_content(response))

        confidence = float(parsed.get("confidence", 0.0))
        confidence = max(0.0, min(confidence, 1.0))
        tier = str(parsed.get("confidence_tier", "LOW")).upper()
        relation = str(parsed.get("relation", "unknown")).lower()
        reasoning = str(parsed.get("reasoning", "No reasoning provided"))
        recruit_worthy = bool(parsed.get("recruit_worthy", confidence >= 0.5))

        return {
            "confidence": confidence,
            "confidence_tier": tier,
            "relation": relation,
            "reasoning": reasoning,
            "recruit_worthy": recruit_worthy,
        }
    except Exception:
        text_lower = (post_text or "").lower()
        disease_lower = (disease or "").lower()
        has_disease = disease_lower and disease_lower in text_lower
        self_signal = any(s in text_lower for s in ["i was diagnosed", "my diagnosis", "i have", "living with"])
        family_signal = any(s in text_lower for s in ["my mother", "my father", "my sister", "my brother", "my wife", "my husband"])

        if has_disease and (self_signal or family_signal):
            return {
                "confidence": 0.7,
                "confidence_tier": "MEDIUM",
                "relation": "family_member" if family_signal else "self",
                "reasoning": "Fallback keyword check indicates probable patient context.",
                "recruit_worthy": True,
            }

        return {
            "confidence": 0.0,
            "confidence_tier": "LOW",
            "relation": "unknown",
            "reasoning": "Could not analyse post",
            "recruit_worthy": False,
        }
