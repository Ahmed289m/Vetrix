"""Gemini AI service — stateless chat proxy for veterinary differential diagnoses."""

import logging

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None

SYSTEM_PROMPT = """You are Vetrix AI, an expert veterinary clinical assistant.
You help doctors with: differential diagnoses.

Guidelines:
- When given symptoms, provide a ranked list of differential diagnoses with reasoning.
- Include likelihood indicators (most likely → least likely).
- Mention key differentiating tests or findings for each differential.
- Use proper veterinary medical terminology.
- Format responses in clean Markdown with tables, bold, and lists where appropriate.
- Be concise but thorough — prioritize clinical utility.
- If the question is outside veterinary medicine, politely redirect.
- Always clarify species (canine, feline, equine, etc.) when relevant.
- Never provide a definitive diagnosis — always frame as differentials.
- The user is a licensed veterinarian. Use advanced clinical language."""

_CONTEXT_SUFFIXES: dict[str, str] = {
    "simulation_mode": (
        "\nThe doctor is currently in Simulation Mode examining an active patient case. "
        "Provide focused, case-relevant differential diagnosis assistance."
    ),
}

_MODEL = "gemini-2.5-flash"


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not (settings.gemini_api_key or "").strip():
            raise RuntimeError("GEMINI_API_KEY is not configured.")
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def chat(messages: list[dict], context: str | None = None) -> str:
    """
    Send conversation history to Gemini and return the assistant response.

    Args:
        messages: [{"role": "user"|"assistant", "content": str}, ...]
        context:  Optional hint key (e.g. "simulation_mode").

    Returns:
        Response text in Markdown.
    """
    client = _get_client()

    system = SYSTEM_PROMPT + _CONTEXT_SUFFIXES.get(context or "", "")

    contents = [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part.from_text(text=m["content"])],
        )
        for m in messages
    ]

    try:
        response = client.models.generate_content(
            model=_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.4,
                max_output_tokens=2048,
            ),
        )
        return response.text or "I couldn't generate a response. Please try again."
    except Exception as exc:
        logger.exception("Gemini API call failed")
        raise RuntimeError(f"Gemini API error: {exc.__class__.__name__}") from exc
