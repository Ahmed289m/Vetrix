"""Gemini AI service — stateless chat proxy for veterinary differential diagnoses."""

import logging
import time

from google import genai
from google.genai import types
from google.genai.errors import ServerError, ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None

SYSTEM_PROMPT = """You are Vetrix AI, an expert veterinary clinical assistant built for licensed veterinarians.

Your core capabilities:
- Differential diagnoses with ranked likelihood and clinical reasoning.
- Treatment protocol suggestions and drug dosage guidance.
- Diagnostic workup recommendations (lab work, imaging, etc.).
- Species-specific clinical considerations (canine, feline, equine, bovine, avian, exotic).

Response guidelines:
- Be helpful, thorough, and confident in your clinical knowledge.
- Provide ranked differentials with reasoning and key differentiating findings.
- Use proper veterinary medical terminology — the user is a licensed veterinarian.
- Format responses in clean Markdown: use tables, bold, lists, and headers for readability.
- Keep tables compact: cap differential tables at 5–7 rows and keep each cell to one short sentence. Move extended reasoning to bullet points below the table rather than into wide cells.
- When relevant, mention diagnostic tests, expected lab values, and treatment options.
- Clarify species when relevant to the clinical context.
- Frame recommendations as clinical guidance — the veterinarian makes the final decision.
- Do NOT apologize for providing clinical information — that is your purpose.
- Do NOT refuse to answer veterinary clinical questions.
- Keep responses comprehensive but well-structured — use sections and bullet points.
- Finish what you start: never end mid-row, mid-sentence, or mid-table. If you are running long, wrap up cleanly with a short summary instead of starting a new section."""

_CONTEXT_SUFFIXES: dict[str, str] = {
}

# Primary → fallback order (free-tier compatible)
_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

# Retry settings for transient failures
_MAX_RETRIES = 2
_RETRY_BACKOFF_BASE = 1.5  # seconds

# Auto-continuation when a response hits MAX_TOKENS mid-output
_MAX_CONTINUATIONS = 2


def _extract_text(response) -> str:
    """Pull text out of a response even when finish_reason != STOP (response.text can return None or raise)."""
    try:
        if response.text:
            return response.text
    except Exception:
        pass
    parts_text: list[str] = []
    for cand in getattr(response, "candidates", None) or []:
        content = getattr(cand, "content", None)
        for part in getattr(content, "parts", None) or []:
            t = getattr(part, "text", None)
            if t:
                parts_text.append(t)
    return "".join(parts_text)


def _finish_reason(response) -> str | None:
    cands = getattr(response, "candidates", None) or []
    if not cands:
        return None
    fr = getattr(cands[0], "finish_reason", None)
    return getattr(fr, "name", None) or (str(fr) if fr is not None else None)


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
        temperature=0.6,
        max_output_tokens=16384,
        thinking_config=types.ThinkingConfig(thinking_budget=0),
    )

    # Try each model in order — fallback on 503/overload
    last_exc: Exception | None = None
    for model in _MODELS:
        for attempt in range(_MAX_RETRIES + 1):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
                text = _extract_text(response) or ""
                finish = _finish_reason(response)

                # Auto-continue if we hit the output cap — chain up to _MAX_CONTINUATIONS
                # follow-up calls so long tables/lists don't get truncated mid-row.
                cont_attempts = 0
                while finish == "MAX_TOKENS" and cont_attempts < _MAX_CONTINUATIONS and text:
                    cont_attempts += 1
                    logger.info("MAX_TOKENS on %s — auto-continuing (%d/%d)", model, cont_attempts, _MAX_CONTINUATIONS)
                    cont_contents = contents + [
                        types.Content(role="model", parts=[types.Part.from_text(text=text)]),
                        types.Content(role="user", parts=[types.Part.from_text(
                            text="Continue exactly where you stopped. Do not repeat anything you already wrote. If you were mid-table, resume the next row in the same table format."
                        )]),
                    ]
                    cont_response = client.models.generate_content(
                        model=model,
                        contents=cont_contents,
                        config=config,
                    )
                    extra = _extract_text(cont_response) or ""
                    if not extra:
                        break
                    # Glue without inserting blank space if continuation begins mid-line
                    text = text + ("" if text.endswith(("\n", " ")) or extra.startswith(("\n", " ")) else "") + extra
                    finish = _finish_reason(cont_response)

                if finish == "MAX_TOKENS":
                    logger.warning("Response still truncated after %d continuations on %s", cont_attempts, model)
                    text = text + "\n\n_[Response truncated — ask the assistant to continue for more detail.]_"
                return text or "I couldn't generate a response. Please try again."
            except ServerError as exc:
                logger.warning(
                    "Model %s unavailable (attempt %d/%d): %s",
                    model, attempt + 1, _MAX_RETRIES + 1, exc,
                )
                last_exc = exc
                if attempt < _MAX_RETRIES:
                    time.sleep(_RETRY_BACKOFF_BASE * (attempt + 1))
                    continue
                break  # Try next model
            except ClientError as exc:
                logger.warning("Client error on model %s: %s", model, exc)
                last_exc = exc
                break  # Try next model — client errors are not retryable
            except Exception as exc:
                logger.exception("Gemini API call failed on model %s", model)
                raise RuntimeError(f"AI service error: {exc.__class__.__name__}") from exc

    # All models exhausted
    logger.error("All models unavailable after retries")
    raise RuntimeError("AI service is temporarily overloaded. Please try again shortly.") from last_exc
