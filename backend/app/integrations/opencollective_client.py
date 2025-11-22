# backend/app/integrations/opencollective_client.py
"""
OpenCollective API Client
Fetches public collectives (charities) by keyword search
"""
import httpx
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

OPENCOLLECTIVE_GRAPHQL = "https://api.opencollective.com/graphql/v2"


async def fetch_opencollective_charities(keywords: List[str] = None, limit: int = 20) -> List[Dict]:
    """
    Fetch public collectives from OpenCollective
    
    Args:
        keywords: List of search keywords (e.g., ["disaster", "hunger", "health"])
        limit: Maximum number of charities per keyword
        
    Returns:
        List of normalized charity dictionaries
    """
    charities = []
    
    if keywords is None:
        keywords = ["disaster relief", "hunger", "health", "climate"]
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for keyword in keywords:
                logger.info(f"Searching OpenCollective for: {keyword}")
                
                # GraphQL query
                query = """
                query($searchTerm: String!, $limit: Int!) {
                  search(searchTerm: $searchTerm, limit: $limit, types: [COLLECTIVE]) {
                    collectives {
                      name
                      slug
                      description
                      website
                      imageUrl
                    }
                  }
                }
                """
                
                variables = {
                    "searchTerm": keyword,
                    "limit": limit,
                }
                
                response = await client.post(
                    OPENCOLLECTIVE_GRAPHQL,
                    json={"query": query, "variables": variables}
                )
                response.raise_for_status()
                data = response.json()
                
                collectives = data.get("data", {}).get("search", {}).get("collectives", [])
                logger.info(f"✅ Retrieved {len(collectives)} collectives for '{keyword}'")
                
                for collective in collectives:
                    charity = {
                        "name": collective.get("name", "Unknown Collective"),
                        "description": collective.get("description", ""),
                        "website": collective.get("website"),
                        "logo_url": collective.get("imageUrl"),
                        "donation_url": f"https://opencollective.com/{collective.get('slug', '')}",
                        "country_code": None,  # OpenCollective doesn't provide country in search
                        "source": "opencollective",
                    }
                    charities.append(charity)
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.5)
            
            logger.info(f"✅ Total normalized OpenCollective charities: {len(charities)}")
            
    except httpx.HTTPError as e:
        logger.error(f"❌ OpenCollective API error: {e}")
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching OpenCollective data: {e}")
    
    return charities


import asyncio
