from app.core.permission_checker import TokenData
from app.schemas.pet import PetCreate, PetUpdate
from app.services.pet_service import PetService


class PetController:
    def __init__(self, service: PetService) -> None:
        self.service = service

    async def create_pet(self, request: PetCreate, current_user: TokenData) -> dict:
        return await self.service.create_pet(request, current_user)

    async def list_pets(self, current_user: TokenData) -> list[dict]:
        return await self.service.list_pets(current_user)

    async def get_pet(self, pet_id: str, current_user: TokenData) -> dict:
        return await self.service.get_pet(pet_id, current_user)

    async def update_pet(self, pet_id: str, request: PetUpdate, current_user: TokenData) -> dict:
        return await self.service.update_pet(pet_id, request, current_user)

    async def delete_pet(self, pet_id: str, current_user: TokenData) -> None:
        await self.service.delete_pet(pet_id, current_user)

