from collections.abc import Callable

from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.security import decode_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request.state.user = None
        request.state.token = None
        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "", 1).strip()
            request.state.token = token
            try:
                payload = decode_token(token)
                request.state.user = {
                    "user_id": payload.get("sub"),
                    "email": payload.get("email"),
                    "role": payload.get("role"),
                    "clinic_id": payload.get("clinic_id"),
                    "is_superuser": payload.get("is_superuser", False),
                }
            except JWTError:
                return JSONResponse(status_code=401, content={"detail": "Invalid token."})

        return await call_next(request)
