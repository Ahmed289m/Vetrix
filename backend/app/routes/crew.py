import logging

from fastapi import APIRouter, HTTPException, status

from app.core.config import settings

router = APIRouter(prefix="/agent", tags=["agent"])
logger = logging.getLogger(__name__)


@router.get("/crew/{pet_id}")
def run_crew(pet_id: str) -> dict:
    normalized_pet_id = (pet_id or "").strip()
    if not normalized_pet_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="pet_id is required.",
        )

    if not (settings.groq_api_key or "").strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Case history service is unavailable because GROQ_API_KEY is missing at runtime.",
        )

    try:
        # Lazy import so missing optional AI deps do not break app startup.
        from app.agents.crew import run_case_history_crew
    except ModuleNotFoundError as exc:
        missing = exc.name or "required AI dependency"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"Case history service is unavailable because '{missing}' is not installed. "
                "Install backend AI dependencies and restart the service."
            ),
        ) from exc
    except Exception as exc:
        logger.exception("Crew import/configuration failed for pet_id=%s", normalized_pet_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Case history service is unavailable due to AI configuration error: "
                f"{exc.__class__.__name__}."
            ),
        ) from exc

    try:
        result = run_case_history_crew(normalized_pet_id)
        if hasattr(result, "model_dump"):
            payload = result.model_dump()
        elif isinstance(result, (dict, list, str, int, float, bool)) or result is None:
            payload = result
        else:
            payload = str(result)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Crew execution failed for pet_id=%s", normalized_pet_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Case history generation failed. Please verify AI provider settings and try again. "
                f"Error type: {exc.__class__.__name__}."
            ),
        ) from exc

    return {
        "success": True,
        "message": "Case history generated successfully.",
        "data": payload,
    }