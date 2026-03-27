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
        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "", 1).strip()
            try:
                payload = decode_token(token)
                request.state.user = {
                    "email": payload.get("sub"),
                    "role": payload.get("role"),
                    "clinic_id": payload.get("clinic_id"),
                }
            except JWTError:
                return JSONResponse(status_code=401, content={"detail": "Invalid token."})

        return await call_next(request)
