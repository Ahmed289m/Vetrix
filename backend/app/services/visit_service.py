from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole
from app.models.visit import Visit
from app.repositories.user_repository import UserRepository
from app.repositories.visit_repository import VisitRepository
from app.schemas.visit import VisitCreate, VisitUpdate
from app.services.base_crud_service import BaseCrudService
from app.utils.mongo_helpers import normalize_for_mongo, serialize_mongo_doc
from app.utils.ws import broadcast


class VisitService:
    def __init__(self, repository: VisitRepository, user_repository: UserRepository) -> None:
        self.crud = BaseCrudService(repository, Visit, id_field="visit_id", id_prefix="visit")
        self.repository = repository
        self.user_repository = user_repository

    @staticmethod
    def _normalize_prescription_ids(data: dict) -> dict:
        raw_ids = data.get("prescription_ids")
        if isinstance(raw_ids, list):
            normalized_ids = [
                value.strip()
                for value in raw_ids
                if isinstance(value, str) and value.strip()
            ]
        else:
            normalized_ids = []

        legacy_id = data.get("prescription_id")
        if isinstance(legacy_id, str) and legacy_id.strip() and not normalized_ids:
            normalized_ids = [legacy_id.strip()]

        deduped_ids: list[str] = []
        seen: set[str] = set()
        for prescription_id in normalized_ids:
            if prescription_id in seen:
                continue
            deduped_ids.append(prescription_id)
            seen.add(prescription_id)

        if "prescription_ids" in data:
            data["prescription_ids"] = deduped_ids
            data["prescription_id"] = deduped_ids[0] if deduped_ids else None
        elif "prescription_id" in data and deduped_ids:
            data["prescription_ids"] = deduped_ids
            data["prescription_id"] = deduped_ids[0]

        return data

    def _normalize_visit_record(self, visit: dict) -> dict:
        normalized = dict(visit)
        return self._normalize_prescription_ids(normalized)

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
        payload = self._normalize_prescription_ids(payload)
        payload["clinic_id"] = clinic_id
        created = await self.crud.create(Visit(**payload))
        return self._normalize_visit_record(created)

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
            normalized = [self._normalize_visit_record(visit) for visit in sorted_visits]
            return await self._attach_user_names(normalized)

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

        serialized = [
            self._normalize_visit_record(serialize_mongo_doc(visit, "visit_id"))
            for visit in visits
        ]
        return await self._attach_user_names(serialized)

    async def list_visits_by_pet(self, pet_id: str) -> list[dict]:
        """List all visits for a specific pet_id."""
        normalized_pet_id = (pet_id or "").strip()
        if not normalized_pet_id:
            return []

        visits = await self.repository.list_by_pet(normalized_pet_id)
        serialized = [
            self._normalize_visit_record(serialize_mongo_doc(visit, "visit_id"))
            for visit in visits
        ]
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

        normalized_visit = self._normalize_visit_record(visit)
        enriched_list = await self._attach_user_names([normalized_visit])
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
        
        payload = self._normalize_prescription_ids(request.model_dump(exclude_none=True))
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update.",
            )

        updated = await self.repository.update_by_id(
            visit_id,
            normalize_for_mongo(payload),
        )
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

        await broadcast("visits:updated", {"id": visit_id})
        serialized = serialize_mongo_doc(updated, "visit_id")
        return self._normalize_visit_record(serialized)

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

