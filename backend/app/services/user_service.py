from fastapi import HTTPException, status
from uuid import uuid4

from app.core.auth_utils import can_manage_user
from app.core.permission_checker import TokenData
from app.core.security import get_password_hash
from app.models.enums.user_role import UserRole
from app.models.user import User
from app.repositories.clinic_repository import ClinicRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.services.credential_service import CredentialService
from app.utils.ws import broadcast


class UserService:
    def __init__(
        self,
        user_repository: UserRepository,
        clinic_repository: ClinicRepository,
        credential_service: CredentialService,
    ) -> None:
        self.user_repository = user_repository
        self.clinic_repository = clinic_repository
        self.credential_service = credential_service

    @staticmethod
    def _sanitize(user: dict) -> dict:
        mongo_id = user.get("_id")
        if mongo_id and not user.get("user_id"):
            user["user_id"] = mongo_id
        user.pop("_id", None)
        user.pop("password", None)
        return user

    @staticmethod
    def _sanitize_with_password(user: dict, password: str) -> dict:
        """Sanitize user data but include the generated password (only for creation)"""
        mongo_id = user.get("_id")
        if mongo_id and not user.get("user_id"):
            user["user_id"] = mongo_id
        user.pop("_id", None)
        user.pop("password", None)  # Remove hashed password
        user["password"] = password  # Add the plain-text generated password
        return user

    async def create_user(self, request: UserCreate, current_user: TokenData) -> dict:
        """
        Create a new user with auto-generated email and password.
        
        - ADMIN can create users in any clinic
        - OWNER can create DOCTOR, STAFF, CLIENT in their clinic (not OWNER)
        - Target role cannot be higher than creator
        
        Returns:
            User data including generated email and plain-text password (only on creation)
        """
        # Enforce clinic isolation
        clinic_id = request.clinic_id or current_user.clinic_id
        if not clinic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="clinic_id is required",
            )
        
        if not current_user.is_superuser and current_user.clinic_id != clinic_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create users in other clinics",
            )
        
        # Verify clinic exists
        clinic = await self.clinic_repository.get_by_clinic_id(clinic_id)
        if not clinic:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found.")
        
        # Prevent non-admin from creating admin/owner
        target_role = request.role
        # STAFF is allowed to create CLIENT users only (per RBAC map).
        staff_can_create_client = (
            current_user.role == UserRole.STAFF and target_role == UserRole.CLIENT
        )

        if not can_manage_user(current_user, target_role) and not staff_can_create_client:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not authorized to create user with role {target_role}",
            )
        
        user_id = f"user_{uuid4().hex[:12]}"
        if await self.user_repository.get_by_user_id(user_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User id already exists.")

        clinic_name = clinic.get("clinicName", "clinic")
        
        # Generate email and password automatically
        email_value = self.credential_service.generate_email(
            request.fullname, request.role, clinic_name
        )
        password_value = self.credential_service.generate_password(
            request.fullname, clinic_name, user_id
        )

        if await self.user_repository.get_by_email(email_value):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists.")

        user_model = User(
            user_id=user_id,
            fullname=request.fullname,
            phone=request.phone,
            email=email_value,
            password=get_password_hash(password_value),
            role=request.role,
            clinic_id=clinic_id,
        )
        created = await self.user_repository.create_user(user_model.model_dump())
        await broadcast("users:created", {"id": user_id})
        
        # Return user data WITH the generated plain-text password
        return self._sanitize_with_password(created, password_value)

    async def list_users(self, current_user: TokenData) -> list[dict]:
        """
        List users based on current user's role.
        
        - ADMIN sees all users
        - OWNER/STAFF see only users in their clinic
        - DOCTOR sees only CLIENT users in their clinic
        """
        if current_user.is_superuser:
            users = await self.user_repository.list_users()
        else:
            # Filter by clinic
            if not current_user.clinic_id:
                return []
            users = await self.user_repository.list_users_by_clinic(current_user.clinic_id)
            
            # DOCTOR can only see CLIENT users
            if current_user.role == UserRole.DOCTOR:
                users = [u for u in users if u.get("role") == UserRole.CLIENT]
        
        return [self._sanitize(user) for user in users]

    async def get_user(self, user_id: str, current_user: TokenData) -> dict:
        """
        Get a user with clinic isolation check.
        
        - ADMIN can read any user
        - OWNER/STAFF can read users in their clinic
        - DOCTOR can only read CLIENT users in their clinic
        - CLIENT can read only themselves
        """
        user = await self.user_repository.get_by_user_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if user.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
            
            # DOCTOR can only read CLIENT users
            if current_user.role == UserRole.DOCTOR and user.get("role") != UserRole.CLIENT:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        return self._sanitize(user)

    async def update_user(self, user_id: str, request: UserUpdate, current_user: TokenData) -> dict:
        """
        Update a user with authorization checks.
        
        - ADMIN can update any user
        - OWNER can update DOCTOR, STAFF, CLIENT in their clinic
        - CLIENT can update only themselves
        - Users cannot change their own role (prevent privilege escalation)
        """
        current = await self.user_repository.get_by_user_id(user_id)
        if not current:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        # Clinic isolation check
        if not current_user.is_superuser:
            if current.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        
        # CLIENT can only update themselves
        if current_user.role == UserRole.CLIENT and current_user.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Clients can only update their own profile",
            )
        
        # Prevent role change (privilege escalation)
        if request.role is not None and request.role != current.get("role"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot change user role",
            )
        
        payload = request.model_dump(exclude_none=True)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update.",
            )

        if payload.get("clinic_id"):
            clinic = await self.clinic_repository.get_by_clinic_id(payload["clinic_id"])
            if not clinic:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found.")

        if payload.get("email"):
            email_owner = await self.user_repository.get_by_email(payload["email"])
            if email_owner and email_owner.get("user_id") != user_id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists.")

        if payload.get("password"):
            payload["password"] = get_password_hash(payload["password"])

        if "role" in payload and hasattr(payload["role"], "value"):
            payload["role"] = payload["role"].value

        updated = await self.user_repository.update_user(user_id, payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        await broadcast("users:updated", {"id": user_id})
        return self._sanitize(updated)

    async def delete_user(self, user_id: str, current_user: TokenData) -> None:
        """
        Delete a user with authorization checks.
        
        - ADMIN can delete any user
        - OWNER can delete DOCTOR, STAFF, CLIENT in their clinic
        """
        user = await self.user_repository.get_by_user_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
        # Clinic isolation check
        if not current_user.is_superuser:
            if user.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
            
            # OWNER cannot delete higher-level users
            if not can_manage_user(current_user, user.get("role")):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Not authorized to delete {user.get('role')} users",
                )
        
        deleted = await self.user_repository.delete_user(user_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        await broadcast("users:deleted", {"id": user_id})

    async def get_user_password(self, user_id: str, current_user: TokenData) -> dict:
        """
        Show the current password for a user (regenerate it based on user data).

        - ADMIN can view any user's password
        - OWNER can view DOCTOR, STAFF, CLIENT passwords in their clinic
        - STAFF can view CLIENT passwords in their clinic

        Returns UserCreatedResponse with current password
        """
        user = await self.user_repository.get_by_user_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        # Clinic isolation check
        if not current_user.is_superuser:
            if user.get("clinic_id") != current_user.clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )

            # Determine if current user can view this user's password:
            # OWNER can manage DOCTOR/STAFF/CLIENT — same as can_manage_user
            # STAFF can only view CLIENT passwords (they create clients)
            target_role = user.get("role")
            if isinstance(target_role, str):
                try:
                    target_role = UserRole(target_role)
                except ValueError:
                    pass

            owner_can_view = can_manage_user(current_user, target_role)
            staff_can_view = (
                current_user.role == UserRole.STAFF
                and target_role == UserRole.CLIENT
            )

            if not owner_can_view and not staff_can_view:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Not authorized to view password for {target_role} users",
                )

        # Regenerate the same password based on user data (deterministic)
        clinic = (
            await self.clinic_repository.get_by_clinic_id(user.get("clinic_id"))
            if user.get("clinic_id")
            else {"clinicName": "clinic"}
        )
        clinic_name = clinic.get("clinicName", "clinic") if clinic else "clinic"

        password_value = self.credential_service.generate_password(
            user.get("fullname"), clinic_name, user_id
        )

        return self._sanitize_with_password(dict(user), password_value)
