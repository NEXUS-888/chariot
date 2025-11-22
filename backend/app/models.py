"""
SQLAlchemy Database Models
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

# Create Base class for declarative models
Base = declarative_base()


class Crisis(Base):
    """Crisis/Disaster Model"""
    __tablename__ = "crises"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # Environment, Disaster, Conflict, Health, Hunger
    severity = Column(Integer, nullable=True)  # 1-10 scale
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    country_code = Column(String(2), nullable=True, index=True)  # ISO 2-letter code
    description = Column(Text, nullable=True)
    source = Column(String, nullable=True)  # reliefweb, usgs, openaq, openmeteo
    source_id = Column(String, nullable=True, unique=True)  # External API ID
    source_api = Column(String, nullable=True)  # Legacy field for compatibility
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    charities = relationship("Charity", back_populates="crisis", foreign_keys="Charity.related_crisis_id")


class Charity(Base):
    """Charity/NGO Model"""
    __tablename__ = "charities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    donation_url = Column(String, nullable=True)  # OpenCollective URL
    related_crisis_id = Column(Integer, ForeignKey("crises.id"), nullable=True, index=True)
    country_code = Column(String(2), nullable=True, index=True)  # ISO 2-letter code
    source = Column(String, nullable=True)  # everyorg, globalgiving, opencollective
    
    # Legacy field for backward compatibility
    crisis_id = Column(Integer, ForeignKey("crises.id"), nullable=True)

    # Relationship
    crisis = relationship("Crisis", back_populates="charities", foreign_keys=[related_crisis_id])