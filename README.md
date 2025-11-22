# Global Problems Map

An interactive web application that displays global crises on a world map with filtering, search, and donation capabilities. Built as a weekend prototype using FastAPI, React, and MapLibre.

## Features

- 🗺️ Interactive world map with crisis markers
- 🔍 Real-time search and category filtering
- 📋 Crisis details with related charity information
- 💳 Direct donation integration with OpenCollective
- � Google OAuth authentication
- �📱 Responsive design with glassmorphism UI

## Tech Stack

**Backend:**
- FastAPI (Python)
- PostgreSQL database
- Pydantic for data validation
- psycopg2 for database connections

**Frontend:**
- React + TypeScript
- Vite build tool
- Tailwind CSS for styling
- MapLibre GL JS for mapping
- MapTiler for map tiles

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+

### 1. Database Setup

```bash
# Start PostgreSQL service
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Create database
createdb globemap

# Run schema and seed data
psql -d globemap -f database_schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
# Create .env file with your MapTiler API key:
echo "VITE_MAPTILER_KEY=your_maptiler_key_here" > .env.local

# Start development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## API Endpoints

- `GET /health` - Health check
- `GET /crises/` - List crises with optional search and filtering
  - Query parameters: `q` (search), `category` (filter)
- `GET /charities/` - List charities with optional crisis filtering
  - Query parameters: `crisis_id` (filter by crisis)

## Optional: Docker Setup

```bash
# Start PostgreSQL and API with Docker
docker-compose up -d

# Seed the database
cd backend && python -m app.etl.seed
```

## Development

### Database Seeding

The backend is now the **Single Source of Truth**. It fetches data from multiple external APIs and normalizes it.

```bash
# Install new dependencies
cd backend
pip install -r requirements.txt

# Set up API keys (optional - some APIs work without keys)
cp .env.example .env
# Edit .env and add your API keys:
# - EVERYORG_API_KEY (optional)
# - GLOBALGIVING_API_KEY (optional)

# Run the smart ETL seed script
python -m app.etl.seed
```

**Data Sources:**
- **Crises**: ReliefWeb API, USGS Earthquakes
- **Charities**: Every.org, OpenCollective
- All data is normalized and linked by country code

**Note:** If you see "No charities found" when clicking on crises, you need to populate the charities table. You can either:

1. **Manually add charities via SQL:**
```sql
-- Example: Add a charity for crisis_id 18
INSERT INTO charities (name, description, donation_url, crisis_id) 
VALUES (
  'Red Cross',
  'International humanitarian organization',
  'https://opencollective.com/redcross',
  18
);
```

2. **Check your database:**
```bash
# Connect to your database
psql -d globemap

# Check if charities exist
SELECT * FROM charities;

# Check crisis-charity relationships
SELECT c.id, c.title, ch.name, ch.donation_url 
FROM crises c 
LEFT JOIN charities ch ON ch.crisis_id = c.id 
LIMIT 10;
```

### Map Configuration

The application requires a MapTiler API key for map tiles:

1. Sign up at [MapTiler](https://www.maptiler.com/)
2. Get your API key
3. Add it to `frontend/.env.local`: `VITE_MAPTILER_KEY=your_key_here`

### Google OAuth Setup

For authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID
3. Add authorized origins: `http://localhost:5173`
4. Add to `frontend/.env.local`: `VITE_GOOGLE_CLIENT_ID=your_client_id`

### OpenCollective Integration

Donations are routed through OpenCollective:

- Charities in the database should have `donation_url` pointing to their OpenCollective page
- Format: `https://opencollective.com/[collective-slug]`
- The app displays the "Donate Now" button when charities are available for a crisis

## Project Structure

```
chariot/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── db.py           # Database connection
│   │   ├── models.py       # Data models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── routers/        # API route handlers
│   │   └── etl/           # Data import scripts
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   └── lib/          # Utility functions
├── database_schema.sql    # Database schema
└── docker-compose.yml     # Docker configuration
```

## License

MIT License - see LICENSE file for details.