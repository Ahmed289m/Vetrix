from fastapi import APIRouter, Depends

from app.controllers.user_controller import UserController
from app.core.permission_checker import TokenData, require_permission, require_clinic_id
from app.core.permissions import Permissions
from app.routes.dependencies import get_user_controller
from app.schemas.user import UserCreate, UserUpdate, UserCreatedResponse, UserResponse, CreateUserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=CreateUserResponse)
async def create_user(
    request: UserCreate,
    current_user: TokenData = Depends(require_permission(Permissions.USERS_CREATE)),
    clinic_check: TokenData = Depends(require_clinic_id()),
    controller: UserController = Depends(get_user_controller),
) -> CreateUserResponse:
    """
    Create a new user with AUTO-GENERATED email and password.
    
    **Request fields:**
    - fullname (required): User's full name
    - phone (required): User's phone number
    - role (required): User role (admin, owner, doctor, staff, client)
    - clinic_id (optional): Clinic ID. Defaults to current user's clinic
    
    **Auto-generated fields:**
    - email: Generated as name.role@clinic.vetrix.local
    - password: Generated as name@clinic#{user_id}
    
    **Response includes:**
    - email: Generated email for this user
    - password: Generated password (ONLY shown on creation, save it!)
    
    **Authorization:**
    - ADMIN can create users in any clinic
    - OWNER can create DOCTOR, STAFF, CLIENT in their clinic (not other OWNER)
    """
    created = await controller.create_user(request, current_user)
    return {
        "success": True,
        "message": "User created successfully. Save the generated email and password!",
        "data": created,
    }


@router.get("")
async def list_users(
    current_user: TokenData = Depends(require_permission(Permissions.USERS_READ)),
    clinic_check: TokenData = Depends(require_clinic_id()),
    controller: UserController = Depends(get_user_controller),
) -> dict:
    """
    List users (authorized users only).
    
    - ADMIN sees all users
    - OWNER/STAFF/DOCTOR see only users in their clinic
    """
    users = await controller.list_users(current_user)
    return {
        "success": True,
        "message": "Users fetched successfully.",
        "data": users,
    }


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.USERS_READ)),
    controller: UserController = Depends(get_user_controller),
) -> dict:
    """
    Get a specific user.
    
    - ADMIN can read any user
    - OWNER/STAFF/DOCTOR can read users in their clinic
    - CLIENT can read only themselves
    """
    user = await controller.get_user(user_id, current_user)
    return {
        "success": True,
        "message": "User fetched successfully.",
        "data": user,
    }


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    request: UserUpdate,
    current_user: TokenData = Depends(require_permission(Permissions.USERS_UPDATE)),
    controller: UserController = Depends(get_user_controller),
) -> dict:
    """
    Update a user (authorized users only).
    
    - ADMIN can update any user
    - OWNER can update DOCTOR, STAFF, CLIENT in their clinic
    - CLIENT can update only themselves
    - Users cannot change their own role
    """
    updated = await controller.update_user(user_id, request, current_user)
    return {
        "success": True,
        "message": "User updated successfully.",
        "data": updated,
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.USERS_DELETE)),
    controller: UserController = Depends(get_user_controller),
) -> dict:
    """
    Delete a user (OWNER/ADMIN only).
    
    - ADMIN can delete any user
    - OWNER can delete DOCTOR, STAFF, CLIENT in their clinic (not other OWNER)
    """
    await controller.delete_user(user_id, current_user)
    return {
        "success": True,
        "message": "User deleted successfully.",
        "data": {"user_id": user_id},
    }


@router.post("/{user_id}/show-password", response_model=CreateUserResponse)
async def show_password(
    user_id: str,
    current_user: TokenData = Depends(require_permission(Permissions.USERS_READ)),
    controller: UserController = Depends(get_user_controller),
) -> CreateUserResponse:
    """
    Reset and return the current password for a user.
    
    - ADMIN can reset any user's password
    - OWNER can reset DOCTOR, STAFF, CLIENT passwords in their clinic
    
    Returns the new user password after persisting its hash.
    """
    result = await controller.get_user_password(user_id, current_user)
    return {
        "success": True,
        "message": "Password reset successfully.",
        "data": result,
    }
