# backend/app/etl/check_data.py
"""
Quick script to check if data exists in database
"""
from app.db import SessionLocal
from app.models import Crisis, Charity
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_database():
    """
    Check what data exists in the database
    """
    db = SessionLocal()
    
    try:
        # Count crises
        crisis_count = db.query(Crisis).count()
        logger.info(f"📊 Total Crises in DB: {crisis_count}")
        
        # Show first 5 crises
        crises = db.query(Crisis).limit(5).all()
        logger.info("📍 Sample Crises:")
        for crisis in crises:
            logger.info(f"  - ID: {crisis.id}, Title: {crisis.title}, Lat: {crisis.latitude}, Lon: {crisis.longitude}")
        
        # Count charities
        charity_count = db.query(Charity).count()
        logger.info(f"💖 Total Charities in DB: {charity_count}")
        
        # Show first 5 charities
        charities = db.query(Charity).limit(5).all()
        logger.info("💖 Sample Charities:")
        for charity in charities:
            logger.info(f"  - ID: {charity.id}, Name: {charity.name}, Donation URL: {getattr(charity, 'donation_url', 'N/A')}")
        
        # Check for charities with donation URLs
        charities_with_urls = db.query(Charity).filter(Charity.donation_url.isnot(None)).count()
        logger.info(f"💳 Charities with Donation URLs: {charities_with_urls}")
        
        if crisis_count == 0:
            logger.warning("⚠️ No crises found! Run: python -m app.etl.seed")
        
        if charity_count == 0:
            logger.warning("⚠️ No charities found! Run: python -m app.etl.seed")
            
    except Exception as e:
        logger.error(f"❌ Error checking database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    check_database()
