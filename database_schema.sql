-- Global Problems Map Database Schema
-- Create database and tables for the prototype

-- Create database (run this manually)
-- CREATE DATABASE globemap;
-- \c globemap

-- Crises table
CREATE TABLE crises (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  severity INTEGER CHECK (severity >= 1 AND severity <= 5),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  source_api TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Charities table
CREATE TABLE charities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  related_crisis_id INTEGER REFERENCES crises(id) ON DELETE SET NULL,
  verified BOOLEAN DEFAULT false
);

-- Seed data for testing
INSERT INTO crises (title, category, description, severity, latitude, longitude, source_api)
VALUES
 ('Flooding in City A', 'Disaster', 'Severe floods affecting population.', 4, 28.6139, 77.2090, 'seed'),
 ('Drought in Region B', 'Climate', 'Extended drought impacting crops.', 3, -1.2864, 36.8172, 'seed');

INSERT INTO charities (name, description, website, logo_url, related_crisis_id, verified)
VALUES
 ('Relief Group Alpha', 'Provides emergency food & shelter.', 'https://example.org', NULL, 1, true),
 ('Water Aid Beta', 'Drought relief & water access.', 'https://example.org', NULL, 2, true);