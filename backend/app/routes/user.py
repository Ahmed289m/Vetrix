from fastapi import APIRouter, Depends

from app.controllers.user_controller import UserController
from app.routes.dependencies import get_user_controller
from app.schemas.user import UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.post("")
async def create_user(
    request: UserCreate,
    controller: UserController = Depends(get_user_controller),
) -> dict:
    created = await controller.create_user(request)
    return {
        "success": True,
        "message": "User created successfully.",
        "data": created,
    }


@router.get("")
async def list_users(
    controller: UserController = Depends(get_user_controller),
) -> dict:
    users = await controller.list_users()
    return {
        "success": True,
        "message": "Users fetched successfully.",
        "data": users,
    }


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    controller: UserController = Depends(get_user_controller),
) -> dict:
    user = await controller.get_user(user_id)
    return {
        "success": True,
        "message": "User fetched successfully.",
        "data": user,
    }


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    request: UserUpdate,
    controller: UserController = Depends(get_user_controller),
) -> dict:
    updated = await controller.update_user(user_id, request)
    return {
        "success": True,
        "message": "User updated successfully.",
        "data": updated,
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    controller: UserController = Depends(get_user_controller),
) -> dict:
    await controller.delete_user(user_id)
    return {
        "success": True,
        "message": "User deleted successfully.",
        "data": {"user_id": user_id},
    }
