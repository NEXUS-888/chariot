# backend/app/integrations/reliefweb_client.py
"""
ReliefWeb API Client
Fetches disaster data from ReliefWeb API
"""
import httpx
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

RELIEFWEB_API = "https://api.reliefweb.int/v1/disasters"


async def fetch_reliefweb_crises(limit: int = 50) -> List[Dict]:
    """
    Fetch recent disasters from ReliefWeb API
    
    Returns:
        List of normalized crisis dictionaries
    """
    crises = []
    
    try:
        params = {
            "appname": "chariot-app",
            "limit": limit,
            "preset": "latest",
            "fields[include]": [
                "name",
                "status",
                "type.name",
                "country.iso3",
                "country.name",
                "primary_country.iso3",
                "date.created",
            ],
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            logger.info(f"Fetching disasters from ReliefWeb (limit={limit})...")
            response = await client.get(RELIEFWEB_API, params=params)
            response.raise_for_status()
            data = response.json()
            
            disasters = data.get("data", [])
            logger.info(f"✅ Retrieved {len(disasters)} disasters from ReliefWeb")
            
            for item in disasters:
                fields = item.get("fields", {})
                name = fields.get("name", "Unknown Disaster")
                disaster_type = fields.get("type", [{}])[0].get("name", "Disaster")
                
                # Extract country info
                primary_country = fields.get("primary_country", {})
                country_iso3 = primary_country.get("iso3")
                country_name = primary_country.get("name", "Unknown")
                
                # Convert ISO3 to ISO2 (simple mapping for common countries)
                country_code = _iso3_to_iso2(country_iso3) if country_iso3 else None
                
                # Map disaster type to category
                category = _map_disaster_type_to_category(disaster_type)
                
                # Get coordinates (use country centroid as fallback)
                lat, lon = _get_country_coordinates(country_code)
                
                if lat and lon:
                    crisis = {
                        "title": name,
                        "category": category,
                        "severity": 5,  # Default severity for disasters
                        "latitude": lat,
                        "longitude": lon,
                        "country_code": country_code,
                        "description": f"{disaster_type} in {country_name}",
                        "source": "reliefweb",
                        "source_id": f"reliefweb_{item.get('id')}",
                    }
                    crises.append(crisis)
            
            logger.info(f"✅ Normalized {len(crises)} ReliefWeb crises")
            
    except httpx.HTTPError as e:
        logger.error(f"❌ ReliefWeb API error: {e}")
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching ReliefWeb data: {e}")
    
    return crises


def _map_disaster_type_to_category(disaster_type: str) -> str:
    """Map ReliefWeb disaster types to our categories"""
    disaster_type_lower = disaster_type.lower()
    
    if any(word in disaster_type_lower for word in ["flood", "earthquake", "tsunami", "cyclone", "hurricane", "storm"]):
        return "Disaster"
    elif any(word in disaster_type_lower for word in ["drought", "fire", "pollution"]):
        return "Climate"
    elif any(word in disaster_type_lower for word in ["epidemic", "pandemic", "disease"]):
        return "Health"
    elif any(word in disaster_type_lower for word in ["food", "famine"]):
        return "Hunger"
    elif any(word in disaster_type_lower for word in ["conflict", "war"]):
        return "Conflict"
    else:
        return "Disaster"


def _iso3_to_iso2(iso3: str) -> str:
    """Convert ISO3 country code to ISO2"""
    # Common mappings (extend as needed)
    mapping = {
        "USA": "US", "GBR": "GB", "CAN": "CA", "AUS": "AU", "DEU": "DE",
        "FRA": "FR", "ITA": "IT", "ESP": "ES", "JPN": "JP", "CHN": "CN",
        "IND": "IN", "BRA": "BR", "MEX": "MX", "RUS": "RU", "TUR": "TR",
        "ZAF": "ZA", "KOR": "KR", "IDN": "ID", "THA": "TH", "VNM": "VN",
        "PHL": "PH", "EGY": "EG", "NGA": "NG", "KEN": "KE", "ETH": "ET",
        "PAK": "PK", "BGD": "BD", "UKR": "UA", "POL": "PL", "ARG": "AR",
    }
    return mapping.get(iso3, iso3[:2] if iso3 else None)


def _get_country_coordinates(country_code: str) -> tuple:
    """Get approximate center coordinates for a country (centroid)"""
    # Country centroids (latitude, longitude)
    coordinates = {
        "US": (37.0902, -95.7129),
        "GB": (55.3781, -3.4360),
        "CA": (56.1304, -106.3468),
        "AU": (-25.2744, 133.7751),
        "DE": (51.1657, 10.4515),
        "FR": (46.2276, 2.2137),
        "IT": (41.8719, 12.5674),
        "ES": (40.4637, -3.7492),
        "JP": (36.2048, 138.2529),
        "CN": (35.8617, 104.1954),
        "IN": (20.5937, 78.9629),
        "BR": (-14.2350, -51.9253),
        "MX": (23.6345, -102.5528),
        "RU": (61.5240, 105.3188),
        "TR": (38.9637, 35.2433),
        "ZA": (-30.5595, 22.9375),
        "KR": (35.9078, 127.7669),
        "ID": (-0.7893, 113.9213),
        "TH": (15.8700, 100.9925),
        "VN": (14.0583, 108.2772),
        "PH": (12.8797, 121.7740),
        "EG": (26.8206, 30.8025),
        "NG": (9.0820, 8.6753),
        "KE": (-0.0236, 37.9062),
        "ET": (9.1450, 40.4897),
        "PK": (30.3753, 69.3451),
        "BD": (23.6850, 90.3563),
        "UA": (48.3794, 31.1656),
        "PL": (51.9194, 19.1451),
        "AR": (-38.4161, -63.6167),
    }
    return coordinates.get(country_code, (None, None))
