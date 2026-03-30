from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums.user_role import UserRole


class UserCreate(BaseModel):
    """Create user without email/password - they will be auto-generated"""
    fullname: str
    phone: str
    clinic_id: str | None = None  # Optional for ADMIN, required for others
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    user_id: str
    fullname: str
    phone: str
    email: str
    role: UserRole
    clinic_id: str | None = None
    is_active: bool
    is_superuser: bool

    model_config = ConfigDict(from_attributes=True)


class UserCreatedResponse(UserResponse):
    """Response when creating a new user - includes generated credentials"""
    password: str  # Generated password - shown only on creation


class UserUpdate(BaseModel):
    fullname: str | None = None
    phone: str | None = None
    role: UserRole | None = None
    clinic_id: str | None = None  # Can be updated for other users, but not self
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    is_active: bool | None = None  # Only admins can change this

    model_config = ConfigDict(from_attributes=True)


class DoctorResponse(UserResponse):
    doctor_id: str


class StaffResponse(UserResponse):
    staff_id: str


class ClientResponse(UserResponse):
    client_id: str


class OwnerResponse(UserResponse):
    owner_id: str


class CreateUserResponse(BaseModel):
    """Response wrapper for successful user creation"""
    success: bool
    message: str
    data: UserCreatedResponse

    model_config = ConfigDict(from_attributes=True)
