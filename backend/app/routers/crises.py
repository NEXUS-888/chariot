from fastapi import APIRouter, Query
from typing import List
from ..db import conn
from ..schemas import CrisisOut

router = APIRouter(prefix="/crises", tags=["crises"])

@router.get("/", response_model=List[CrisisOut])
def list_crises(q: str | None = Query(default=None), category: str | None = None):
    with conn.cursor() as cur:
        sql = "SELECT id, title, category, description, severity, latitude, longitude, source_api FROM crises"
        params = []
        clauses = []
        if q:
            clauses.append("(title ILIKE %s OR description ILIKE %s)")
            params += [f"%{q}%", f"%{q}%"]
        if category:
            clauses.append("category = %s")
            params.append(category)
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        cur.execute(sql, params)
        rows = cur.fetchall()
    return [CrisisOut(**{
        'id': r[0], 'title': r[1], 'category': r[2], 'description': r[3],
        'severity': r[4], 'latitude': r[5], 'longitude': r[6], 'source_api': r[7]
    }) for r in rows]