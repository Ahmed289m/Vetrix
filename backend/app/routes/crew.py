import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.permission_checker import TokenData, get_current_user
from app.models.enums.user_role import UserRole

router = APIRouter(prefix="/agent", tags=["agent"])
logger = logging.getLogger(__name__)

MAX_HISTORY_MESSAGES = 6
_RATE_LIMIT_RETRIES = 2
_RATE_LIMIT_WAIT = 12


class CrewCaseHistoryRequest(BaseModel):
    case_history: dict
    language: str | None = None


class CustomerServiceChatMessage(BaseModel):
    role: str
    content: str


class CustomerServiceRequest(BaseModel):
    user_prompt: str
    history: list[CustomerServiceChatMessage] = Field(default_factory=list)


def _build_customer_service_prompt(user_prompt: str, history: list[CustomerServiceChatMessage]) -> str:
    recent = history[-MAX_HISTORY_MESSAGES:] if history else []
    if not recent:
        return user_prompt

    transcript = "\n".join(f"{message.role}: {message.content}" for message in recent if message.content.strip())
    return f"Conversation history:\n{transcript}\n\nCurrent user message:\n{user_prompt}"


@router.get("/case-history/{pet_id}")
async def get_case_history_data(pet_id: str, pet_type: str | None = None) -> dict:
    normalized_pet_id = (pet_id or "").strip()
    normalized_pet_type = (pet_type or "").strip().lower()

    if not normalized_pet_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="pet_id is required.",
        )

    try:
        from app.agents.helpers.getVisitsHelper import getVisitsInfo

        case_history = await getVisitsInfo(normalized_pet_id, normalized_pet_type)

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
            "pet_type": normalized_pet_type,
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

        result = run_case_history_crew(payload.case_history, payload.language)

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


@router.post("/customer-service")
async def run_customer_service(payload: CustomerServiceRequest, current_user: TokenData = Depends(get_current_user)) -> dict:
    if current_user.role != UserRole.CLIENT and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer service assistant is available for clients only.",
        )

    if not (settings.gemini_api_key or "").strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY is missing.",
        )

    try:
        from app.agents.crew import run_customer_service_crew

        prompt = _build_customer_service_prompt(payload.user_prompt, payload.history)
        last_exc = None
        for attempt in range(_RATE_LIMIT_RETRIES + 1):
            try:
                result = await asyncio.to_thread(
                    run_customer_service_crew,
                    prompt,
                    current_user.user_id,
                    current_user.clinic_id,
                    True,  # verbose — temp debug
                )
                break
            except Exception as exc:
                if "rate_limit" in str(exc).lower() or "429" in str(exc):
                    last_exc = exc
                    if attempt < _RATE_LIMIT_RETRIES:
                        logger.warning("Rate limited (attempt %d), retrying in %ds", attempt + 1, _RATE_LIMIT_WAIT)
                        await asyncio.sleep(_RATE_LIMIT_WAIT)
                        continue
                raise
        else:
            raise last_exc  # type: ignore[misc]
    except Exception as exc:
        logger.exception("Customer service crew execution failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Customer service crew failed: {exc.__class__.__name__}",
        )

    raw_text = result.raw if hasattr(result, "raw") else str(result)
    logger.info("[CS-AGENT] Final response: %s", raw_text[:500])

    return {
        "success": True,
        "message": "Customer service response generated successfully.",
        "data": {"response": raw_text},
    }