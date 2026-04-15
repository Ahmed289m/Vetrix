from fastapi import APIRouter, Depends

from app.controllers.visit_controller import VisitController
from app.core.permission_checker import TokenData, require_permission, require_clinic_id
from app.core.permissions import Permissions
from app.routes.dependencies import get_visit_controller
from app.schemas.visit import VisitCreate, VisitUpdate

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("")
async def create_visit(
    request: VisitCreate,
    current_user: TokenData = Depends(require_permission(Permissions.VISITS_CREATE)),
    clinic_check: TokenData = Depends(require_clinic_id()),
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    """
    Create a new visit (DOCTOR/STAFF only).
    
    - DOCTOR/STAFF can create visits in their clinic
    """
    created = await controller.create_visit(request, current_user)
    return {"success": True, "message": "Visit created successfully.", "data": created}


@router.get("")
async def list_visits(
    current_user: TokenData = Depends(require_permission(Permissions.VISITS_READ)),
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    """
    List visits (authorized users only).
    
    - ADMIN sees all visits
    - DOCTOR/STAFF see visits in their clinic
    - CLIENT sees only their visits
    """
    visits = await controller.list_visits(current_user)
    return {"success": True, "message": "Visits fetched successfully.", "data": visits}


@router.get("/{visit_id}")
async def get_visit(
    visit_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.VISITS_READ)),
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    """
    Get a specific visit.
    
    - ADMIN can read any visit
    - DOCTOR/STAFF can read visits in their clinic
    - CLIENT can read only visits of their pets
    """
    visit = await controller.get_visit(visit_id, current_user)
    return {"success": True, "message": "Visit fetched successfully.", "data": visit}


@router.put("/{visit_id}")
async def update_visit(
    visit_id: str,
    request: VisitUpdate,
    current_user: TokenData = Depends(require_permission(Permissions.VISITS_UPDATE)),
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    """
    Update a visit (DOCTOR/STAFF only).
    
    - ADMIN can update any visit
    - DOCTOR/STAFF can update visits in their clinic
    """
    updated = await controller.update_visit(visit_id, request, current_user)
    return {"success": True, "message": "Visit updated successfully.", "data": updated}


@router.delete("/{visit_id}")
async def delete_visit(
    visit_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.VISITS_DELETE)),
    controller: VisitController = Depends(get_visit_controller),
) -> dict:
    """
    Delete a visit (DOCTOR/STAFF only).
    
    - ADMIN can delete any visit
    - DOCTOR/STAFF can delete visits in their clinic
    """
    await controller.delete_visit(visit_id, current_user)
    return {"success": True, "message": "Visit deleted successfully.", "data": {"visit_id": visit_id}}

