from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.drug import Drug
from app.repositories.drug_repository import DrugRepository
from app.schemas.drug import DrugCreate, DrugUpdate
from app.services.base_crud_service import BaseCrudService
from app.utils.mongo_helpers import serialize_mongo_doc


class DrugService:
    def __init__(self, repository: DrugRepository) -> None:
        self.crud = BaseCrudService(repository, Drug, id_field="drug_id", id_prefix="drug")
        self.repository = repository

    async def list_by_drug_ids(self, drug_ids: list[str]) -> list[dict]:
        """List drugs by drug_id values."""
        drugs = await self.repository.list_by_drug_ids(drug_ids)
        return [serialize_mongo_doc(drug, "drug_id") for drug in drugs]

    async def create_drug(self, request: DrugCreate, current_user: TokenData) -> dict:
        """
        Create a drug. Doctor/owner auto-assigns their clinic_id. Admin can set or omit clinic_id.
        """
        payload = request.model_dump(exclude_none=True)
        # Only admin can set clinic_id arbitrarily
        if not current_user.is_superuser:
            payload["clinic_id"] = current_user.clinic_id
        return await self.crud.create(Drug(**payload))

    async def list_drugs(self, current_user: TokenData) -> list[dict]:
        """
        List drugs:
        - Admin: all drugs
        - Doctor/owner/staff/client: their clinic's drugs + global drugs (clinic_id is None)
        """
        all_drugs = await self.crud.list()
        if current_user.is_superuser:
            return all_drugs
        # Filter: show global drugs and drugs for user's clinic
        return [d for d in all_drugs if not d.get("clinic_id") or d.get("clinic_id") == current_user.clinic_id]

    async def get_drug(self, drug_id: str, current_user: TokenData) -> dict:
        """
        Get a drug:
        - Admin: any drug
        - Non-admin roles: only their clinic's drugs or global drugs
        """
        drug = await self.crud.get(drug_id)
        if current_user.is_superuser:
            return drug
        if not drug.get("clinic_id") or drug.get("clinic_id") == current_user.clinic_id:
            return drug
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    async def update_drug(self, drug_id: str, request: DrugUpdate, current_user: TokenData) -> dict:
        """
        Update a drug:
        - Admin: any drug
        - Doctor/owner: only their clinic's drugs
        """
        drug = await self.crud.get(drug_id)
        if current_user.is_superuser:
            return await self.crud.update(drug_id, request)
        if drug.get("clinic_id") == current_user.clinic_id:
            # Prevent non-admin users from changing clinic_id
            update_data = request.model_dump(exclude_none=True)
            update_data.pop("clinic_id", None)
            return await self.crud.update(drug_id, DrugUpdate(**update_data))
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    async def delete_drug(self, drug_id: str, current_user: TokenData) -> None:
        """
        Delete a drug:
        - Admin: any drug
        - Doctor/owner: only their clinic's drugs
        """
        drug = await self.crud.get(drug_id)
        if current_user.is_superuser or drug.get("clinic_id") == current_user.clinic_id:
            await self.crud.delete(drug_id)
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

