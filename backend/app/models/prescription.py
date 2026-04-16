from pydantic import BaseModel, ConfigDict, Field


class Prescription(BaseModel):
    prescription_id: str | None = Field(default=None, alias="_id")
    clinic_id: str
    client_id: str
    pet_id: str
    prescriptionItem_ids: list[str]

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
