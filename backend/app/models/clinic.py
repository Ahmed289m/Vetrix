from pydantic import BaseModel, ConfigDict, Field


class Clinic(BaseModel):
    clinic_id: str | None = Field(default=None, alias="_id")
    clinicName: str
    address: str
    phone: str
    subscriptionStatus: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
