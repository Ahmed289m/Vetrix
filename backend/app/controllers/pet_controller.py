from app.schemas.pet import PetCreate, PetUpdate
from app.services.pet_service import PetService


class PetController:
    def __init__(self, service: PetService) -> None:
        self.service = service

    async def create_pet(self, request: PetCreate) -> dict:
        return await self.service.create_pet(request)

    async def list_pets(self) -> list[dict]:
        return await self.service.list_pets()

    async def get_pet(self, pet_id: str) -> dict:
        return await self.service.get_pet(pet_id)

    async def update_pet(self, pet_id: str, request: PetUpdate) -> dict:
        return await self.service.update_pet(pet_id, request)

    async def delete_pet(self, pet_id: str) -> None:
        await self.service.delete_pet(pet_id)

