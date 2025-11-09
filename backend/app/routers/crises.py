from fastapi import APIRouter, Query
from psycopg2.extras import RealDictCursor
from ..db import conn
from ..schemas import CrisisOut, PaginatedCrises

router = APIRouter(prefix="/crises", tags=["crises"])

@router.get("/", response_model=PaginatedCrises)
def list_crises(
    q: str | None = None,
    category: str | None = None,
    sort: str = Query(default="severity"),
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    # Only allow safe, known sort columns to prevent SQL injection
    allowed_sorts = {"severity", "last_updated", "id"}
    if sort not in allowed_sorts:
        sort = "severity"

    clauses: list[str] = []
    params: list[object] = []

    # Tokenized ILIKE search
    if q:
        for token in q.split():
            clauses.append("(title ILIKE %s OR description ILIKE %s)")
            params.extend([f"%{token}%", f"%{token}%"])

    if category:
        clauses.append("category = %s")
        params.append(category)

    where_sql = ("WHERE " + " AND ".join(clauses)) if clauses else ""

    # Always rollback if the connection is in an error state (extra safety)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"SELECT COUNT(*) AS count FROM crises {where_sql}", params)
            total = int(cur.fetchone()["count"])

            cur.execute(f"""
                SELECT id, title, category, description, severity,
                       latitude, longitude, source_api, last_updated
                FROM crises
                {where_sql}
                ORDER BY {sort} DESC
                LIMIT %s OFFSET %s
            """, params + [limit, offset])

            items = cur.fetchall()
    except Exception:
        # Reset failed transaction and bubble up a clean 500 with FastAPI’s handler
        conn.rollback()
        raise

    # `items` are already dicts compatible with CrisisOut; FastAPI will coerce them
    return {"total": total, "items": items}
