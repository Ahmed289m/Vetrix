import logging
import asyncio
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/agent", tags=["agent"])
logger = logging.getLogger(__name__)


class CrewCaseHistoryRequest(BaseModel):
    case_history: dict


@router.get("/case-history/{pet_id}")
def get_case_history_data(pet_id: str) -> dict:
    normalized_pet_id = (pet_id or "").strip()

    if not normalized_pet_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="pet_id is required.",
        )

    try:
        from app.agents.helpers.getVisitsHelper import get_case_history

        case_history = asyncio.run(get_case_history(normalized_pet_id))

    except Exception as exc:
        logger.exception("Case history fetch failed for pet_id=%s", normalized_pet_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Case history fetch failed: {exc.__class__.__name__}",
        )

    return {
        "success": True,
        "message": "Case history loaded successfully.",
        "data": {
            "pet_id": normalized_pet_id,
            "case_history": case_history,
        },
    }


@router.post("/crew")
def run_crew_with_case_history(payload: CrewCaseHistoryRequest) -> dict:
    if not (settings.groq_api_key or "").strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY is missing.",
        )

    try:
        from app.agents.crew import run_case_history_crew

        result = run_case_history_crew(payload.case_history)

    except Exception as exc:
        logger.exception("Crew execution failed for provided case history")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Crew execution failed: {exc.__class__.__name__}",
        )

    if hasattr(result, "model_dump"):
        result = result.model_dump()

    return {
        "success": True,
        "message": "Case history generated successfully.",
        "data": result,
    }