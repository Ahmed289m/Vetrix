"""
Role-based access control (RBAC) permission system for Vetrix.

Permissions follow action-based naming convention:
- resource.action (e.g., users.create, visits.read)
- resource.action.own (e.g., appointments.create.own - for self/owned resources only)

Roles:
- ADMIN: Global admin with all privileges across all clinics (is_superuser=True)
- OWNER: Clinic owner with elevated permissions per clinic
- DOCTOR: Can manage visits and prescriptions
- STAFF: Limited access to clinic operations
- CLIENT: Minimal access - can manage own data and appointments
"""

from app.models.enums.user_role import UserRole


# Permission constants
class Permissions:
    """All available permissions in the system."""

    # User management
    USERS_CREATE = "users.create"
    USERS_READ = "users.read"
    USERS_UPDATE = "users.update"
    USERS_DELETE = "users.delete"
    USERS_READ_OWN = "users.read.own"

    # Clinic management
    CLINICS_CREATE = "clinics.create"
    CLINICS_READ = "clinics.read"
    CLINICS_UPDATE = "clinics.update"
    CLINICS_DELETE = "clinics.delete"

    # Pet management
    PETS_CREATE = "pets.create"
    PETS_READ = "pets.read"
    PETS_UPDATE = "pets.update"
    PETS_DELETE = "pets.delete"
    PETS_CREATE_OWN = "pets.create.own"
    PETS_READ_OWN = "pets.read.own"
    PETS_UPDATE_OWN = "pets.update.own"
    PETS_DELETE_OWN = "pets.delete.own"

    # Visit management
    VISITS_CREATE = "visits.create"
    VISITS_READ = "visits.read"
    VISITS_UPDATE = "visits.update"
    VISITS_DELETE = "visits.delete"
    VISITS_READ_OWN = "visits.read.own"

    # Prescription management
    PRESCRIPTIONS_CREATE = "prescriptions.create"
    PRESCRIPTIONS_READ = "prescriptions.read"
    PRESCRIPTIONS_UPDATE = "prescriptions.update"
    PRESCRIPTIONS_DELETE = "prescriptions.delete"
    PRESCRIPTIONS_READ_OWN = "prescriptions.read.own"

    # Prescription Item management
    PRESCRIPTION_ITEMS_CREATE = "prescription_items.create"
    PRESCRIPTION_ITEMS_READ = "prescription_items.read"
    PRESCRIPTION_ITEMS_UPDATE = "prescription_items.update"
    PRESCRIPTION_ITEMS_DELETE = "prescription_items.delete"
    PRESCRIPTION_ITEMS_READ_OWN = "prescription_items.read.own"

    # Appointment management
    APPOINTMENTS_CREATE = "appointments.create"
    APPOINTMENTS_READ = "appointments.read"
    APPOINTMENTS_UPDATE = "appointments.update"
    APPOINTMENTS_DELETE = "appointments.delete"
    APPOINTMENTS_CREATE_OWN = "appointments.create.own"
    APPOINTMENTS_READ_OWN = "appointments.read.own"

    # Drug management
    DRUGS_CREATE = "drugs.create"
    DRUGS_READ = "drugs.read"
    DRUGS_UPDATE = "drugs.update"
    DRUGS_DELETE = "drugs.delete"


