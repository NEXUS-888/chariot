from fastapi import APIRouter, Query
from typing import List
from ..db import conn
from ..schemas import CharityOut

router = APIRouter(prefix="/charities", tags=["charities"])

@router.get("/", response_model=List[CharityOut])
def list_charities(crisis_id: int | None = Query(default=None)):
    with conn.cursor() as cur:
        if crisis_id:
            cur.execute("SELECT id, name, description, website, logo_url, related_crisis_id, verified FROM charities WHERE related_crisis_id = %s", (crisis_id,))
        else:
            cur.execute("SELECT id, name, description, website, logo_url, related_crisis_id, verified FROM charities")
        rows = cur.fetchall()
    return [CharityOut(**{
        'id': r[0], 'name': r[1], 'description': r[2], 'website': r[3], 'logo_url': r[4],
        'related_crisis_id': r[5], 'verified': r[6]
    }) for r in rows]