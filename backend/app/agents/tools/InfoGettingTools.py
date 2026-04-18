import asyncio

from crewai.tools import tool

from app.core.database import get_database
from app.repositories.user_repository import UserRepository
from app.repositories.visit_repository import VisitRepository
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