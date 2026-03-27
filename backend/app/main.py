from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo, get_database
from app.middlewares.auth_middleware import AuthMiddleware
from app.repositories.user_repository import UserRepository
from app.routes.auth import router as auth_router
from app.routes.appointment import router as appointment_router
from app.routes.drug import router as drug_router
from app.routes.clinic import router as clinic_router
from app.routes.pet import router as pet_router
from app.routes.prescription import router as prescription_router
from app.routes.prescription_item import router as prescription_item_router
from app.routes.visit import router as visit_router
from app.routes.user import router as user_router
from app.services.admin_bootstrap_service import AdminBootstrapService


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup
    await connect_to_mongo()
    try:
        # Bootstrap admin user
        db = get_database()
        user_repo = UserRepository(db)
        bootstrap_service = AdminBootstrapService(user_repo)
        await bootstrap_service.bootstrap_admin()
        
        yield
    finally:
        # Shutdown
        await close_mongo_connection()


app = FastAPI(title=settings.app_name, debug=settings.app_debug, lifespan=lifespan)
app.add_middleware(AuthMiddleware)

app.include_router(auth_router)
app.include_router(clinic_router)
app.include_router(user_router)
app.include_router(drug_router)
app.include_router(pet_router)
app.include_router(prescription_item_router)
app.include_router(prescription_router)
app.include_router(visit_router)
app.include_router(appointment_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
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
            "success": False,
            "message": exc.errors(),
            "data": None,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": str(exc),
            "data": None,
        },
    )


@app.get("/health")
async def health() -> dict:
    return {
        "success": True,
        "message": "Health check successful.",
        "data": {"status": "ok", "environment": settings.app_env},
    }
