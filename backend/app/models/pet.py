from pydantic import BaseModel, ConfigDict, Field

from app.models.enums.pet_type import PetType


class Pet(BaseModel):
    pet_id: str | None = Field(default=None, alias="_id")
    name: str
    weight: float
    type: PetType
    client_id: str
    clinic_id: str

    model_config = ConfigDict(from_attributes=True, use_enum_values=True, populate_by_name=True)
