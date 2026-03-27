from app.core.permission_checker import TokenData
from app.schemas.visit import VisitCreate, VisitUpdate
from app.services.visit_service import VisitService


class VisitController:
    def __init__(self, service: VisitService) -> None:
        self.service = service

    async def create_visit(self, request: VisitCreate, current_user: TokenData) -> dict:
        return await self.service.create_visit(request, current_user)

    async def list_visits(self, current_user: TokenData) -> list[dict]:
        return await self.service.list_visits(current_user)

    async def get_visit(self, visit_id: str, current_user: TokenData) -> dict:
        return await self.service.get_visit(visit_id, current_user)

    async def update_visit(self, visit_id: str, request: VisitUpdate, current_user: TokenData) -> dict:
        return await self.service.update_visit(visit_id, request, current_user)

    async def delete_visit(self, visit_id: str, current_user: TokenData) -> None:
        await self.service.delete_visit(visit_id, current_user)

