
import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.permission_checker import TokenData, require_permission
from app.core.permissions import Permissions
from app.schemas.chat import ChatRequest

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("/message")
async def send_chat_message(
    payload: ChatRequest,
    current_user: TokenData = Depends(require_permission(Permissions.CHAT_USE)),
) -> dict:
    """Send a message to Vetrix AI. Requires chat.use permission (doctor only)."""
    messages = [{"role": m.role, "content": m.content} for m in payload.history]
    messages.append({"role": "user", "content": payload.message})

    try:
        from app.services.gemini_service import chat

        response_text = await asyncio.to_thread(chat, messages=messages, context=payload.context)
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
