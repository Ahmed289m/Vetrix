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


def _format_dose_species(species_dose) -> str | None:
    if not isinstance(species_dose, dict):
        return None
    value = species_dose.get("value")
    unit = species_dose.get("unit")
    frequency = species_dose.get("frequency")
    parts: list[str] = []
    if value is not None:
        parts.append(str(value))
    if unit:
        parts.append(str(unit))
    rendered = " ".join(parts).strip()
    if frequency:
        rendered = f"{rendered} {frequency}".strip()
    return rendered or None


def _resolve_dose_for_pet_type(dose, pet_type: str):
    """
    Build a human-readable dose string for the given pet type.
    `dose` is the structured drug.dose dict: {dog, cat, route}.
    """
    if not isinstance(dose, dict):
        return dose

    route = dose.get("route")
    if pet_type:
        species_label = _format_dose_species(dose.get(pet_type))
        if species_label:
            return f"{species_label} {route}".strip() if route else species_label
        return None

    dog_label = _format_dose_species(dose.get("dog"))
    cat_label = _format_dose_species(dose.get("cat"))
    species_parts = []
    if dog_label:
        species_parts.append(f"dog: {dog_label}")
    if cat_label:
        species_parts.append(f"cat: {cat_label}")
    rendered = ", ".join(species_parts)
    if route:
        rendered = f"{rendered} ({route})" if rendered else route
    return rendered or None


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

        prescription_ids = visit.get("prescription_ids")
        if not isinstance(prescription_ids, list) or not prescription_ids:
            legacy_prescription_id = visit.get("prescription_id")
            prescription_ids = [legacy_prescription_id] if legacy_prescription_id else []

        for prescription_id in prescription_ids:
            prescription = await prescription_service.get_by_prescription_id(prescription_id)

            if not prescription:
                continue

            item_ids = prescription.get("prescriptionItem_ids", [])
            items = await prescription_item_service.list_by_prescription_item_ids(item_ids)

            for item in items:
                item_drug_ids = item.get("drug_ids") or []
                if not item_drug_ids:
                    continue

                drugs = await drug_service.list_by_drug_ids(item_drug_ids)
                for drug in drugs:
                    if normalized_pet_type:
                        dose_label = _resolve_dose_for_pet_type(drug.get("dose"), normalized_pet_type)
                    else:
                        dose_label = item.get("drugDose") or _resolve_dose_for_pet_type(drug.get("dose"), "")
                    medications.append({
                        "drug_name": drug.get("name"),
                        "dose": dose_label,
                    })

        result.append({
            "visit_notes": visit.get("notes"),
            "date": visit.get("date"),
            "medications": medications
        })

    return {"visits": result}
