# Locale - Location Evaluation App

Real-world implementation with Google Places API and Open-Meteo climate data.

## Architecture

```
locale_backend.py       - Core location evaluation logic
api_server.py           - Flask REST API server (port 5001)
locale-app/src/App.js   - React UI (create-react-app, port 3000)
```

## Setup

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Places API (New)
   - Geocoding API
   - Maps JavaScript API
4. Create credentials → API Key
5. (Optional) Restrict key to your IP/domain

### 2. Backend Setup

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file with your API key
cat > .env << EOF
GOOGLE_MAPS_API_KEY=your_api_key_here
EOF

# Start the API server
python3 api_server.py
```

Server runs on `http://localhost:5001`

**Note:** The `.env` file is already in `.gitignore` to keep your API key secure.

**Endpoints:**
- `GET /api/health` - Health check
- `GET /api/criteria` - Get available criteria
- `GET /api/config` - Returns Maps API key for frontend map
- `POST /api/evaluate` - Evaluate location

### 3. Frontend Setup

```bash
cd locale-app
npm install
npm start
```

Frontend runs on `http://localhost:3000` and proxies API calls to port 5001.

### 4. Quick Start (Recommended)

Use the included utility scripts to start/stop both servers at once:

```bash
./start_locale   # Starts Flask (5001) + React (3000) in background
./stop_locale    # Stops both servers
```

**Debugging** — logs are written to:
```bash
tail -f /tmp/locale_api.log    # Watch API logs
tail -f /tmp/locale_react.log  # Watch React logs
```

## API Usage Examples

### Evaluate a location
```bash
curl -X POST http://localhost:5001/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Austin, TX",
    "radius_miles": 3,
    "criteria": ["grocery_stores", "restaurants", "coffee_shops"]
  }'
```

### Get available criteria
```bash
curl http://localhost:5001/api/criteria
```

## Available Criteria

- `grocery_stores` - Supermarkets, grocery stores
- `restaurants` - Restaurants (rating filter adjustable in UI, default 3+)
- `coffee_shops` - Cafes, coffee shops
- `bars` - Bars and lounges
- `breweries` - Breweries, craft beer
- `hotels` - Hotels and lodging
- `home_improvement` - Home improvement stores (Lowe's, Home Depot)
- `gyms` - Fitness centers, gyms
- `parks` - Parks, recreational areas
- `schools` - Schools (all levels)
- `hospitals` - Hospitals, medical centers
- `gas_stations` - Gas stations

## Data Sources

- **Google Places API (New)** - POI counts and details within radius
- **Google Geocoding API** - Address → coordinates
- **Google Maps JavaScript API** - Interactive map with amenity markers
- **Open-Meteo** - Historical climate data (free, no key needed)

## API Costs

**Google Maps Platform** — first $200/month free:
- Geocoding: $5 per 1000 requests
- Places Nearby Search: $32 per 1000 requests
- Maps JavaScript API: $7 per 1000 loads

**Estimated cost per evaluation:**
- 1 geocode + ~12 place searches = ~$0.38
- With $200 free credit ≈ 525 free evaluations/month

**Monitor usage and billing:**
→ [Google Cloud Billing Console](https://console.cloud.google.com/billing/019E91-A4FE7B-975D65?project=city-filterer)

**Open-Meteo:**
- Free for non-commercial use (<10k requests/day)
- No API key required

## Troubleshooting

**"Location not found"**
- Check Geocoding API is enabled
- Verify API key is set correctly in `.env`

**"No places found"**
- Places API (New) might not be enabled
- Check API key restrictions
- Some place types may not exist in the area

**Map not loading**
- Maps JavaScript API must be enabled
- Check browser console for API key errors

**CORS errors**
- Backend must run on port 5001, frontend on 3000
- `flask-cors` handles this automatically

**API quota exceeded**
- Check [billing console](https://console.cloud.google.com/billing/019E91-A4FE7B-975D65?project=city-filterer)
- Enable billing for >$200/month usage

## Files

- `locale_backend.py` - Core evaluation logic
- `api_server.py` - Flask API server
- `locale-app/src/App.js` - React frontend
- `start_locale` / `stop_locale` - Dev server scripts
- `requirements.txt` - Python dependencies
- `.env` - API keys (not committed)
- `.env.example` - Template for `.env`
- `README.md` - This file
