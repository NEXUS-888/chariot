from pydantic import BaseModel
from typing import Optional

class CrisisOut(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str]
    severity: Optional[int]
    latitude: float
    longitude: float
    source_api: Optional[str]

class CharityOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    website: Optional[str]
    logo_url: Optional[str]
    related_crisis_id: Optional[int]
    verified: bool