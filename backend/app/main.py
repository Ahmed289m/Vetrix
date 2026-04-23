import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from starlette.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo, get_database
from app.middlewares.auth_middleware import AuthMiddleware
from app.repositories.user_repository import UserRepository
from app.routes.auth import router as auth_router
from app.routes.appointment import router as appointment_router
from app.routes.crew import router as crew_router
from app.routes.drug import router as drug_router
from app.routes.clinic import router as clinic_router
from app.routes.pet import router as pet_router
from app.routes.prescription import router as prescription_router
from app.routes.prescription_item import router as prescription_item_router
from app.routes.visit import router as visit_router
from app.routes.user import router as user_router
from app.routes.chat import router as chat_router
from app.services.admin_bootstrap_service import AdminBootstrapService
from app.websocket import router as ws_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    try:
        db = get_database()
        user_repo = UserRepository(db)
        bootstrap_service = AdminBootstrapService(user_repo)
        await bootstrap_service.bootstrap_admin()
        yield
    finally:
        await close_mongo_connection()


app = FastAPI(title=settings.app_name, debug=settings.app_debug, lifespan=lifespan)


@app.middleware("http")
async def add_status_to_json_response(request: Request, call_next):
    response = await call_next(request)

    content_type = response.headers.get("content-type", "")
    if "application/json" not in content_type:
        return response

    # Preserve existing JSON responses and only inject status when missing.
    body = b""
    async for chunk in response.body_iterator:
        body += chunk

    if not body:
        return response

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        passthrough_headers = {
            k: v for k, v in response.headers.items() if k.lower() not in {"content-length", "content-type"}
        }
        return Response(
            content=body,
            status_code=response.status_code,
            media_type=content_type,
            headers=passthrough_headers,
        )

    if isinstance(payload, dict) and "message" in payload and "status" not in payload:
        payload["status"] = response.status_code

    passthrough_headers = {
        k: v for k, v in response.headers.items() if k.lower() not in {"content-length", "content-type"}
    }
    return JSONResponse(content=payload, status_code=response.status_code, headers=passthrough_headers)

# CORS — allow the Next.js frontend
# Add this before auth middleware so it wraps all responses,
# including auth short-circuit and error responses.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://vetrix-snowy.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthMiddleware)

# REST routes
app.include_router(auth_router)
app.include_router(crew_router)
app.include_router(clinic_router)
app.include_router(user_router)
app.include_router(drug_router)
app.include_router(pet_router)
app.include_router(prescription_item_router)
app.include_router(prescription_router)
app.include_router(visit_router)
app.include_router(appointment_router)
app.include_router(chat_router)

# WebSocket routes
app.include_router(ws_router)


# ── Exception handlers ────────────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": exc.status_code,
            "success": False,
            "message": exc.detail,
            "data": None,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "success": False,
            "message": "Request validation failed.",
            "errors": exc.errors(),
            "data": None,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "success": False,
            "message": "An unexpected server error occurred.",
            "data": None,
        },
    )


@app.get("/health")
async def health() -> dict:
    return {
        "status": status.HTTP_200_OK,
        "success": True,
        "message": "Health check successful.",
        "data": {"status": "ok", "environment": settings.app_env},
    }
        content={
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "success": False,
            "message": "An unexpected server error occurred.",
            "data": None,
        },
    )


@app.get("/health")
async def health() -> dict:
    return {
        "status": status.HTTP_200_OK,
        "success": True,
        "message": "Health check successful.",
        "data": {"status": "ok", "environment": settings.app_env},
    }
