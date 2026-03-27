from fastapi import HTTPException, status
from uuid import uuid4

from app.models.clinic import Clinic
from app.repositories.clinic_repository import ClinicRepository
from app.schemas.clinic import ClinicCreate, ClinicUpdate


class ClinicService:
    def __init__(self, clinic_repository: ClinicRepository) -> None:
        self.clinic_repository = clinic_repository

    @staticmethod
    def _serialize_clinic(clinic: dict) -> dict:
        mongo_id = clinic.get("_id")
        if mongo_id and not clinic.get("clinic_id"):
            clinic["clinic_id"] = mongo_id
        clinic.pop("_id", None)
        return clinic

    async def create_clinic(self, request: ClinicCreate) -> dict:
        clinic_id = f"clinic_{uuid4().hex[:12]}"
        exists = await self.clinic_repository.get_by_clinic_id(clinic_id)
        if exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Clinic with this clinic_id already exists.",
            )

        clinic_model = Clinic(clinic_id=clinic_id, **request.model_dump())
        payload = clinic_model.model_dump()
        created = await self.clinic_repository.create_clinic(payload)
        return self._serialize_clinic(created)

    async def list_clinics(self) -> list[dict]:
        clinics = await self.clinic_repository.list_clinics()
        return [self._serialize_clinic(clinic) for clinic in clinics]

    async def get_clinic(self, clinic_id: str) -> dict:
        clinic = await self.clinic_repository.get_by_clinic_id(clinic_id)
        if not clinic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinic not found.",
            )
        return self._serialize_clinic(clinic)

    async def update_clinic(self, clinic_id: str, request: ClinicUpdate) -> dict:
        payload = request.model_dump(exclude_none=True)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update.",
            )
        clinic = await self.clinic_repository.update_clinic(clinic_id, payload)
        if not clinic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinic not found.",
            )
        return self._serialize_clinic(clinic)

    async def delete_clinic(self, clinic_id: str) -> None:
        deleted = await self.clinic_repository.delete_clinic(clinic_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinic not found.",
            )
