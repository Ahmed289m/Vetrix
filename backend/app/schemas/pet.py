from pydantic import BaseModel, ConfigDict

from app.models.enums.pet_type import PetType


class PetCreate(BaseModel):
    name: str
    weight: float
    type: PetType
    client_id: str
    clinic_id: str


class PetUpdate(BaseModel):
    name: str | None = None
    weight: float | None = None
    type: PetType | None = None
    client_id: str | None = None
    clinic_id: str | None = None


class PetResponse(BaseModel):
    pet_id: str
    name: str
    weight: float
    type: PetType
    client_id: str
    clinic_id: str

    model_config = ConfigDict(from_attributes=True)
