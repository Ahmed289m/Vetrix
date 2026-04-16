from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole
from app.models.visit import Visit
from app.repositories.user_repository import UserRepository
from app.repositories.visit_repository import VisitRepository
from app.schemas.visit import VisitCreate, VisitUpdate
from app.services.base_crud_service import BaseCrudService
from app.utils.mongo_helpers import serialize_mongo_doc


class VisitService:
    def __init__(self, repository: VisitRepository, user_repository: UserRepository) -> None:
        self.crud = BaseCrudService(repository, Visit, id_field="visit_id", id_prefix="visit")
        self.repository = repository
        self.user_repository = user_repository

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
        - CLIENT sees only visits of their pets (clinic_id resolved from DB)
        """
        if current_user.is_superuser:
            visits = await self.crud.list()
            sorted_visits = sorted(
                visits,
                key=lambda v: v.get("date") or "",
                reverse=True,
            )
            return await self._attach_user_names(sorted_visits)

        if current_user.role == UserRole.CLIENT:
            # CLIENT has no clinic_id in JWT — look it up from user record
            client_user = await self.user_repository.get_by_user_id(current_user.user_id)
            clinic_id = client_user.get("clinic_id") if client_user else None
            if not clinic_id:
                return []
            visits = await self.repository.list_by_owner(current_user.user_id, clinic_id)
        else:
            # DOCTOR/STAFF see visits in their clinic
            if not current_user.clinic_id:
                return []
            visits = await self.repository.list_by_clinic(current_user.clinic_id)

        serialized = [serialize_mongo_doc(visit, "visit_id") for visit in visits]
        return await self._attach_user_names(serialized)

    async def get_visit(self, visit_id: str, current_user: TokenData) -> dict:
        """
        Get a visit with clinic isolation and ownership check.

        - ADMIN can get any visit
        - DOCTOR/STAFF can get visits in their clinic
        - CLIENT can get only visits of their pets
        """
        visit = await self.crud.get(visit_id)

        if not current_user.is_superuser:
            if current_user.role == UserRole.CLIENT:
                # CLIENT: ownership check only (no clinic_id in token)
                if visit.get("client_id") != current_user.user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied",
                    )
            else:
                if visit.get("clinic_id") != current_user.clinic_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied",
                    )

        enriched_list = await self._attach_user_names([visit])
        return enriched_list[0]

    async def _attach_user_names(self, visits: list[dict]) -> list[dict]:
        if not visits:
            return visits

        user_ids: set[str] = set()
        for visit in visits:
            doctor_id = visit.get("doctor_id")
            client_id = visit.get("client_id")
            if doctor_id:
                user_ids.add(doctor_id)
            if client_id:
                user_ids.add(client_id)

        users_by_id: dict[str, str] = {}
        for user_id in user_ids:
            user_doc = await self.user_repository.get_by_user_id(user_id)
            if user_doc:
                users_by_id[user_id] = user_doc.get("fullname") or ""

        for visit in visits:
            doctor_id = visit.get("doctor_id")
            client_id = visit.get("client_id")
            if doctor_id:
                visit["doctor_name"] = users_by_id.get(doctor_id) or "Assigned"
            if client_id:
                visit["client_name"] = users_by_id.get(client_id) or "Unknown"

        return visits

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

