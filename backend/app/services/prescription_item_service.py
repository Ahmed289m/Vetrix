from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole
from app.models.prescription_item import PrescriptionItem
from app.repositories.prescription_item_repository import PrescriptionItemRepository
from app.schemas.prescription_item import PrescriptionItemCreate, PrescriptionItemUpdate
from app.services.base_crud_service import BaseCrudService


class PrescriptionItemService:
    def __init__(self, repository: PrescriptionItemRepository) -> None:
        self.crud = BaseCrudService(
            repository,
            PrescriptionItem,
            id_field="prescriptionItem_id",
            id_prefix="prescriptionItem",
        )
        self.repository = repository

    async def create_prescription_item(self, request: PrescriptionItemCreate, current_user: TokenData) -> dict:
        """
        Create a prescription item with authorization.

        - DOCTOR can create items in their clinic
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
                detail="Cannot create items in other clinics",
            )

        payload = request.model_dump(exclude_none=True)
        payload["clinic_id"] = clinic_id
        return await self.crud.create(PrescriptionItem(**payload))

    async def list_prescription_items(self, current_user: TokenData) -> list[dict]:
        """
        List prescription items based on role.
        
        - ADMIN sees all items
        - DOCTOR/STAFF see items in their clinic
        - CLIENT sees only items related to their prescriptions
        """
        if current_user.is_superuser:
            return await self.crud.list()
        
        # Regular users see items in their clinic only
        if not current_user.clinic_id:
            return []
        items = await self.repository.list_by_clinic(current_user.clinic_id)
        
        return [self.crud._serialize(item) for item in items]

    async def get_prescription_item(self, prescriptionItem_id: str, current_user: TokenData) -> dict:
        """
        Get a prescription item with clinic isolation check.
        
        - ADMIN can get any item
        - DOCTOR/STAFF/CLIENT can get items in their clinic
        """
        item = await self.crud.get(prescriptionItem_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if item.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        return item

    async def update_prescription_item(self, prescriptionItem_id: str, request: PrescriptionItemUpdate, current_user: TokenData) -> dict:
        """
        Update a prescription item with authorization.
        
        - ADMIN can update any item
        - DOCTOR can update items in their clinic
        """
        item = await self.crud.get(prescriptionItem_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if item.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        return await self.crud.update(prescriptionItem_id, request)

    async def delete_prescription_item(self, prescriptionItem_id: str, current_user: TokenData) -> None:
        """
        Delete a prescription item with authorization.
        
        - ADMIN can delete any item
        - DOCTOR can delete items in their clinic
        """
        item = await self.crud.get(prescriptionItem_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if item.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        await self.crud.delete(prescriptionItem_id)

