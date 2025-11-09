# backend/app/routers/charities.py
from fastapi import APIRouter, Query
from typing import List
from psycopg2.extras import RealDictCursor
from ..db import conn
from ..schemas import CharityOut

router = APIRouter(prefix="/charities", tags=["charities"])

@router.get("/", response_model=List[CharityOut])
def list_charities(crisis_id: int | None = Query(default=None)):
    sql = """
      SELECT id, name, description, website, logo_url, related_crisis_id, verified
      FROM charities
    """
    params = []
    if crisis_id:
        sql += " WHERE related_crisis_id = %s"
        params.append(crisis_id)

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()
    return rows
