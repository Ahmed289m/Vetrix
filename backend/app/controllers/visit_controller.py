from app.schemas.visit import VisitCreate, VisitUpdate
from app.services.visit_service import VisitService


class VisitController:
    def __init__(self, service: VisitService) -> None:
        self.service = service

    async def create_visit(self, request: VisitCreate) -> dict:
        return await self.service.create_visit(request)

    async def list_visits(self) -> list[dict]:
        return await self.service.list_visits()

    async def get_visit(self, visit_id: str) -> dict:
        return await self.service.get_visit(visit_id)

    async def update_visit(self, visit_id: str, request: VisitUpdate) -> dict:
        return await self.service.update_visit(visit_id, request)

    async def delete_visit(self, visit_id: str) -> None:
        await self.service.delete_visit(visit_id)

