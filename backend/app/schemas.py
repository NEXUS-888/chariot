# backend/app/schemas.py
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class CrisisOut(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str] = None
    severity: Optional[int] = None
    latitude: float
    longitude: float
    source_api: Optional[str] = None
    last_updated: Optional[datetime] = None # ISO string from Postgres

class CharityOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    related_crisis_id: Optional[int] = None
    verified: bool

class PaginatedCrises(BaseModel):
    total: int
    items: List[CrisisOut]
