import os
import io
import math
import random
import datetime
import zipfile
from pathlib import Path

import psycopg2
import geopandas as gpd
from shapely.geometry import Point
from dotenv import load_dotenv
import requests

load_dotenv()

# --- DB connection ---
conn = psycopg2.connect(
    dbname=os.getenv("PGDATABASE", "globemap"),
    user=os.getenv("PGUSER", "postgres"),
    password=os.getenv("PGPASSWORD", "Vishal@2005"),
    host=os.getenv("PGHOST", "localhost"),
    port=os.getenv("PGPORT", "5432"),
)

# --- Land polygons (cached) ---
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
SHAPE_DIR = DATA_DIR / "ne_110m_land"
SHAPE_URL = "https://naciscdn.org/naturalearth/110m/physical/ne_110m_land.zip"

if not SHAPE_DIR.exists():
    print("🌍 Downloading land polygons...")
    r = requests.get(SHAPE_URL, timeout=60)
    r.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        z.extractall(SHAPE_DIR)
    print("✅ Land polygons downloaded.")

world = gpd.read_file(next(SHAPE_DIR.glob("*.shp")))
land_polygons = world.unary_union  # merge all land shapes

# --- Config ---
CATEGORIES = ["Disaster", "Conflict", "Climate", "Health", "Hunger"]
EVENTS = ["Cyclone", "Earthquake", "Wildfire", "Flood", "Drought", "Epidemic", "Storm", "Heatwave", "Landslide"]
DESCRIPTIONS = [
    "A major event impacting the local population.",
    "Severe crisis reported by multiple sources.",
    "Ongoing humanitarian emergency requiring support.",
    "Disaster relief operations in progress.",
    "Environmental crisis affecting nearby regions.",
]
MIN_DISTANCE_KM = 100.0            # no two crises closer than this
MAX_ATTEMPTS_PER_POINT = 15000     # attempts to find a valid land+far-enough point

# --- Helpers ---
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def load_existing_coords():
    with conn, conn.cursor() as cur:
        cur.execute("SELECT latitude, longitude FROM crises")
        return [(float(r[0]), float(r[1])) for r in cur.fetchall()]

def is_far_enough(lat: float, lon: float, existing: list[tuple[float,float]], min_km: float) -> bool:
    for elat, elon in existing:
        if haversine_km(lat, lon, elat, elon) < min_km:
            return False
    return True

def random_land_coordinate() -> tuple[float, float]:
    # avoid polar extremes for better performance
    lat = round(random.uniform(-60, 80), 4)
    lon = round(random.uniform(-170, 170), 4)
    return (lat, lon)

def pick_valid_coordinate(existing: list[tuple[float,float]], min_km: float) -> tuple[float, float] | None:
    for _ in range(MAX_ATTEMPTS_PER_POINT):
        lat, lon = random_land_coordinate()
        if not land_polygons.contains(Point(lon, lat)):
            continue
        if is_far_enough(lat, lon, existing, min_km):
            return (lat, lon)
    return None

def generate_random_crisis(existing_coords: list[tuple[float,float]]) -> tuple | None:
    title = f"{random.choice(EVENTS)} in Region {random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}"
    category = random.choice(CATEGORIES)
    description = random.choice(DESCRIPTIONS)
    severity = random.randint(1, 5)

    coord = pick_valid_coordinate(existing_coords, MIN_DISTANCE_KM)
    if coord is None:
        return None

    latitude, longitude = coord
    source_api = "random_seed"
    last_updated = datetime.datetime.now(datetime.timezone.utc)
    return (title, category, description, severity, latitude, longitude, source_api, last_updated)

def insert_random_crises(num_random: int = 10):
    existing = load_existing_coords()

    inserted = 0
    with conn:
        with conn.cursor() as cur:
            for _ in range(num_random):
                payload = generate_random_crisis(existing)
                if payload is None:
                    print(f"⚠️  Skipped: couldn’t find a land point ≥{MIN_DISTANCE_KM} km from others after many tries.")
                    continue
                cur.execute("""
                    INSERT INTO crises (title, category, description, severity, latitude, longitude, source_api, last_updated)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, payload)
                # update in-memory list so subsequent points avoid this one too
                existing.append((payload[4], payload[5]))
                inserted += 1
                print(f"✅ Added on-land crisis {inserted}: {payload[0]} at ({payload[4]}, {payload[5]})")

    print(f"🎉 Done. Inserted {inserted} new crises (min spacing {MIN_DISTANCE_KM} km).")

if __name__ == "__main__":
    # change the number below to add more/less per run
    insert_random_crises(num_random=10)
    conn.close()
