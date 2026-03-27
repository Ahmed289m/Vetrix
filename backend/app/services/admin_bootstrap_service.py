"""
Admin user bootstrap service for initializing the system with a global admin user.

This service is called on application startup to ensure a global admin exists.
"""

from uuid import uuid4

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.enums.user_role import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository


class AdminBootstrapService:
    """Service to bootstrap the admin user on application startup."""

    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def bootstrap_admin(self) -> dict | None:
        """
        Check if admin user exists, create if not.
        
        Returns:
            Admin user dict if created, None if already exists
            
        Raises:
            Exception: If admin creation fails
        """
        # Check if admin already exists
        admin = await self.user_repository.get_by_email(settings.admin_email)
        if admin:
            return None  # Admin already exists

        # Create new admin user
        user_id = f"user_{uuid4().hex[:12]}"

        admin_user = User(
            user_id=user_id,
            fullname="Admin",
            phone="0000000000",
            email=settings.admin_email,
            password=get_password_hash(settings.admin_password),
            role=UserRole.ADMIN,
            clinic_id=None,  # Global admin has no specific clinic
            is_active=True,
            is_superuser=True,  # Mark as global superuser
        )

        try:
            created = await self.user_repository.create_user(admin_user.model_dump())
            print(f"✓ Admin user created: {settings.admin_email}")
            return created
        except Exception as e:
            print(f"✗ Failed to create admin user: {str(e)}")
            raise
