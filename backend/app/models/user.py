from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums.user_role import UserRole


class User(BaseModel):
    user_id: str | None = Field(default=None, alias="_id")
    fullname: str
    phone: str
    email: EmailStr
    password: str
    role: UserRole
    clinic_id: str

    model_config = ConfigDict(from_attributes=True, use_enum_values=True, populate_by_name=True)


class Doctor(User):
    doctor_id: str


class Staff(User):
    staff_id: str


class Client(User):
    client_id: str


class Owner(User):
    owner_id: str
