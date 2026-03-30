from fastapi import HTTPException, status
from jose import JWTError

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, LoginResponse


class AuthService:
    def __init__(
        self,
        user_repository: UserRepository,
    ) -> None:
        self.user_repository = user_repository

    async def login(self, request: LoginRequest) -> LoginResponse:
        user = await self.user_repository.get_by_email(str(request.email))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not verify_password(request.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        return self._issue_tokens(user)

    async def refresh(self, refresh_token: str) -> LoginResponse:
        """Validate a refresh token and issue a new access + refresh pair."""
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is not a refresh token.",
            )

        subject = payload.get("sub")
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload.",
            )

        user = await self.user_repository.get_by_email(subject)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer exists.",
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        return self._issue_tokens(user)

    # ── private ────────────────────────────────────────────────────────
    @staticmethod
    def _issue_tokens(user: dict) -> LoginResponse:
        """Create an access + refresh token pair for *user*."""
        subject = user.get("email")
        access_token = create_access_token(
            subject=subject,
            extra_claims={
                "role": user.get("role"),
                "clinic_id": user.get("clinic_id"),
                "is_superuser": user.get("is_superuser", False),
                "email": user.get("email"),
            },
        )
        refresh_token = create_refresh_token(subject=subject)
        return LoginResponse(access_token=access_token, refresh_token=refresh_token)
