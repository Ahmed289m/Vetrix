from fastapi import HTTPException, status

from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole
from app.models.prescription import Prescription
from app.models.prescription_item import PrescriptionItem
from app.repositories.drug_repository import DrugRepository
from app.repositories.prescription_item_repository import PrescriptionItemRepository
from app.repositories.prescription_repository import PrescriptionRepository
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate
from app.services.base_crud_service import BaseCrudService
from app.utils.mongo_helpers import generate_prefixed_id, normalize_for_mongo, serialize_mongo_doc


class PrescriptionService:
    def __init__(
        self,
        repository: PrescriptionRepository,
        drug_repository: DrugRepository,
        prescription_item_repository: PrescriptionItemRepository,
    ) -> None:
        self.crud = BaseCrudService(
            repository,
            Prescription,
            id_field="prescription_id",
            id_prefix="prescription",
        )
        self.repository = repository
        self.drug_repository = drug_repository
        self.prescription_item_repository = prescription_item_repository

    async def create_prescription(self, request: PrescriptionCreate, current_user: TokenData) -> dict:
        """
        Create a prescription with authorization.

        Accepts `drug_id` directly — the prescription item is auto-created from
        the drug's own dosage info, so the doctor doesn't need to manually enter
        a dose string (it lives on the drug record).

        - DOCTOR/STAFF can create prescriptions in their clinic
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

        # ── Resolve prescription item from drug ────────────────────────────
        # The frontend now sends drug_id. We pull the drug's dosage info and
        # auto-create a PrescriptionItem so the doctor doesn't have to enter
        # duplicate dose information.
        drug_id = getattr(request, "drug_id", None)
        prescriptionItem_id = getattr(request, "prescriptionItem_id", None)

        if drug_id and not prescriptionItem_id:
            drug = await self.drug_repository.get_by_id(drug_id)
            if not drug:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Drug not found",
                )

            # Build a human-readable dose string from the drug's dosage dict.
            # e.g. {"dogs": "5mg/kg", "cats": "2.5mg/kg"} → "dogs: 5mg/kg | cats: 2.5mg/kg"
            dosage_dict = drug.get("dosage", {})
            if isinstance(dosage_dict, dict):
                dose_str = " | ".join(f"{k}: {v}" for k, v in dosage_dict.items()) or "See drug info"
            else:
                dose_str = str(dosage_dict) if dosage_dict else "See drug info"

            # Create the prescription item
            item_id = generate_prefixed_id("prescriptionItem")
            item_model = PrescriptionItem(
                prescriptionItem_id=item_id,
                drug_id=drug_id,
                drugDose=dose_str,
                clinic_id=clinic_id,
            )
            item_payload = normalize_for_mongo(item_model.model_dump())
            await self.prescription_item_repository.create(item_payload)
            prescriptionItem_id = item_id

        if not prescriptionItem_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either drug_id or prescriptionItem_id is required",
            )

        payload = {
            "client_id": request.client_id,
            "pet_id": request.pet_id,
            "prescriptionItem_id": prescriptionItem_id,
            "clinic_id": clinic_id,
        }
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
            # CLIENT sees only their prescriptions, scoped by clinic_id if available.
            # CLIENT token doesn't carry clinic_id — use what's in the token or fetch from DB.
            # For simplicity: query only by client_id (no clinic leak possible since
            # the prescription's clinic_id is not exposed to the CLIENT anyway).
            prescriptions = await self.repository.list_by_client_only(current_user.user_id)
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
            if current_user.role == UserRole.CLIENT:
                # CLIENT: ownership check only
                if prescription.get("client_id") != current_user.user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied",
                    )
            else:
                if prescription.get("clinic_id") != current_user.clinic_id:
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
