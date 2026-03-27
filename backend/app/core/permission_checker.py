"""
Permission checking utilities and FastAPI dependencies for RBAC enforcement.

Provides decorators and dependencies to protect routes with role-based access control.
"""

from typing import Any

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt

from app.core.config import settings
from app.core.permissions import has_permission
from app.models.enums.user_role import UserRole


class TokenData:
    """Parsed JWT token data."""

    def __init__(
        self,
        user_id: str,
        email: str,
        role: UserRole,
        clinic_id: str | None,
        is_superuser: bool = False,
    ):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.clinic_id = clinic_id
        self.is_superuser = is_superuser


async def get_current_user(request: Request) -> TokenData:
    """
    Extract and validate JWT token from request, returning current user data.
    
    Uses token extracted by AuthMiddleware and stored in request.state.
    
    Args:
        request: FastAPI request object
        
    Returns:
        TokenData with user info
        
    Raises:
        HTTPException(401): If token is invalid or missing
    """
    token = request.state.token if hasattr(request.state, "token") else None

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload: dict[str, Any] = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        clinic_id: str | None = payload.get("clinic_id")
        email: str = payload.get("email", "")
        is_superuser: bool = payload.get("is_superuser", False)

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        # Convert role string to enum
        try:
            role_enum = UserRole(role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid role in token",
            )

        return TokenData(
            user_id=user_id,
            email=email,
            role=role_enum,
            clinic_id=clinic_id,
            is_superuser=is_superuser,
        )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def require_permission(permission: str):
    """
    FastAPI dependency to check if current user has required permission.
    
    Usage:
        @router.post("/items")
        async def create_item(
            current_user: TokenData = Depends(require_permission("items.create"))
        ):
            ...
            
    Args:
        permission: The permission string to check (e.g., "items.create")
        
    Returns:
        Dependency function that returns current_user if authorized
        
    Raises:
        HTTPException(403): If user lacks permission
    """

    async def permission_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if not has_permission(current_user.role, permission, current_user.is_superuser):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions for '{permission}'",
            )
        return current_user

    return permission_checker


def require_clinic_id():
    """
    FastAPI dependency to ensure user has a clinic_id (multi-tenancy check).
    
    Raises:
        HTTPException(400): If clinic_id is missing (shouldn't happen for non-admin)
    """

    async def clinic_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if not current_user.is_superuser and not current_user.clinic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Clinic ID is required for this operation",
            )
        return current_user

    return clinic_checker


def require_admin():
    """
    FastAPI dependency to require ADMIN role with is_superuser flag.
    
    Raises:
        HTTPException(403): If user is not a global admin
    """

    async def admin_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.role != UserRole.ADMIN or not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required",
            )
        return current_user

    return admin_checker


def require_clinic_isolation(resource_clinic_id: str | None):
    """
    Ensure user only accesses resources from their own clinic (if not superuser).
    
    Args:
        resource_clinic_id: The clinic_id of the requested resource
        
    Raises:
        HTTPException(403): If user's clinic_id doesn't match resource's clinic_id
    """

    async def isolation_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        # Global admin can access any clinic's resources
        if current_user.is_superuser:
            return current_user

        # Regular users must match clinic_id
        if current_user.clinic_id != resource_clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied - resource belongs to a different clinic",
            )

        return current_user

    return isolation_checker


def require_ownership(resource_owner_id: str | None):
    """
    Ensure user only accesses resources they own (resource_owner_id must match current_user.user_id).
    
    Used to prevent users from accessing/modifying other users' resources (pets, visits, appointments, etc).
    Global admin (superuser) bypasses this check.
    
    Args:
        resource_owner_id: The user_id of the resource owner
        
    Raises:
        HTTPException(403): If user_id doesn't match resource owner
        
    Usage:
        @router.get("/pets/{pet_id}")
        async def get_pet(
            pet_id: str,
            current_user: TokenData = Depends(require_ownership(pet.owner_id))
        ):
            ...
    """

    async def ownership_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        # Global admin can access any resource
        if current_user.is_superuser:
            return current_user

        # Regular users can only access their own resources
        if current_user.user_id != resource_owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied - you do not own this resource",
            )

        return current_user

    return ownership_checker
