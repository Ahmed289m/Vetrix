from fastapi import APIRouter, Depends

from app.controllers.clinic_controller import ClinicController
from app.routes.dependencies import get_clinic_controller
from app.schemas.clinic import ClinicCreate, ClinicUpdate

router = APIRouter(prefix="/clinics", tags=["clinics"])


@router.post("")
async def create_clinic(
    request: ClinicCreate,
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    created = await controller.create_clinic(request)
    return {
        "success": True,
        "message": "Clinic created successfully.",
        "data": created,
    }


@router.get("")
async def list_clinics(
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    clinics = await controller.list_clinics()
    return {
        "success": True,
        "message": "Clinics fetched successfully.",
        "data": clinics,
    }


@router.get("/{clinic_id}")
async def get_clinic(
    clinic_id: str,
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    clinic = await controller.get_clinic(clinic_id)
    return {
        "success": True,
        "message": "Clinic fetched successfully.",
        "data": clinic,
    }


@router.put("/{clinic_id}")
async def update_clinic(
    clinic_id: str,
    request: ClinicUpdate,
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    clinic = await controller.update_clinic(clinic_id, request)
    return {
        "success": True,
        "message": "Clinic updated successfully.",
        "data": clinic,
    }


@router.delete("/{clinic_id}")
async def delete_clinic(
    clinic_id: str,
    controller: ClinicController = Depends(get_clinic_controller),
) -> dict:
    await controller.delete_clinic(clinic_id)
    return {
        "success": True,
        "message": "Clinic deleted successfully.",
        "data": {"clinic_id": clinic_id},
    }
