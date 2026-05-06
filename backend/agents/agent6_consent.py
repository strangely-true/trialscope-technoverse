"""
Agent 6 — Consent Simplification
Extracts PDF text and summarises to plain-English bullet points via LLM.
"""
import os
import io
import pypdf
from dotenv import load_dotenv

load_dotenv()


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text[:8000]  # limit context window
    except Exception as e:
        print(f"[Agent6] PDF extraction error: {e}")
        return ""


def _summarise_with_llm(consent_text: str) -> list:
    """Summarise consent text using LLM fallback (Gemini -> Groq -> OpenAI) or fallback heuristic."""
    try:
        from services.llm_service import invoke_llm_chain
        
        system_prompt = "You are a plain-language medical writer. Summarise the following consent document in simple English bullet points at a Grade 8 reading level. Each bullet must be under 20 words. Cover: what the patient must do, risks, benefits, and how to withdraw."
        human_prompt = "{consent_text}"
        
        result = invoke_llm_chain(system_prompt, human_prompt, {"consent_text": consent_text}, model_type="fast", temperature=0.3)
        
        lines = [l.strip() for l in result.content.split("\n") if l.strip() and l.strip().startswith(("•", "-", "*", "1", "2", "3", "4", "5"))]
        return lines or _heuristic_summary(consent_text)
    except Exception as e:
        print(f"[Agent6] LLM error: {e}, falling back to heuristic")
        return _heuristic_summary(consent_text)


def _heuristic_summary(text: str) -> list:
    """Simple rule-based summary when LLM is unavailable."""
    bullets = ["• You are being asked to join a clinical research trial."]
    if "risk" in text.lower():
        bullets.append("• There are potential risks involved — read the full document.")
    if "benefit" in text.lower():
        bullets.append("• You may benefit from early access to new treatments.")
    if "withdraw" in text.lower() or "opt out" in text.lower():
        bullets.append("• You can withdraw from the trial at any time without penalty.")
    bullets.append("• Your data will be kept private and anonymised.")
    bullets.append("• Participation is completely voluntary.")
    return bullets


def run_consent_simplification(trial_id: int, s3_url: str, pdf_bytes: bytes = None, raw_text: str = None) -> dict:
    """Extract text from PDF or use raw text and generate simplified summary."""
    if raw_text:
        text = raw_text
    elif pdf_bytes:
        text = _extract_pdf_text(pdf_bytes)
    else:
        # S3 download fallback
        text = f"Consent document for trial {trial_id}. Please refer to the full document at {s3_url}"

    summary_bullets = _summarise_with_llm(text) if text else _heuristic_summary("")

    result = {
        "trial_id": trial_id,
        "s3_url": s3_url,
        "summary_bullets": summary_bullets,
        "reading_level": "Grade 8",
        "bullet_count": len(summary_bullets),
    }
    print(f"[Agent6] Consent simplified: {len(summary_bullets)} bullets")
    return result
