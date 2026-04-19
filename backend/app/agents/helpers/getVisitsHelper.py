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


async def get_case_history(pet_id: str):
    db = get_database()

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
                        medications.append({
                            "drug_name": drug.get("name"),
                            "dosage": item.get("drugDose") or drug.get("dosage"),
                        })

        result.append({
            "visit_notes": visit.get("notes"),
            "date": visit.get("date"),
            "medications": medications
        })

    return {"visits": result}
