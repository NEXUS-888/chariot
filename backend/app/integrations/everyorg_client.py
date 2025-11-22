# backend/app/integrations/everyorg_client.py
"""
Every.org API Client
Fetches charity data by country code
"""
import httpx
import os
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

EVERYORG_API = "https://partners.every.org/v0.2/search"


async def fetch_everyorg_charities(country_code: str, limit: int = 10) -> List[Dict]:
    """
    Fetch charities from Every.org for a specific country
    
    Args:
        country_code: ISO 2-letter country code (e.g., "US", "TR")
        limit: Maximum number of charities to fetch
        
    Returns:
        List of normalized charity dictionaries
    """
    charities = []
    api_key = os.getenv("EVERYORG_API_KEY")
    
    if not api_key:
        logger.warning("⚠️ EVERYORG_API_KEY not set, skipping Every.org integration")
        return charities
    
    try:
        params = {
            "apiKey": api_key,
            "query": f"disaster relief {country_code}",
            "take": limit,
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            logger.info(f"Fetching charities from Every.org for country: {country_code}")
            response = await client.get(EVERYORG_API, params=params)
            response.raise_for_status()
            data = response.json()
            
            nonprofits = data.get("nonprofits", [])
            logger.info(f"✅ Retrieved {len(nonprofits)} charities from Every.org for {country_code}")
            
            for org in nonprofits:
                charity = {
                    "name": org.get("name", "Unknown Organization"),
                    "description": org.get("description", org.get("mission", "")),
                    "website": org.get("websiteUrl"),
                    "logo_url": org.get("logoUrl"),
                    "donation_url": f"https://www.every.org/{org.get('slug', '')}",
                    "country_code": country_code,
                    "source": "everyorg",
                }
                charities.append(charity)
            
            logger.info(f"✅ Normalized {len(charities)} Every.org charities")
            
    except httpx.HTTPError as e:
        logger.error(f"❌ Every.org API error for {country_code}: {e}")
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching Every.org data: {e}")
    
    return charities
