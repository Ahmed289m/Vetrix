from app.core.database import get_database
from app.repositories.drug_repository import DrugRepository
from app.repositories.prescription_item_repository import PrescriptionItemRepository
from app.repositories.prescription_repository import PrescriptionRepository
from app.repositories.user_repository import UserRepository
from app.repositories.visit_repository import VisitRepository
from app.services.drug_service import DrugService
from app.services.prescription_item_service import PrescriptionItemService
from app.services.prescription_service import PrescriptionService
from app.services.visit_service import VisitService


def _normalize_pet_type(pet_type: str | None) -> str:
    normalized = (pet_type or "").strip().lower()
    return normalized if normalized in {"dog", "cat"} else ""


def _resolve_dosage_for_pet_type(raw_dosage, pet_type: str):
    if raw_dosage is None:
        return None
    if isinstance(raw_dosage, dict) and pet_type:
        if raw_dosage.get(pet_type) is not None:
            return raw_dosage.get(pet_type)
    return raw_dosage


async def getVisitsInfo(pet_id: str, pet_type: str | None = None):
    db = get_database()
    normalized_pet_type = _normalize_pet_type(pet_type)

    visit_service = VisitService(VisitRepository(db),  UserRepository(db))
    prescription_service = PrescriptionService(
        PrescriptionRepository(db),
        DrugRepository(db),
        PrescriptionItemRepository(db),
    )
    prescription_item_service = PrescriptionItemService(
        PrescriptionItemRepository(db),
        PrescriptionRepository(db),
    )
    drug_service = DrugService(DrugRepository(db))

    visits = await visit_service.list_visits_by_pet(pet_id)

    if not visits:
        return {"visits": []}

    result = []

    for visit in visits:
        medications = []

        prescription_id = visit.get("prescription_id")
        if prescription_id:
            prescription = await prescription_service.get_by_prescription_id(prescription_id)

            if prescription:
                item_ids = prescription.get("prescriptionItem_ids", [])

                items = await prescription_item_service.list_by_prescription_item_ids(item_ids)

                for item in items:
                    item_drug_ids = item.get("drug_ids") or []
                    if not item_drug_ids:
                        continue

                    drugs = await drug_service.list_by_drug_ids(item_drug_ids)
                    for drug in drugs:
                        if normalized_pet_type:
                            dosage_source = drug.get("dosage")
                        else:
                            dosage_source = item.get("drugDose") or drug.get("dosage")
                        medications.append({
                            "drug_name": drug.get("name"),
                            "dosage": _resolve_dosage_for_pet_type(
                                dosage_source,
                                normalized_pet_type,
                            ),
                        })

        result.append({
            "visit_notes": visit.get("notes"),
            "date": visit.get("date"),
            "medications": medications
        })

    return {"visits": result}