# Role-to-Permissions mapping
ROLE_PERMISSIONS: dict[UserRole, set[str]] = {
    UserRole.ADMIN: {
        # ADMIN has all permissions (wildcard)
        "*",
    },
    UserRole.OWNER: {
        # User management - can create/read/update/delete doctor, staff, client only (not owner/admin)
        Permissions.USERS_CREATE,
        Permissions.USERS_READ,
        Permissions.USERS_UPDATE,
        Permissions.USERS_DELETE,
        # Clinic management
        Permissions.CLINICS_READ,
        Permissions.CLINICS_UPDATE,
        # Pet management
        Permissions.PETS_CREATE,
        Permissions.PETS_READ,
        Permissions.PETS_UPDATE,
        Permissions.PETS_DELETE,
        # Visit management
        Permissions.VISITS_READ,
        # Prescription management
        Permissions.PRESCRIPTIONS_READ,
        # Prescription Item management
        Permissions.PRESCRIPTION_ITEMS_READ,
        # Appointment management
        Permissions.APPOINTMENTS_CREATE,
        Permissions.APPOINTMENTS_READ,
        Permissions.APPOINTMENTS_UPDATE,
        Permissions.APPOINTMENTS_DELETE,
        # Drug management
        Permissions.DRUGS_READ,
    },
    UserRole.DOCTOR: {
        # Visit management
        Permissions.VISITS_CREATE,
        Permissions.VISITS_READ,
        Permissions.VISITS_UPDATE,
        # Prescription management
        Permissions.PRESCRIPTIONS_CREATE,
        Permissions.PRESCRIPTIONS_READ,
        Permissions.PRESCRIPTIONS_UPDATE,
        # Prescription Item management
        Permissions.PRESCRIPTION_ITEMS_CREATE,
        Permissions.PRESCRIPTION_ITEMS_READ,
        Permissions.PRESCRIPTION_ITEMS_UPDATE,
        # Pet management (read-only)
        Permissions.PETS_READ,
        # Drug management (read-only)
        Permissions.DRUGS_READ,
    },
    UserRole.STAFF: {
        # Appointment management
        Permissions.APPOINTMENTS_CREATE,
        Permissions.APPOINTMENTS_READ,
        Permissions.APPOINTMENTS_UPDATE,
        Permissions.APPOINTMENTS_DELETE,
        # Visit management (read/delete only)
        Permissions.VISITS_READ,
        Permissions.VISITS_DELETE,
        # Prescription management (read/delete only)
        Permissions.PRESCRIPTIONS_READ,
        Permissions.PRESCRIPTIONS_DELETE,
        # Prescription Item management (read/delete only)
        Permissions.PRESCRIPTION_ITEMS_READ,
        Permissions.PRESCRIPTION_ITEMS_DELETE,
        # Pet management
        Permissions.PETS_CREATE,
        Permissions.PETS_READ,
        Permissions.PETS_UPDATE,
        Permissions.PETS_DELETE,
        # User management (can create client users only)
        Permissions.USERS_CREATE,
        Permissions.USERS_READ,
        # Drug management (read-only)
        Permissions.DRUGS_READ,
    },
    UserRole.CLIENT: {
        # Appointment management - own only
        Permissions.APPOINTMENTS_CREATE_OWN,
        Permissions.APPOINTMENTS_READ_OWN,
        # Visit management - own only
        Permissions.VISITS_READ_OWN,
        # Prescription management - own only
        Permissions.PRESCRIPTIONS_READ_OWN,
        # Prescription Item management - own only
        Permissions.PRESCRIPTION_ITEMS_READ_OWN,
        # Pet management - own only
        Permissions.PETS_CREATE_OWN,
        Permissions.PETS_READ_OWN,
        Permissions.PETS_UPDATE_OWN,
        Permissions.PETS_DELETE_OWN,
        # User management - read own
        Permissions.USERS_READ_OWN,
    },
}


def has_permission(role: UserRole, permission: str, is_superuser: bool = False) -> bool:
    """
    Check if a role has a specific permission.
    
    Args:
        role: The user's role
        permission: The permission to check
        is_superuser: If True, user is a global admin with all permissions
        
    Returns:
        True if user has permission, False otherwise
    """
    # Global admin has all permissions
    if is_superuser:
        return True

    # Check if permission exists in role's permissions
    role_permissions = ROLE_PERMISSIONS.get(role, set())
    
    # Wildcard match - if role has "*", all permissions allowed
    if "*" in role_permissions:
        return True
    
    return permission in role_permissions


def get_role_permissions(role: UserRole) -> set[str]:
    """Get all permissions for a role."""
    return ROLE_PERMISSIONS.get(role, set())
