import asyncio

from crewai.tools import tool

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


@tool("Get Pet Visits")
def get_pet_visits(pet_id: str) -> list:
    """
    Get all visits for a given pet_id.
    """
    normalized_pet_id = (pet_id or "").strip()
    if not normalized_pet_id:
        return []

    async def _get_visits() -> list[dict]:
        db = get_database()
        service = VisitService(VisitRepository(db), UserRepository(db))
        return await service.list_visits_by_pet(normalized_pet_id)

    return asyncio.run(_get_visits())


@tool("Get Prescription By ID")
def get_prescription_by_id(prescription_id: str) -> dict | None:
    """
    Get a prescription by prescription_id.
    """
    normalized_prescription_id = (prescription_id or "").strip()
    if not normalized_prescription_id:
        return None

    async def _get_prescription() -> dict | None:
        db = get_database()
        service = PrescriptionService(
            PrescriptionRepository(db),
            DrugRepository(db),
            PrescriptionItemRepository(db),
        )
        return await service.get_by_prescription_id(normalized_prescription_id)

    return asyncio.run(_get_prescription())


@tool("Get Prescription Items By IDs")
def get_prescription_items_by_ids(prescriptionItem_ids: list[str]) -> list:
    """
    Get prescription items by prescription_item_id values.
    """
    normalized_ids = [item_id.strip() for item_id in (prescriptionItem_ids or []) if isinstance(item_id, str) and item_id.strip()]
    if not normalized_ids:
        return []

    async def _get_items() -> list[dict]:
        db = get_database()
        service = PrescriptionItemService(PrescriptionItemRepository(db), PrescriptionRepository(db))
        return await service.list_by_prescription_item_ids(normalized_ids)

    return asyncio.run(_get_items())


@tool("Get Drugs By IDs")
def get_drugs_by_ids(drug_ids: list[str]) -> list:
    """
    Get drugs by drug_id values.
    """
    normalized_ids = [drug_id.strip() for drug_id in (drug_ids or []) if isinstance(drug_id, str) and drug_id.strip()]
    if not normalized_ids:
        return []

    async def _get_drugs() -> list[dict]:
        db = get_database()
        service = DrugService(DrugRepository(db))
        return await service.list_by_drug_ids(normalized_ids)

    return asyncio.run(_get_drugs())