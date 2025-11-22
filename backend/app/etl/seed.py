"""
Smart ETL Seed Script
Fetches data from multiple external APIs and seeds the database
"""
import asyncio
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Set

from app.db import SessionLocal, engine
from app.models import Base, Crisis, Charity
from app.integrations.reliefweb_client import fetch_reliefweb_crises
from app.integrations.usgs_client import fetch_usgs_earthquakes
from app.integrations.everyorg_client import fetch_everyorg_charities
from app.integrations.opencollective_client import fetch_opencollective_charities

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def fetch_all_crises() -> List[Dict]:
    """
    Fetch crises from all external APIs concurrently
    
    Returns:
        Combined list of normalized crisis dictionaries
    """
    logger.info("=" * 80)
    logger.info("🌍 FETCHING CRISES FROM ALL SOURCES")
    logger.info("=" * 80)
    
    # Run all crisis clients concurrently
    results = await asyncio.gather(
        fetch_reliefweb_crises(limit=30),
        fetch_usgs_earthquakes(min_magnitude=4.5, days_back=30),
        return_exceptions=True  # Don't let one failure stop all
    )
    
    all_crises = []
    
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"❌ Crisis source {i} failed: {result}")
        else:
            all_crises.extend(result)
    
    logger.info(f"✅ Total crises fetched: {len(all_crises)}")
    return all_crises


async def fetch_charities_by_countries(country_codes: Set[str]) -> List[Dict]:
    """
    Fetch charities for specific countries + global charities
    
    Args:
        country_codes: Set of ISO 2-letter country codes
        
    Returns:
        List of normalized charity dictionaries
    """
    logger.info("=" * 80)
    logger.info("💖 FETCHING CHARITIES")
    logger.info("=" * 80)
    
    all_charities = []
    
    # 1. Fetch global charities from OpenCollective
    logger.info("Fetching global charities from OpenCollective...")
    opencollective_charities = await fetch_opencollective_charities(
        keywords=["disaster relief", "humanitarian", "crisis response"],
        limit=10
    )
    all_charities.extend(opencollective_charities)
    
    # 2. Fetch country-specific charities from Every.org
    logger.info(f"Fetching country-specific charities for {len(country_codes)} countries...")
    
    # Limit to avoid rate limiting
    limited_countries = list(country_codes)[:10]
    
    tasks = []
    for country_code in limited_countries:
        if country_code:  # Skip None values
            tasks.append(fetch_everyorg_charities(country_code, limit=5))
            # Small delay between requests
            await asyncio.sleep(0.3)
    
    if tasks:
        country_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in country_results:
            if isinstance(result, Exception):
                logger.error(f"❌ Failed to fetch charities: {result}")
            else:
                all_charities.extend(result)
    
    logger.info(f"✅ Total charities fetched: {len(all_charities)}")
    return all_charities


def seed_database(crises_data: List[Dict], charities_data: List[Dict]):
    """
    Seed the database with crises and charities
    
    Args:
        crises_data: List of crisis dictionaries
        charities_data: List of charity dictionaries
    """
    logger.info("=" * 80)
    logger.info("💾 SEEDING DATABASE")
    logger.info("=" * 80)
    
    db: Session = SessionLocal()
    
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified")
        
        # Optional: Clear existing data (comment out to keep existing data)
        logger.info("🗑️  Clearing existing data...")
        db.query(Charity).delete()
        db.query(Crisis).delete()
        db.commit()
        logger.info("✅ Existing data cleared")
        
        # Insert crises
        logger.info(f"📍 Inserting {len(crises_data)} crises...")
        crisis_map = {}  # Map source_id to Crisis object
        
        for crisis_dict in crises_data:
            # Check for duplicates by source_id
            source_id = crisis_dict.get("source_id")
            
            if source_id and db.query(Crisis).filter(Crisis.source_id == source_id).first():
                logger.debug(f"Skipping duplicate crisis: {source_id}")
                continue
            
            crisis = Crisis(**crisis_dict)
            db.add(crisis)
            db.flush()  # Get the ID without committing
            
            if source_id:
                crisis_map[source_id] = crisis
        
        db.commit()
        logger.info(f"✅ Inserted {len(crisis_map)} unique crises")
        
        # Get all country codes from inserted crises
        country_codes = set()
        for crisis in db.query(Crisis).all():
            if crisis.country_code:
                country_codes.add(crisis.country_code)
        
        logger.info(f"📍 Found {len(country_codes)} unique countries: {country_codes}")
        
        # Insert charities and link to crises
        logger.info(f"💖 Inserting {len(charities_data)} charities...")
        charity_count = 0
        
        for charity_dict in charities_data:
            country_code = charity_dict.get("country_code")
            
            # Try to link charity to a crisis in the same country
            related_crisis = None
            if country_code:
                related_crisis = db.query(Crisis).filter(
                    Crisis.country_code == country_code
                ).first()
            
            charity = Charity(
                **charity_dict,
                related_crisis_id=related_crisis.id if related_crisis else None,
                crisis_id=related_crisis.id if related_crisis else None,  # Legacy field
            )
            db.add(charity)
            charity_count += 1
        
        db.commit()
        logger.info(f"✅ Inserted {charity_count} charities")
        
        # Summary
        logger.info("=" * 80)
        logger.info("📊 SEED SUMMARY")
        logger.info("=" * 80)
        total_crises = db.query(Crisis).count()
        total_charities = db.query(Charity).count()
        linked_charities = db.query(Charity).filter(Charity.related_crisis_id.isnot(None)).count()
        
        logger.info(f"✅ Total Crises: {total_crises}")
        logger.info(f"✅ Total Charities: {total_charities}")
        logger.info(f"✅ Linked Charities: {linked_charities}")
        logger.info(f"✅ Global Charities: {total_charities - linked_charities}")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"❌ Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


async def main():
    """
    Main async entry point
    """
    logger.info("🚀 STARTING SMART ETL SEED PROCESS")
    
    try:
        # Step 1: Fetch all crises
        crises_data = await fetch_all_crises()
        
        # Step 2: Extract unique country codes
        country_codes = {c.get("country_code") for c in crises_data if c.get("country_code")}
        logger.info(f"📍 Unique countries in crises: {country_codes}")
        
        # Step 3: Fetch charities for those countries
        charities_data = await fetch_charities_by_countries(country_codes)
        
        # Step 4: Seed the database
        seed_database(crises_data, charities_data)
        
        logger.info("✅ SEED PROCESS COMPLETED SUCCESSFULLY!")
        
    except Exception as e:
        logger.error(f"❌ Seed process failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
