# Backend Refactoring Summary

## ✅ Completed Changes

### 1. **Dependencies** (`requirements.txt`)
Added async HTTP client and API integration libraries:
- `httpx` - Async HTTP client for external APIs
- `openmeteo-requests` - Weather data integration
- `requests-cache` - API response caching
- `retry-requests` - Retry logic for failed requests

### 2. **Database Models** (`app/models.py`)
**Enhanced Crisis Model:**
- Added `country_code` (ISO 2-letter) - Critical for linking charities
- Added `source` field - Track data source (reliefweb, usgs, etc.)
- Added `source_id` field - External API ID (unique constraint)
- Added `last_updated` timestamp with auto-update

**Enhanced Charity Model:**
- Added `related_crisis_id` - Foreign key to link charities to crises
- Added `country_code` - For country-specific charities
- Added `source` field - Track data source (everyorg, opencollective)
- Added `logo_url` and `donation_url` fields
- Kept `crisis_id` for backward compatibility

### 3. **Pydantic Schemas** (`app/schemas.py`)
Updated schemas to match new models with all new fields

### 4. **Integration Clients** (`app/integrations/`)
Created async API clients that return normalized data:

**Crisis Clients:**
- `reliefweb_client.py` - Fetches disasters from ReliefWeb API
  - Extracts country codes (ISO3 → ISO2 conversion)
  - Maps disaster types to categories
  - Uses country centroids for coordinates
  
- `usgs_client.py` - Fetches significant earthquakes (mag > 4.5)
  - Real coordinates from USGS
  - Severity scaled from magnitude
  - Country code extraction from location

**Charity Clients:**
- `everyorg_client.py` - Fetches charities by country code
  - Requires `EVERYORG_API_KEY` (optional)
  - Returns charities with donation URLs
  
- `opencollective_client.py` - Fetches global collectives
  - GraphQL API integration
  - Search by keywords (disaster, hunger, health, climate)
  - No API key required

### 5. **Smart ETL Seed Script** (`app/etl/seed.py`)
Comprehensive async orchestration:

**Features:**
- ✅ Concurrent API fetching with `asyncio.gather()`
- ✅ Error handling (one failure doesn't stop all)
- ✅ Smart charity-crisis linking by country code
- ✅ Duplicate prevention (source_id uniqueness)
- ✅ Rate limiting (sleep delays between requests)
- ✅ Comprehensive logging
- ✅ Database transaction safety

**Flow:**
1. Fetch crises from all sources concurrently
2. Extract unique country codes
3. Fetch charities for those countries
4. Link charities to crises in same country
5. Seed database with all data

### 6. **Environment Configuration** (`.env.example`)
Template for API keys:
- `EVERYORG_API_KEY` (optional)
- `GLOBALGIVING_API_KEY` (optional)
- ReliefWeb, USGS, OpenCollective don't need keys

## 🚀 How to Run

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your API keys (optional)

# Run the seed script
python -m app.etl.seed
```

## 📊 Expected Output

```
🚀 STARTING SMART ETL SEED PROCESS
================================================================================
🌍 FETCHING CRISES FROM ALL SOURCES
================================================================================
Fetching disasters from ReliefWeb (limit=30)...
✅ Retrieved 30 disasters from ReliefWeb
✅ Normalized 25 ReliefWeb crises
Fetching earthquakes from USGS (mag >= 4.5)...
✅ Retrieved 15 earthquakes from USGS
✅ Normalized 15 USGS earthquakes
✅ Total crises fetched: 40
================================================================================
💖 FETCHING CHARITIES
================================================================================
Fetching global charities from OpenCollective...
✅ Total normalized OpenCollective charities: 30
Fetching country-specific charities for 8 countries...
✅ Total charities fetched: 50
================================================================================
💾 SEEDING DATABASE
================================================================================
✅ Database tables created/verified
🗑️  Clearing existing data...
✅ Existing data cleared
📍 Inserting 40 crises...
✅ Inserted 40 unique crises
📍 Found 8 unique countries: {'US', 'JP', 'TR', 'MX', 'ID', 'PH', 'CL', 'IT'}
💖 Inserting 50 charities...
✅ Inserted 50 charities
================================================================================
📊 SEED SUMMARY
================================================================================
✅ Total Crises: 40
✅ Total Charities: 50
✅ Linked Charities: 35
✅ Global Charities: 15
================================================================================
✅ SEED PROCESS COMPLETED SUCCESSFULLY!
```

## 🔄 API Compatibility

All existing API endpoints remain compatible:
- `GET /crises/` - Works with new schema
- `GET /charities/` - Works with new schema
- `GET /charities/?crisis_id=X` - Returns linked charities

## 🎯 Key Benefits

1. **Single Source of Truth** - Backend owns all data
2. **Real-time Data** - Fresh data from multiple sources
3. **Smart Linking** - Charities automatically linked by country
4. **Scalable** - Easy to add new data sources
5. **Resilient** - Graceful handling of API failures
6. **Type Safe** - Full type hints throughout
7. **Async** - Non-blocking concurrent requests

## 📝 Notes

- ReliefWeb API doesn't require authentication
- USGS API is public and free
- OpenCollective GraphQL is public
- Every.org requires API key (get from https://www.every.org/developers)
- Country code matching ensures charities appear for relevant crises
- Global charities (no country_code) appear for all crises

## 🔧 Troubleshooting

If seed fails:
1. Check database connection (`DATABASE_URL` in .env)
2. Verify API keys if using Every.org
3. Check logs for specific API failures
4. APIs may be rate-limited - add more delays if needed
