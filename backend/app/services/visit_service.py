from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole
from app.models.visit import Visit
from app.repositories.visit_repository import VisitRepository
from app.schemas.visit import VisitCreate, VisitUpdate
from app.services.base_crud_service import BaseCrudService
from app.utils.mongo_helpers import serialize_mongo_doc


class VisitService:
    def __init__(self, repository: VisitRepository) -> None:
        self.crud = BaseCrudService(repository, Visit, id_field="visit_id", id_prefix="visit")
        self.repository = repository

    async def create_visit(self, request: VisitCreate, current_user: TokenData) -> dict:
        """
        Create a visit with authorization.

        - DOCTOR/STAFF can create visits in their clinic
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
                detail="Cannot create visits in other clinics",
            )

        payload = request.model_dump(exclude_none=True)
        payload["clinic_id"] = clinic_id
        return await self.crud.create(Visit(**payload))

    async def list_visits(self, current_user: TokenData) -> list[dict]:
        """
        List visits based on role.
        
        - ADMIN sees all visits
        - DOCTOR/STAFF see visits in their clinic
        - CLIENT sees only visits of their pets
        """
        if current_user.is_superuser:
            return await self.crud.list()
        
        if current_user.role == UserRole.CLIENT:
            # CLIENT sees only visits of their pets
            if not current_user.clinic_id:
                return []
            visits = await self.repository.list_by_owner(current_user.user_id, current_user.clinic_id)
        else:
            # DOCTOR/STAFF see visits in their clinic
            if not current_user.clinic_id:
                return []
            visits = await self.repository.list_by_clinic(current_user.clinic_id)
        
        return [serialize_mongo_doc(visit, "visit_id") for visit in visits]

    async def get_visit(self, visit_id: str, current_user: TokenData) -> dict:
        """
        Get a visit with clinic isolation and ownership check.
        
        - ADMIN can get any visit
        - DOCTOR/STAFF can get visits in their clinic
        - CLIENT can get only visits of their pets
        """
        visit = await self.crud.get(visit_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if visit.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
            
            # CLIENT can only get visits of their pets
            if current_user.role == UserRole.CLIENT and visit.get("client_id") != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        return visit

    async def update_visit(self, visit_id: str, request: VisitUpdate, current_user: TokenData) -> dict:
        """
        Update a visit with authorization.
        
        - ADMIN can update any visit
        - DOCTOR/STAFF can update visits in their clinic
        """
        visit = await self.crud.get(visit_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if visit.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        return await self.crud.update(visit_id, request)

    async def delete_visit(self, visit_id: str, current_user: TokenData) -> None:
        """
        Delete a visit with authorization.
        
        - ADMIN can delete any visit
        - DOCTOR/STAFF can delete visits in their clinic
        """
        visit = await self.crud.get(visit_id)
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if visit.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        await self.crud.delete(visit_id)

