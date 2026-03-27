from fastapi import APIRouter, Depends

from app.controllers.visit_controller import VisitController
from app.routes.dependencies import get_visit_controller
from app.schemas.visit import VisitCreate, VisitUpdate

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("")
async def create_visit(
    request: VisitCreate,
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    created = await controller.create_visit(request)
    return {"success": True, "message": "Visit created successfully.", "data": created}


@router.get("")
async def list_visits(
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    visits = await controller.list_visits()
    return {"success": True, "message": "Visits fetched successfully.", "data": visits}


@router.get("/{visit_id}")
async def get_visit(
    visit_id: str,
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    visit = await controller.get_visit(visit_id)
    return {"success": True, "message": "Visit fetched successfully.", "data": visit}


@router.put("/{visit_id}")
async def update_visit(
    visit_id: str,
    request: VisitUpdate,
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    updated = await controller.update_visit(visit_id, request)
    return {"success": True, "message": "Visit updated successfully.", "data": updated}


@router.delete("/{visit_id}")
async def delete_visit(
    visit_id: str,
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    await controller.delete_visit(visit_id)
    return {"success": True, "message": "Visit deleted successfully.", "data": {"visit_id": visit_id}}

