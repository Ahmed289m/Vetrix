from fastapi import APIRouter, Depends

from app.controllers.auth_controller import AuthController
from app.core.permission_checker import TokenData, get_current_user
from app.routes.dependencies import get_auth_controller
from app.schemas.auth import LoginRequest, RefreshRequest
from app.utils.ws import broadcast

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(
    request: LoginRequest,
    controller: AuthController = Depends(get_auth_controller),
) -> dict:
    tokens = await controller.login(request)
    return {
        "success": True,
        "message": "Login successful.",
        "data": tokens.model_dump(),
    }


@router.post("/refresh")
async def refresh_token(
    request: RefreshRequest,
    controller: AuthController = Depends(get_auth_controller),
) -> dict:
    tokens = await controller.refresh(request.refresh_token)
    return {
        "success": True,
        "message": "Token refreshed successfully.",
        "data": tokens.model_dump(),
    }


@router.post("/logout")
async def logout(
    current_user: TokenData = Depends(get_current_user),
) -> dict:
    """
    Logout endpoint - clears user session.
    
    - Requires valid JWT authentication
    - Broadcasts logout event to WebSocket for real-time notification
    - Client should clear tokens and redirect to login
    """
    # Broadcast logout event to notify other clients
    await broadcast("auth:logout", {
        "user_id": current_user.user_id,
        "email": current_user.email,
    })
    
    return {
        "success": True,
        "message": "Logged out successfully.",
        "data": None,
    }
