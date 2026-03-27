from app.models.drug import Drug
from app.repositories.drug_repository import DrugRepository
from app.schemas.drug import DrugCreate, DrugUpdate
from app.services.base_crud_service import BaseCrudService


class DrugService:
    def __init__(self, repository: DrugRepository) -> None:
        self.crud = BaseCrudService(repository, Drug, id_field="drug_id", id_prefix="drug")

    async def create_drug(self, request: DrugCreate) -> dict:
        return await self.crud.create(request)

    async def list_drugs(self) -> list[dict]:
        return await self.crud.list()

    async def get_drug(self, drug_id: str) -> dict:
        return await self.crud.get(drug_id)

    async def update_drug(self, drug_id: str, request: DrugUpdate) -> dict:
        return await self.crud.update(drug_id, request)

    async def delete_drug(self, drug_id: str) -> None:
        await self.crud.delete(drug_id)

