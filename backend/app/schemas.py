# backend/app/schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CrisisBase(BaseModel):
    title: str
    category: str
    severity: Optional[int] = None
    latitude: float
    longitude: float
    country_code: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    source_id: Optional[str] = None
    source_api: Optional[str] = None  # Legacy


class CrisisCreate(CrisisBase):
    pass


class Crisis(CrisisBase):
    id: int
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True
        # Support both old and new field names
        populate_by_name = True


# Alias for backward compatibility with routers
CrisisOut = Crisis


class CharityBase(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    donation_url: Optional[str] = None
    country_code: Optional[str] = None
    source: Optional[str] = None


class CharityCreate(CharityBase):
    related_crisis_id: Optional[int] = None
    crisis_id: Optional[int] = None  # Legacy


class Charity(CharityBase):
    id: int
    related_crisis_id: Optional[int] = None
    crisis_id: Optional[int] = None  # Legacy

    class Config:
        from_attributes = True


# Alias for backward compatibility with routers
CharityOut = Charity


class CrisisWithCharities(Crisis):
    charities: List[Charity] = []

    class Config:
        from_attributes = True


# Pagination response schemas
class PaginatedCrises(BaseModel):
    items: List[Crisis]
    total: int
    limit: int
    offset: int


class PaginatedCharities(BaseModel):
    items: List[Charity]
    total: int
