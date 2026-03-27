from fastapi import APIRouter, Depends

from app.controllers.auth_controller import AuthController
from app.routes.dependencies import get_auth_controller
from app.schemas.auth import LoginRequest

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
