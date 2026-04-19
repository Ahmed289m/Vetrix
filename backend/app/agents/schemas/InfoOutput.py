from pydantic import BaseModel
from typing import List

class Medication(BaseModel):
    drug_name: str
    dosage: str

class Visit(BaseModel):
    visit_notes: str
    date: str
    medications: List[Medication]

class InfoOutput(BaseModel):
    visits: List[Visit]