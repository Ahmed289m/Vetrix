from app.models.pet import Pet
from app.repositories.pet_repository import PetRepository
from app.schemas.pet import PetCreate, PetUpdate
from app.services.base_crud_service import BaseCrudService


class PetService:
    def __init__(self, repository: PetRepository) -> None:
        self.crud = BaseCrudService(repository, Pet, id_field="pet_id", id_prefix="pet")

    async def create_pet(self, request: PetCreate) -> dict:
        return await self.crud.create(request)

    async def list_pets(self) -> list[dict]:
        return await self.crud.list()

    async def get_pet(self, pet_id: str) -> dict:
        return await self.crud.get(pet_id)

    async def update_pet(self, pet_id: str, request: PetUpdate) -> dict:
        return await self.crud.update(pet_id, request)

    async def delete_pet(self, pet_id: str) -> None:
        await self.crud.delete(pet_id)

