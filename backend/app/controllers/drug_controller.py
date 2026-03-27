from app.core.permission_checker import TokenData
from app.schemas.drug import DrugCreate, DrugUpdate
from app.services.drug_service import DrugService


class DrugController:
    def __init__(self, service: DrugService) -> None:
        self.service = service

    async def create_drug(self, request: DrugCreate, current_user: TokenData) -> dict:
        return await self.service.create_drug(request, current_user)

    async def list_drugs(self, current_user: TokenData) -> list[dict]:
        return await self.service.list_drugs(current_user)

    async def get_drug(self, drug_id: str, current_user: TokenData) -> dict:
        return await self.service.get_drug(drug_id, current_user)

    async def update_drug(self, drug_id: str, request: DrugUpdate, current_user: TokenData) -> dict:
        return await self.service.update_drug(drug_id, request, current_user)

    async def delete_drug(self, drug_id: str, current_user: TokenData) -> None:
        await self.service.delete_drug(drug_id, current_user)

