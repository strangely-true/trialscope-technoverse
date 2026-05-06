"""
Agent 11 — Multilingual Translation
Translates content into 8 Indian languages + English using LLM or HuggingFace NLLB.
"""
import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

SUPPORTED_LANGUAGES = {
    "English": "eng_Latn",
    "Hindi": "hin_Deva",
    "Tamil": "tam_Taml",
    "Telugu": "tel_Telu",
    "Bengali": "ben_Beng",
    "Marathi": "mar_Deva",
    "Kannada": "kan_Knda",
    "Malayalam": "mal_Mlym",
    "Gujarati": "guj_Gujr",
}


@lru_cache(maxsize=1)
def translate_content(text: str, target_language: str) -> str:
    """Translate text to the target language."""
    if not text or target_language == "English":
        return text

    target_code = SUPPORTED_LANGUAGES.get(target_language)
    if not target_code:
        return text  # unsupported language, return as-is

    # Try LLM Fallback (Gemini -> Groq -> OpenAI)
    try:
        from services.llm_service import invoke_llm_chain
        
        system_prompt = f"You are a professional medical translator. Translate the following text to {target_language} accurately and naturally. Preserve formatting."
        human_prompt = "{text}"
        
        result = invoke_llm_chain(system_prompt, human_prompt, {"text": text}, model_type="fast", temperature=0.1)
        
        # Handle complex LangChain content lists (common in some LLM providers)
        content = result.content
        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    text_parts.append(part.get("text", ""))
                elif isinstance(part, str):
                    text_parts.append(part)
            return "".join(text_parts)
        return str(content)
    except Exception:
        pass

    # Try deep-translator (Google Translate scraping)
    try:
        from deep_translator import GoogleTranslator
        translated = GoogleTranslator(source='auto', target=target_language.lower()).translate(text)
        return translated
    except Exception as e:
        print(f"[Agent11] DeepTranslator error: {e}")

    return text  # fallback: return original


def translate_consent_summary(bullets: list, target_language: str) -> list:
    """Translate a list of consent summary bullets."""
    if target_language == "English":
        return bullets
    return [translate_content(bullet, target_language) for bullet in bullets]


def translate_form_labels(labels: dict, target_language: str) -> dict:
    """Translate form field labels for the patient UI."""
    if target_language == "English":
        return labels
    return {k: translate_content(v, target_language) for k, v in labels.items()}
