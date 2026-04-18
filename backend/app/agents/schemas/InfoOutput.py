from pydantic import BaseModel
from typing import List

class Visit(BaseModel):
    notes: str
    medications: str
    date: str

class InfoOutput(BaseModel):
    visits: List[Visit]