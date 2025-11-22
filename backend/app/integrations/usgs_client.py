# backend/app/integrations/usgs_client.py
"""
USGS Earthquake API Client
Fetches significant recent earthquakes (magnitude > 4.5)
"""
import httpx
from typing import List, Dict
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

USGS_API = "https://earthquake.usgs.gov/fdsnws/event/1/query"


async def fetch_usgs_earthquakes(min_magnitude: float = 4.5, days_back: int = 30) -> List[Dict]:
    """
    Fetch recent significant earthquakes from USGS
    
    Args:
        min_magnitude: Minimum earthquake magnitude
        days_back: Number of days to look back
        
    Returns:
        List of normalized crisis dictionaries
    """
    crises = []
    
    try:
        start_time = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        
        params = {
            "format": "geojson",
            "starttime": start_time,
            "minmagnitude": min_magnitude,
            "orderby": "magnitude",
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            logger.info(f"Fetching earthquakes from USGS (mag >= {min_magnitude})...")
            response = await client.get(USGS_API, params=params)
            response.raise_for_status()
            data = response.json()
            
            features = data.get("features", [])
            logger.info(f"✅ Retrieved {len(features)} earthquakes from USGS")
            
            for feature in features:
                props = feature.get("properties", {})
                coords = feature.get("geometry", {}).get("coordinates", [])
                
                if len(coords) >= 2:
                    lon, lat = coords[0], coords[1]
                    magnitude = props.get("mag", 0)
                    place = props.get("place", "Unknown Location")
                    
                    # Extract country code from place string if possible
                    country_code = _extract_country_from_place(place)
                    
                    # Calculate severity based on magnitude (scale to 1-10)
                    severity = min(int((magnitude - 4) * 2), 10)
                    
                    crisis = {
                        "title": f"Magnitude {magnitude} Earthquake - {place}",
                        "category": "Disaster",
                        "severity": severity,
                        "latitude": lat,
                        "longitude": lon,
                        "country_code": country_code,
                        "description": f"Earthquake with magnitude {magnitude} occurred near {place}",
                        "source": "usgs",
                        "source_id": feature.get("id"),
                    }
                    crises.append(crisis)
            
            logger.info(f"✅ Normalized {len(crises)} USGS earthquakes")
            
    except httpx.HTTPError as e:
        logger.error(f"❌ USGS API error: {e}")
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching USGS data: {e}")
    
    return crises


def _extract_country_from_place(place: str) -> str:
    """Extract country code from USGS place string"""
    # Simple mapping of common country names in USGS data
    country_mapping = {
        "Japan": "JP",
        "Indonesia": "ID",
        "Philippines": "PH",
        "Chile": "CL",
        "Mexico": "MX",
        "Turkey": "TR",
        "Iran": "IR",
        "Italy": "IT",
        "Greece": "GR",
        "New Zealand": "NZ",
        "Alaska": "US",
        "California": "US",
        "Nevada": "US",
    }
    
    for country, code in country_mapping.items():
        if country in place:
            return code
    
    return None
