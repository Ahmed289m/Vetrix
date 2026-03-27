from app.core.permission_checker import TokenData
from app.models.drug import Drug
from app.repositories.drug_repository import DrugRepository
from app.schemas.drug import DrugCreate, DrugUpdate
from app.services.base_crud_service import BaseCrudService


class DrugService:
    def __init__(self, repository: DrugRepository) -> None:
        self.crud = BaseCrudService(repository, Drug, id_field="drug_id", id_prefix="drug")

    async def create_drug(self, request: DrugCreate, current_user: TokenData) -> dict:
        """
        Create a drug (ADMIN/DOCTOR only - enforced at route level).
        
        Drugs are global resources, no clinic isolation needed.
        """
        return await self.crud.create(request)

    async def list_drugs(self, current_user: TokenData) -> list[dict]:
        """
        List drugs (ADMIN/DOCTOR/STAFF only - enforced at route level).
        
        All authorized users see all drugs.
        """
        return await self.crud.list()

    async def get_drug(self, drug_id: str, current_user: TokenData) -> dict:
        """
        Get a drug (ADMIN/DOCTOR/STAFF only - enforced at route level).
        """
        return await self.crud.get(drug_id)

    async def update_drug(self, drug_id: str, request: DrugUpdate, current_user: TokenData) -> dict:
        """
        Update a drug (ADMIN/DOCTOR only - enforced at route level).
        """
        return await self.crud.update(drug_id, request)

    async def delete_drug(self, drug_id: str, current_user: TokenData) -> None:
        """
        Delete a drug (ADMIN/DOCTOR only - enforced at route level).
        """
        await self.crud.delete(drug_id)

