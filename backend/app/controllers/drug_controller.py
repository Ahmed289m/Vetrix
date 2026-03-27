from app.schemas.drug import DrugCreate, DrugUpdate
from app.services.drug_service import DrugService


class DrugController:
    def __init__(self, service: DrugService) -> None:
        self.service = service

    async def create_drug(self, request: DrugCreate) -> dict:
        return await self.service.create_drug(request)

    async def list_drugs(self) -> list[dict]:
        return await self.service.list_drugs()

    async def get_drug(self, drug_id: str) -> dict:
        return await self.service.get_drug(drug_id)

    async def update_drug(self, drug_id: str, request: DrugUpdate) -> dict:
        return await self.service.update_drug(drug_id, request)

    async def delete_drug(self, drug_id: str) -> None:
        await self.service.delete_drug(drug_id)

