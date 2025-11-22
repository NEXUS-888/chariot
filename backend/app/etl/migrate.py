# backend/app/etl/migrate.py
"""
Database Migration Script
Adds new columns to existing tables without losing data
"""
from sqlalchemy import text
from app.db import SessionLocal, engine
from app.models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_database():
    """
    Add new columns to existing tables
    """
    db = SessionLocal()
    
    try:
        logger.info("Starting database migration...")
        
        # Add new columns to crises table if they don't exist
        crisis_migrations = [
            "ALTER TABLE crises ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);",
            "ALTER TABLE crises ADD COLUMN IF NOT EXISTS source VARCHAR;",
            "ALTER TABLE crises ADD COLUMN IF NOT EXISTS source_id VARCHAR UNIQUE;",
            "ALTER TABLE crises ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            "CREATE INDEX IF NOT EXISTS idx_crises_country_code ON crises(country_code);",
        ]
        
        for sql in crisis_migrations:
            try:
                db.execute(text(sql))
                db.commit()
                logger.info(f"✅ Executed: {sql}")
            except Exception as e:
                logger.warning(f"⚠️ Migration already applied or failed: {sql} - {e}")
                db.rollback()
        
        # Add new columns to charities table if they don't exist
        charity_migrations = [
            "ALTER TABLE charities ADD COLUMN IF NOT EXISTS crisis_id INTEGER REFERENCES crises(id);",
            "ALTER TABLE charities ADD COLUMN IF NOT EXISTS related_crisis_id INTEGER REFERENCES crises(id);",
            "ALTER TABLE charities ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);",
            "ALTER TABLE charities ADD COLUMN IF NOT EXISTS source VARCHAR;",
            "ALTER TABLE charities ADD COLUMN IF NOT EXISTS logo_url VARCHAR;",
            "ALTER TABLE charities ADD COLUMN IF NOT EXISTS donation_url VARCHAR;",
            "ALTER TABLE charities ADD COLUMN IF NOT EXISTS website VARCHAR;",
            "CREATE INDEX IF NOT EXISTS idx_charities_country_code ON charities(country_code);",
            "CREATE INDEX IF NOT EXISTS idx_charities_related_crisis ON charities(related_crisis_id);",
            "CREATE INDEX IF NOT EXISTS idx_charities_crisis ON charities(crisis_id);",
        ]
        
        for sql in charity_migrations:
            try:
                db.execute(text(sql))
                db.commit()
                logger.info(f"✅ Executed: {sql}")
            except Exception as e:
                logger.warning(f"⚠️ Migration already applied or failed: {sql} - {e}")
                db.rollback()
        
        # Update last_updated for existing records
        try:
            db.execute(text("UPDATE crises SET last_updated = CURRENT_TIMESTAMP WHERE last_updated IS NULL;"))
            db.commit()
            logger.info("✅ Updated last_updated timestamps")
        except Exception as e:
            logger.warning(f"⚠️ Could not update timestamps: {e}")
            db.rollback()
        
        logger.info("✅ Database migration completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_database()
