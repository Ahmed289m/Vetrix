from fastapi import APIRouter, Depends

from app.controllers.pet_controller import PetController
from app.core.permission_checker import TokenData, require_permission
from app.core.permissions import Permissions
from app.routes.dependencies import get_pet_controller
from app.schemas.pet import PetCreate, PetUpdate

router = APIRouter(prefix="/pets", tags=["pets"])


@router.post("")
async def create_pet(
    request: PetCreate,
    current_user: TokenData = Depends(require_permission(Permissions.PETS_CREATE)),
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    """
    Create a new pet (authorized users only).

    - STAFF/OWNER/DOCTOR can create pets in their clinic
    - CLIENT can create pets (clinic_id resolved from user record, owner_id auto-set)
    """
    created = await controller.create_pet(request, current_user)
    return {"success": True, "message": "Pet created successfully.", "data": created}


@router.get("")
async def list_pets(
    current_user: TokenData = Depends(require_permission(Permissions.PETS_READ)),
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    """
    List pets (authorized users only).

    - ADMIN sees all pets
    - OWNER/STAFF/DOCTOR see pets in their clinic
    - CLIENT sees only their pets (no clinic_id in token — resolved internally)
    """
    pets = await controller.list_pets(current_user)
    return {"success": True, "message": "Pets fetched successfully.", "data": pets}


@router.get("/{pet_id}")
async def get_pet(
    pet_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.PETS_READ)),
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    """
    Get a specific pet.

    - ADMIN can read any pet
    - OWNER/STAFF/DOCTOR can read pets in their clinic
    - CLIENT can read only their pets (ownership check — no clinic_id required)
    """
    pet = await controller.get_pet(pet_id, current_user)
    return {"success": True, "message": "Pet fetched successfully.", "data": pet}


@router.put("/{pet_id}")
async def update_pet(
    pet_id: str,
    request: PetUpdate,
    current_user: TokenData = Depends(require_permission(Permissions.PETS_UPDATE)),
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    """
    Update a pet (authorized users only).

    - ADMIN can update any pet
    - OWNER/STAFF can update pets in their clinic
    - DOCTOR can update only pet weight in their clinic
    - CLIENT can update only their own pets
    """
    updated = await controller.update_pet(pet_id, request, current_user)
    return {"success": True, "message": "Pet updated successfully.", "data": updated}


@router.delete("/{pet_id}")
async def delete_pet(
    pet_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.PETS_DELETE)),
    controller: PetController = Depends(get_pet_controller),
) -> dict:
    """
    Delete a pet (authorized users only).

    - ADMIN can delete any pet
    - OWNER/STAFF can delete pets in their clinic
    - CLIENT can delete only their own pets
    """
    await controller.delete_pet(pet_id, current_user)
    return {"success": True, "message": "Pet deleted successfully.", "data": {"pet_id": pet_id}}
