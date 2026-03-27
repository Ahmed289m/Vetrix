from fastapi import APIRouter, Depends

from app.controllers.pet_controller import PetController
from app.routes.dependencies import get_pet_controller
from app.schemas.pet import PetCreate, PetUpdate

router = APIRouter(prefix="/pets", tags=["pets"])


@router.post("")
async def create_pet(
    request: PetCreate,
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    created = await controller.create_pet(request)
    return {"success": True, "message": "Pet created successfully.", "data": created}


@router.get("")
async def list_pets(
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    pets = await controller.list_pets()
    return {"success": True, "message": "Pets fetched successfully.", "data": pets}


@router.get("/{pet_id}")
async def get_pet(
    pet_id: str,
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    pet = await controller.get_pet(pet_id)
    return {"success": True, "message": "Pet fetched successfully.", "data": pet}


@router.put("/{pet_id}")
async def update_pet(
    pet_id: str,
    request: PetUpdate,
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    updated = await controller.update_pet(pet_id, request)
    return {"success": True, "message": "Pet updated successfully.", "data": updated}


@router.delete("/{pet_id}")
async def delete_pet(
    pet_id: str,
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    await controller.delete_pet(pet_id)
    return {"success": True, "message": "Pet deleted successfully.", "data": {"pet_id": pet_id}}

