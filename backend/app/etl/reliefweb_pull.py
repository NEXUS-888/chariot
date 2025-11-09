import requests, json, time
from ..db import conn

URL = "https://api.reliefweb.int/v1/disasters?profile=full&limit=10"

def run():
    data = requests.get(URL, timeout=30).json()
    with conn.cursor() as cur:
        for d in data.get('data', []):
            title = d['fields'].get('name')
            # ReliefWeb may not have lat/lon on disaster; for demo, skip without coords
            lat, lon = None, None
            if 'primary_country' in d['fields'] and 'location' in d['fields']['primary_country']:
                loc = d['fields']['primary_country']['location']
                lat, lon = loc.get('lat'), loc.get('lon')
            if lat is None or lon is None: continue
            cur.execute(
                """
                INSERT INTO crises(title, category, description, severity, latitude, longitude, source_api)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                (title, 'Disaster', None, 3, lat, lon, 'ReliefWeb')
            )
    conn.commit()

if __name__ == "__main__":
    run()