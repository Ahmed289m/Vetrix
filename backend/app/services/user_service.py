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

    async def create_user(self, request: UserCreate, current_user: TokenData) -> dict:
        """
        Create a new user with authorization checks.
        
        - ADMIN can create users in any clinic
        - OWNER can create DOCTOR, STAFF, CLIENT in their clinic (not OWNER)
        - Target role cannot be higher than creator
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
        if not can_manage_user(current_user, target_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not authorized to create user with role {target_role}",
            )
        
        user_id = f"user_{uuid4().hex[:12]}"
        if await self.user_repository.get_by_user_id(user_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User id already exists.")

        clinic_name = clinic.get("clinicName", "clinic")
        email_value = self.credential_service.get_or_set_email(
            request.email, request.fullname, request.role, clinic_name
        )
        password_value = self.credential_service.get_or_set_password(
            request.password, request.fullname, clinic_name, user_id
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
        return self._sanitize(created)

    async def list_users(self, current_user: TokenData) -> list[dict]:
        """
        List users based on current user's role.
        
        - ADMIN sees all users
        - OWNER/STAFF/DOCTOR see only users in their clinic
        """
        if current_user.is_superuser:
            users = await self.user_repository.list_users()
        else:
            # Filter by clinic
            if not current_user.clinic_id:
                return []
            users = await self.user_repository.list_users_by_clinic(current_user.clinic_id)
        
        return [self._sanitize(user) for user in users]

    async def get_user(self, user_id: str, current_user: TokenData) -> dict:
        """
        Get a user with clinic isolation check.
        
        - ADMIN can read any user
        - Others can read users in their clinic
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
