from app.models.visit import Visit
from app.repositories.visit_repository import VisitRepository
from app.schemas.visit import VisitCreate, VisitUpdate
from app.services.base_crud_service import BaseCrudService


class VisitService:
    def __init__(self, repository: VisitRepository) -> None:
        self.crud = BaseCrudService(repository, Visit, id_field="visit_id", id_prefix="visit")

    async def create_visit(self, request: VisitCreate) -> dict:
        return await self.crud.create(request)

    async def list_visits(self) -> list[dict]:
        return await self.crud.list()

    async def get_visit(self, visit_id: str) -> dict:
        return await self.crud.get(visit_id)

    async def update_visit(self, visit_id: str, request: VisitUpdate) -> dict:
        return await self.crud.update(visit_id, request)

    async def delete_visit(self, visit_id: str) -> None:
        await self.crud.delete(visit_id)

