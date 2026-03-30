from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth_service import AuthService


class AuthController:
    def __init__(self, auth_service: AuthService) -> None:
        self.auth_service = auth_service

    async def login(self, request: LoginRequest) -> LoginResponse:
        return await self.auth_service.login(request)

    async def refresh(self, refresh_token: str) -> LoginResponse:
        return await self.auth_service.refresh(refresh_token)
