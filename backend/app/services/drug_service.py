from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.drug import Drug
from app.repositories.drug_repository import DrugRepository
from app.schemas.drug import DrugCreate, DrugUpdate
from app.services.base_crud_service import BaseCrudService


class DrugService:
    def __init__(self, repository: DrugRepository) -> None:
        self.crud = BaseCrudService(repository, Drug, id_field="drug_id", id_prefix="drug")
        self.repository = repository

    async def create_drug(self, request: DrugCreate, current_user: TokenData) -> dict:
        """
        Create a drug (ADMIN/DOCTOR only - enforced at route level).

        Drugs are clinic-scoped and are always created in the caller's clinic,
        unless an explicit clinic_id is provided by an admin payload.
        """
        requested_clinic_id = getattr(request, "clinic_id", None)
        clinic_id = requested_clinic_id or current_user.clinic_id
        if not clinic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="clinic_id is required",
            )

        if not current_user.is_superuser and current_user.clinic_id != clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create drugs in other clinics",
            )

        payload = request.model_dump(exclude_none=True)
        payload["clinic_id"] = clinic_id
        return await self.crud.create(Drug(**payload))

    async def list_drugs(self, current_user: TokenData) -> list[dict]:
        """
        List drugs (ADMIN/DOCTOR/STAFF only - enforced at route level).

        - ADMIN sees all drugs
        - Non-admin users see only drugs in their clinic
        """
        if current_user.is_superuser:
            return await self.crud.list()

        if not current_user.clinic_id:
            return []

        drugs = await self.repository.list(clinic_id=current_user.clinic_id)
        return [self.crud._serialize(drug) for drug in drugs]

    async def get_drug(self, drug_id: str, current_user: TokenData) -> dict:
        """
        Get a drug (ADMIN/DOCTOR/STAFF only - enforced at route level).
        """
        drug = await self.crud.get(drug_id)
        if not current_user.is_superuser and drug.get("clinic_id") != current_user.clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
        return drug

    async def update_drug(self, drug_id: str, request: DrugUpdate, current_user: TokenData) -> dict:
        """
        Update a drug (ADMIN/DOCTOR only - enforced at route level).
        """
        drug = await self.crud.get(drug_id)
        if not current_user.is_superuser and drug.get("clinic_id") != current_user.clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
        return await self.crud.update(drug_id, request)

    async def delete_drug(self, drug_id: str, current_user: TokenData) -> None:
        """
        Delete a drug (ADMIN/DOCTOR only - enforced at route level).
        """
        drug = await self.crud.get(drug_id)
        if not current_user.is_superuser and drug.get("clinic_id") != current_user.clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
        await self.crud.delete(drug_id)

