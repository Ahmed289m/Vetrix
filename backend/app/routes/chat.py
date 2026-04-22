"""Chat route — Gemini AI proxy, doctors only."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.permission_checker import TokenData, get_current_user
from app.models.enums.user_role import UserRole

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


class _Message(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=10_000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5_000)
    history: list[_Message] = Field(default_factory=list, max_length=50)
    context: str | None = Field(default=None, max_length=50)


@router.post("/message")
async def send_chat_message(
    payload: ChatRequest,
    current_user: TokenData = Depends(get_current_user),
) -> dict:
    """Send a message to Vetrix AI. Doctor role only."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI chat assistant is available to doctors only.",
        )

    if not (settings.gemini_api_key or "").strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY is not configured.",
        )

    messages = [{"role": m.role, "content": m.content} for m in payload.history]
    messages.append({"role": "user", "content": payload.message})

    try:
        from app.services.gemini_service import chat

        response_text = chat(messages=messages, context=payload.context)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception:
        logger.exception("Unexpected error in chat endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat failed unexpectedly.",
        )

    return {
        "success": True,
        "message": "Chat response generated.",
        "data": {"response": response_text},
    }
