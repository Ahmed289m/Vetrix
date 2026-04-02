from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole
from app.models.prescription import Prescription
from app.repositories.prescription_repository import PrescriptionRepository
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate
from app.services.base_crud_service import BaseCrudService
from app.utils.mongo_helpers import serialize_mongo_doc


class PrescriptionService:
    def __init__(self, repository: PrescriptionRepository) -> None:
        self.crud = BaseCrudService(
            repository,
            Prescription,
            id_field="prescription_id",
            id_prefix="prescription",
        )
        self.repository = repository

    async def create_prescription(self, request: PrescriptionCreate, current_user: TokenData) -> dict:
        """
        Create a prescription with authorization.

        - DOCTOR can create prescriptions in their clinic
        - ADMIN can create in any clinic
        """
        requested_clinic_id = getattr(request, "clinic_id", None)
        clinic_id = requested_clinic_id or current_user.clinic_id
        if not clinic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="clinic_id is required",
            )

        # Enforce clinic isolation
        if not current_user.is_superuser and current_user.clinic_id != clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create prescriptions in other clinics",
            )

        payload = request.model_dump(exclude_none=True)
        payload["clinic_id"] = clinic_id
        return await self.crud.create(Prescription(**payload))

    async def list_prescriptions(self, current_user: TokenData) -> list[dict]:
        """
        List prescriptions based on role.
        
        - ADMIN sees all prescriptions
        - DOCTOR/STAFF see prescriptions in their clinic
        - CLIENT sees only their prescriptions
        """
        if current_user.is_superuser:
            return await self.crud.list()
        
        if current_user.role == UserRole.CLIENT:
            # CLIENT sees only their prescriptions
            if not current_user.clinic_id:
                return []
            prescriptions = await self.repository.list_by_client(current_user.user_id, current_user.clinic_id)
        else:
            # DOCTOR/STAFF see prescriptions in their clinic
            if not current_user.clinic_id:
                return []
            prescriptions = await self.repository.list_by_clinic(current_user.clinic_id)
        
        return [serialize_mongo_doc(p, "prescription_id") for p in prescriptions]

    async def get_prescription(self, prescription_id: str, current_user: TokenData) -> dict:
        """
        Get a prescription with clinic isolation and ownership check.
        
        - ADMIN can get any prescription
        - DOCTOR/STAFF can get prescriptions in their clinic
        - CLIENT can get only their prescriptions
        """
        prescription = await self.crud.get(prescription_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if prescription.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
            
            # CLIENT can only get their own prescriptions
            if current_user.role == UserRole.CLIENT and prescription.get("client_id") != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        return prescription

    async def update_prescription(self, prescription_id: str, request: PrescriptionUpdate, current_user: TokenData) -> dict:
        """
        Update a prescription with authorization.
        
        - ADMIN can update any prescription
        - DOCTOR can update prescriptions in their clinic
        """
        prescription = await self.crud.get(prescription_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if prescription.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        return await self.crud.update(prescription_id, request)

    async def delete_prescription(self, prescription_id: str, current_user: TokenData) -> None:
        """
        Delete a prescription with authorization.
        
        - ADMIN can delete any prescription
        - DOCTOR can delete prescriptions in their clinic
        """
        prescription = await self.crud.get(prescription_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if prescription.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        await self.crud.delete(prescription_id)

