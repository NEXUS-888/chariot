from dataclasses import dataclass

@dataclass
class Crisis:
    id: int
    title: str
    category: str
    description: str | None
    severity: int | None
    latitude: float
    longitude: float
    source_api: str | None

@dataclass
class Charity:
    id: int
    name: str
    description: str | None
    website: str | None
    logo_url: str | None
    related_crisis_id: int | None
    verified: bool