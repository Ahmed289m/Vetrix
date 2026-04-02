from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole
from app.models.pet import Pet
from app.repositories.pet_repository import PetRepository
from app.schemas.pet import PetCreate, PetUpdate
from app.services.base_crud_service import BaseCrudService
from app.utils.mongo_helpers import serialize_mongo_doc


class PetService:
    def __init__(self, repository: PetRepository) -> None:
        self.crud = BaseCrudService(repository, Pet, id_field="pet_id", id_prefix="pet")
        self.repository = repository

    async def create_pet(self, request: PetCreate, current_user: TokenData) -> dict:
        """
        Create a pet with authorization.

        - ADMIN can create pets in any clinic
        - OWNER/STAFF/DOCTOR can create pets in their clinic
        - CLIENT can create pets (automatically set as owner)
        """
        requested_clinic_id = getattr(request, "clinic_id", None)
        clinic_id = requested_clinic_id or current_user.clinic_id
        if not clinic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="clinic_id is required",
            )

        # Enforce clinic isolation
        if not current_user.is_superuser and current_user.clinic_id != clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create pets in other clinics",
            )

        payload = request.model_dump(exclude_none=True)
        payload["clinic_id"] = clinic_id

        # For CLIENT, set owner_id to themselves
        if current_user.role == UserRole.CLIENT:
            payload["owner_id"] = current_user.user_id

        return await self.crud.create(Pet(**payload))

    async def list_pets(self, current_user: TokenData) -> list[dict]:
        """
        List pets based on role.
        
        - ADMIN sees all pets
        - OWNER/STAFF/DOCTOR see pets in their clinic
        - CLIENT sees only their pets
        """
        if current_user.is_superuser:
            return await self.crud.list()
        
        if current_user.role == UserRole.CLIENT:
            # CLIENT sees only their pets
            if not current_user.clinic_id:
                return []
            pets = await self.repository.list_by_owner(current_user.user_id, current_user.clinic_id)
        else:
            # OWNER/STAFF/DOCTOR see pets in their clinic
            if not current_user.clinic_id:
                return []
            pets = await self.repository.list_by_clinic(current_user.clinic_id)
        
        return [serialize_mongo_doc(pet, "pet_id") for pet in pets]

    async def get_pet(self, pet_id: str, current_user: TokenData) -> dict:
        """
        Get a pet with clinic isolation and ownership check.
        
        - ADMIN can get any pet
        - OWNER/STAFF/DOCTOR can get pets in their clinic
        - CLIENT can get only their pets
        """
        pet = await self.crud.get(pet_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if pet.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
            
            # CLIENT can only get their own pets
            if current_user.role == UserRole.CLIENT and pet.get("owner_id") != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        return pet

    async def update_pet(self, pet_id: str, request: PetUpdate, current_user: TokenData) -> dict:
        """
        Update a pet with authorization.
        
        - ADMIN can update any pet
        - OWNER/STAFF can update pets in their clinic
        - CLIENT can update only their pets
        """
        pet = await self.crud.get(pet_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if pet.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
            
            # CLIENT can only update their own pets
            if current_user.role == UserRole.CLIENT and pet.get("owner_id") != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Can only update your own pets",
                )
        
        return await self.crud.update(pet_id, request)

    async def delete_pet(self, pet_id: str, current_user: TokenData) -> None:
        """
        Delete a pet with authorization.
        
        - ADMIN can delete any pet
        - OWNER/STAFF can delete pets in their clinic
        - CLIENT can delete only their pets
        """
        pet = await self.crud.get(pet_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if pet.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                   status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
            
            # CLIENT can only delete their own pets
            if current_user.role == UserRole.CLIENT and pet.get("owner_id") != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Can only delete your own pets",
                )
        
        await self.crud.delete(pet_id)

