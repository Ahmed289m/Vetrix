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
            detail="GROQ_API_KEY is missing.",
        )

    try:
        from app.agents.crew import run_case_history_crew

        result = run_case_history_crew(normalized_pet_id)

    except Exception as exc:
        logger.exception("Crew execution failed for pet_id=%s", normalized_pet_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Crew execution failed: {exc.__class__.__name__}",
        )

 
    if hasattr(result, "model_dump"):
        result = result.model_dump()

    visits = []

    if isinstance(result, dict):
        visits = result.get("visits", [])

    return {
        "success": True,
        "message": "Case history generated successfully.",
        "data": {
            "pet_id": normalized_pet_id,
            "visits": visits
        }
    }