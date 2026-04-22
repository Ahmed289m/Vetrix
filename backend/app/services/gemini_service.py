"""Gemini AI service — stateless chat proxy for veterinary differential diagnoses."""

import logging

from google import genai
from google.genai import types
from google.genai.errors import ServerError

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
}

# Primary → fallback order (free-tier compatible)
_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]


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

    # Filter out any empty-content messages
    contents = [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part.from_text(text=m["content"])],
        )
        for m in messages
        if m.get("content", "").strip()
    ]

    if not contents:
        return "Please provide a message to get started."

    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=0.4,
        max_output_tokens=2048,
    )

    # Try each model in order — fallback on 503/overload
    last_exc: Exception | None = None
    for model in _MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
            return response.text or "I couldn't generate a response. Please try again."
        except ServerError as exc:
            logger.warning("Model %s unavailable (503), trying fallback: %s", model, exc)
            last_exc = exc
            continue
        except Exception as exc:
            logger.exception("Gemini API call failed on model %s", model)
            raise RuntimeError(f"AI service error: {exc.__class__.__name__}") from exc

    # All models exhausted
    logger.error("All models unavailable")
    raise RuntimeError("AI service is temporarily overloaded. Please try again shortly.") from last_exc
