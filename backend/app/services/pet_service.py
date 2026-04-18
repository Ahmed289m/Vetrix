from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole
from app.models.pet import Pet
from app.repositories.pet_repository import PetRepository
from app.repositories.user_repository import UserRepository
from app.schemas.pet import PetCreate, PetUpdate
from app.services.base_crud_service import BaseCrudService
from app.utils.mongo_helpers import serialize_mongo_doc


class PetService:
    def __init__(self, repository: PetRepository, user_repository: UserRepository) -> None:
        self.crud = BaseCrudService(repository, Pet, id_field="pet_id", id_prefix="pet")
        self.repository = repository
        self.user_repository = user_repository

    async def create_pet(self, request: PetCreate, current_user: TokenData) -> dict:
        """
        Create a pet with authorization.

        - ADMIN can create pets in any clinic
        - OWNER/STAFF/DOCTOR can create pets in their clinic
        - CLIENT can create pets (owner_id and clinic_id resolved from their user record)
        """
        requested_clinic_id = getattr(request, "clinic_id", None)

        if current_user.role == UserRole.CLIENT:
            # CLIENT: resolve clinic_id from their own user record since it's not in the token
            client_user = await self.user_repository.get_by_user_id(current_user.user_id)
            if not client_user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User record not found.")
            clinic_id = client_user.get("clinic_id")
            if not clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Your account is not associated with a clinic.",
                )
        else:
            clinic_id = requested_clinic_id or current_user.clinic_id
            if not clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="clinic_id is required",
                )

            # Enforce clinic isolation for non-admins
            if not current_user.is_superuser and current_user.clinic_id != clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot create pets in other clinics",
                )

        payload = request.model_dump(exclude_none=True)
        payload["clinic_id"] = clinic_id

        # Always populate owner_id from client_id so CLIENT list_pets works
        # regardless of whether STAFF or CLIENT created the pet.
        client_id = payload.get("client_id") or (
            current_user.user_id if current_user.role == UserRole.CLIENT else None
        )
        if client_id:
            payload["owner_id"] = client_id

        # For CLIENT creating their own pet, ensure client_id is set
        if current_user.role == UserRole.CLIENT:
            payload["client_id"] = current_user.user_id
            payload["owner_id"] = current_user.user_id

        return await self.crud.create(Pet(**payload))

    async def list_pets(self, current_user: TokenData) -> list[dict]:
        """
        List pets based on role.

        - ADMIN sees all pets
        - OWNER/STAFF/DOCTOR see pets in their clinic
        - CLIENT sees only their pets (matched by owner_id)
        """
        if current_user.is_superuser:
            return await self.crud.list()

        if current_user.role == UserRole.CLIENT:
            # CLIENT: look up their clinic_id from their user record
            client_user = await self.user_repository.get_by_user_id(current_user.user_id)
            clinic_id = client_user.get("clinic_id") if client_user else None
            # Pass None if no clinic_id so the query doesn't filter on empty string
            pets = await self.repository.list_by_owner(current_user.user_id, clinic_id or None)
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

        # Clinic isolation check (only for roles with a clinic_id)
        if not current_user.is_superuser:
            if current_user.role == UserRole.CLIENT:
                # CLIENT: ownership check — accept either owner_id or client_id
                # (backward compat for pets without owner_id set)
                pet_owner = pet.get("owner_id") or pet.get("client_id")
                if pet_owner != current_user.user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied",
                    )
            else:
                if pet.get("clinic_id") != current_user.clinic_id:
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
        - DOCTOR can update only pet weight in their clinic
        - CLIENT can update only their own pets
        """
        pet = await self.crud.get(pet_id)
        payload = request.model_dump(exclude_none=True)

        if not current_user.is_superuser:
            if current_user.role == UserRole.CLIENT:
                # CLIENT: ownership check — accept either owner_id or client_id
                pet_owner = pet.get("owner_id") or pet.get("client_id")
                if pet_owner != current_user.user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Can only update your own pets",
                    )
            else:
                if pet.get("clinic_id") != current_user.clinic_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied",
                    )

                if current_user.role == UserRole.DOCTOR:
                    disallowed_fields = [field for field in payload if field != "weight"]
                    if disallowed_fields:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Doctors can only update pet weight.",
                        )

        return await self.crud.update(pet_id, PetUpdate(**payload))

    async def delete_pet(self, pet_id: str, current_user: TokenData) -> None:
        """
        Delete a pet with authorization.

        - ADMIN can delete any pet
        - OWNER/STAFF can delete pets in their clinic
        - CLIENT can delete only their own pets
        """
        pet = await self.crud.get(pet_id)

        if not current_user.is_superuser:
            if current_user.role == UserRole.CLIENT:
                # CLIENT: ownership check — accept either owner_id or client_id
                pet_owner = pet.get("owner_id") or pet.get("client_id")
                if pet_owner != current_user.user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Can only delete your own pets",
                    )
            else:
                if pet.get("clinic_id") != current_user.clinic_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied",
                    )

        await self.crud.delete(pet_id)
