"""
Authentication and authorization utility functions.

Provides helper functions for common security checks and data extraction
that can be reused across controllers and services.
"""

from app.core.permission_checker import TokenData
from app.models.enums.user_role import UserRole


def extract_clinic_id(current_user: TokenData) -> str | None:
    """
    Extract clinic_id from current user, ensuring it exists for non-admin users.
    
    Args:
        current_user: TokenData object from dependency
        
    Returns:
        clinic_id string or None for global admin
        
    Raises:
        ValueError: If non-admin user has no clinic_id
    """
    if current_user.is_superuser:
        return None
    
    if not current_user.clinic_id:
        raise ValueError("Clinic ID is required for this operation")
    
    return current_user.clinic_id


def can_manage_user(current_user: TokenData, target_user_role: UserRole | str) -> bool:
    """
    Check if current user can manage (create/update/delete) a target user.
    
    Rules:
    - ADMIN (superuser) can manage anyone
    - OWNER can manage DOCTOR, STAFF, CLIENT (not other OWNER or ADMIN)
    - DOCTOR/STAFF/CLIENT cannot manage anyone
    
    Args:
        current_user: TokenData object
        target_user_role: Role of the user being managed
        
    Returns:
        True if current user can manage target user
    """
    # Convert string role to enum if needed
    if isinstance(target_user_role, str):
        target_user_role = UserRole(target_user_role)
    
    # Admin can manage anyone
    if current_user.is_superuser:
        return True
    
    # Owner can manage lower-level users
    if current_user.role == UserRole.OWNER:
        manageable_roles = {UserRole.DOCTOR, UserRole.STAFF, UserRole.CLIENT}
        return target_user_role in manageable_roles
    
    # Other roles cannot manage users
    return False


def is_owner_or_admin(current_user: TokenData) -> bool:
    """
    Check if current user is OWNER or ADMIN (has elevated privileges).
    
    Args:
        current_user: TokenData object
        
    Returns:
        True if user is OWNER or ADMIN
    """
    return current_user.role == UserRole.OWNER or current_user.is_superuser


def is_medical_staff(current_user: TokenData) -> bool:
    """
    Check if current user is medical staff (DOCTOR or higher).
    
    Medical staff can view/create visits and prescriptions.
    
    Args:
        current_user: TokenData object
        
    Returns:
        True if user is DOCTOR or ADMIN
    """
    return current_user.role in {UserRole.DOCTOR, UserRole.ADMIN}


def is_clinic_admin(current_user: TokenData) -> bool:
    """
    Check if current user is clinic admin (OWNER or GLOBAL_ADMIN).
    
    Clinic admins can manage clinic settings and users.
    
    Args:
        current_user: TokenData object
        
    Returns:
        True if user is OWNER or ADMIN
    """
    return current_user.role in {UserRole.OWNER, UserRole.ADMIN} or current_user.is_superuser


def normalize_clinic_id(resource_clinic_id: str | None, current_user: TokenData) -> str | None:
    """
    Normalize clinic_id for multi-tenant requests.
    
    For admins: returns the provided resource_clinic_id
    For regular users: returns their own clinic_id (ignores provided value)
    
    Args:
        resource_clinic_id: clinic_id from resource/request
        current_user: Current authenticated user
        
    Returns:
        Normalized clinic_id
    """
    if current_user.is_superuser:
        return resource_clinic_id
    
    return current_user.clinic_id
