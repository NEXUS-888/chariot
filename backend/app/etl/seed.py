import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv("PGDATABASE", "globemap"),
    user=os.getenv("PGUSER", "postgres"),
    password=os.getenv("PGPASSWORD", "Vishal@2005"),  # <- your password
    host=os.getenv("PGHOST", "localhost"),
    port=os.getenv("PGPORT", "5432"),
)

# NOTE:
# Table schema is (latitude, longitude) — but MapLibre needs [longitude, latitude] when plotting.
# We will store as (lat, lon) in DB and the frontend uses setLngLat([it.longitude, it.latitude]) — correct.

CRISES = [
    # title, category, description, severity, latitude, longitude, source_api
    ("Flood Response NYC",        "Disaster", "Urban flooding affecting boroughs.",                      4,  40.7128,  -74.0060,  "seed"),
    ("Heatwave London",           "Health",   "High temperatures impacting vulnerable groups.",          3,  51.5074,   -0.1278,  "seed"),
    ("Earthquake Tokyo",          "Disaster", "Strong quake recorded; infrastructure checks ongoing.",   5,  35.6762,  139.6503,  "seed"),
    ("Bushfire Sydney",           "Disaster", "Large-scale bushfires near suburbs.",                     5, -33.8688,  151.2093,  "seed"),
    ("Drought Nairobi",           "Climate",  "Prolonged drought affecting water supply.",              4,  -1.2864,   36.8172,  "seed"),
    ("Food Insecurity São Paulo","Hunger",   "Supply chain disruption driving shortages.",              3, -23.5505,  -46.6333,  "seed"),
    ("Health Crisis Cairo",      "Health",   "Hospital capacity under stress.",                         3,  30.0444,   31.2357,  "seed"),
    ("Monsoon Impact Mumbai",    "Disaster", "Monsoon flooding in low-lying areas.",                    4,  19.0760,   72.8777,  "seed"),
    ("Landslide Vancouver",      "Disaster", "Heavy rains triggering slope failures.",                  4,  49.2827, -123.1207,  "seed"),
    ("Power Outage Johannesburg","Conflict", "Grid instability causing rolling blackouts.",              2, -26.2041,   28.0473,  "seed"),
]

CHARITIES = [
    # (name, description, website) — we'll link each to a crisis after inserts
    ("Relief Alliance",     "Rapid response & shelter kits.",           "https://example.org/relief"),
    ("Food For All",        "Emergency food distribution.",              "https://example.org/food"),
    ("Health Access Fund",  "Mobile clinics & meds.",                    "https://example.org/health"),
]

def reset_and_seed():
    with conn:
        with conn.cursor() as cur:
            # 1) wipe existing data and reset ids
            cur.execute("TRUNCATE TABLE charities, crises RESTART IDENTITY CASCADE;")

            # 2) insert crises and collect their ids
            crisis_ids = []
            for c in CRISES:
                cur.execute(
                    """
                    INSERT INTO crises
                    (title, category, description, severity, latitude, longitude, source_api)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                    RETURNING id;
                    """,
                    c,
                )
                crisis_ids.append(cur.fetchone()[0])

            # 3) attach a couple of charities to each crisis (round-robin)
            for i, crisis_id in enumerate(crisis_ids):
                name, desc, site = CHARITIES[i % len(CHARITIES)]
                cur.execute(
                    """
                    INSERT INTO charities
                    (name, description, website, logo_url, related_crisis_id, verified)
                    VALUES (%s,%s,%s,NULL,%s,TRUE)
                    """,
                    (name, desc, site, crisis_id),
                )
                # add a second one for richer UI
                name2, desc2, site2 = CHARITIES[(i + 1) % len(CHARITIES)]
                cur.execute(
                    """
                    INSERT INTO charities
                    (name, description, website, logo_url, related_crisis_id, verified)
                    VALUES (%s,%s,%s,NULL,%s,TRUE)
                    """,
                    (name2, desc2, site2, crisis_id),
                )

if __name__ == "__main__":
    reset_and_seed()
    print("✅ Reset complete and seeded 10 widely spaced on-land locations.")
    conn.close()
