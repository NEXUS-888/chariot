"""
Seed data script for Global Problems Map
Run this script to populate the database with initial crisis and charity data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.db import conn

def seed_data():
    """Seed the database with initial crisis and charity data"""

    with conn.cursor() as cur:
        # Clear existing data
        cur.execute("DELETE FROM charities")
        cur.execute("DELETE FROM crises")

        # Insert crisis data
        crisis_data = [
            ('Flooding in City A', 'Disaster', 'Severe floods affecting population.', 4, 28.6139, 77.2090, 'seed'),
            ('Drought in Region B', 'Climate', 'Extended drought impacting crops.', 3, -1.2864, 36.8172, 'seed')
        ]

        cur.executemany(
            """
            INSERT INTO crises(title, category, description, severity, latitude, longitude, source_api)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            crisis_data
        )

        # Insert charity data
        charity_data = [
            ('Relief Group Alpha', 'Provides emergency food & shelter.', 'https://example.org', None, 1, True),
            ('Water Aid Beta', 'Drought relief & water access.', 'https://example.org', None, 2, True)
        ]

        cur.executemany(
            """
            INSERT INTO charities(name, description, website, logo_url, related_crisis_id, verified)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            charity_data
        )

    conn.commit()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data()