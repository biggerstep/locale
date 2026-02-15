# Locale - Location Evaluation App

Real-world implementation with Google Places API and Open-Meteo climate data.

## Architecture

```
locale_backend.py    - Core location evaluation logic
api_server.py        - Flask REST API server
locale_frontend.jsx  - React UI with criteria selection
```

## Setup

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Places API (New)
   - Geocoding API
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
- `POST /api/evaluate` - Evaluate location

### 3. Frontend Setup

The React component (`locale_frontend.jsx`) can be:

**Option A: Run as artifact** (easiest for testing)
- Just paste the code into a `.jsx` file
- Use the artifact rendering in Claude

**Option B: Standalone HTML** (for deployment)
Create an `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Locale</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="locale_frontend.jsx"></script>
  <script type="text/babel">
    ReactDOM.render(<LocaleApp />, document.getElementById('root'));
  </script>
</body>
</html>
```

**Option C: Proper React app** (for production)
```bash
npx create-react-app locale-app
cd locale-app
# Replace src/App.js with locale_frontend.jsx content
npm start
```

## Development Utilities

**Quick Start (Recommended)**

Use the included utility scripts to start/stop both servers:

```bash
# Start both API and React dev servers
./start_locale

# Stop both servers
./stop_locale
```

The `start_locale` script will:
- Start Flask API server on port 5001
- Start React dev server on port 3000
- Run both in the background
- Enable auto-reload on file changes

**Debugging**

Server logs are written to:
- API logs: `/tmp/locale_api.log`
- React logs: `/tmp/locale_react.log`

View logs in real-time:
```bash
tail -f /tmp/locale_api.log    # Watch API logs
tail -f /tmp/locale_react.log  # Watch React logs
```

### 4. Test the App

1. Start backend: `python3 api_server.py`
2. Open frontend in browser
3. Try locations:
   - "Austin, TX"
   - "1234 Main Street, Portland, OR"
   - "Nashville, TN"

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
- `restaurants` - Restaurants (4+ star rated)
- `coffee_shops` - Cafes, coffee shops
- `breweries` - Breweries, craft beer
- `pharmacies` - Drug stores, pharmacies
- `gyms` - Fitness centers, gyms
- `parks` - Parks, recreational areas
- `schools` - Schools (all levels)
- `hospitals` - Hospitals, medical centers
- `gas_stations` - Gas stations

## Data Sources

- **Google Places API (New)** - POI counts within radius
- **Google Geocoding API** - Address → coordinates
- **Open-Meteo** - Historical climate data (free, no key needed)

## API Costs

**Google Maps Platform:**
- Geocoding: $5 per 1000 requests
- Places Nearby Search: $32 per 1000 requests
- First $200/month free credit

**Open-Meteo:**
- Free for non-commercial use (<10k requests/day)
- No API key required

**Estimated cost per evaluation:**
- 1 geocode + ~10 place searches = ~$0.32
- With $200 free credit = ~625 free evaluations/month

## Deployment

### Option 1: Your DigitalOcean Droplet
```bash
# On your DO instance
git clone <your-repo>
cd locale-app
pip install -r requirements.txt
export GOOGLE_MAPS_API_KEY="your_key"
nohup python3 api_server.py &
```

### Option 2: Railway/Render (easy deployment)
- Railway.app or Render.com
- Connect GitHub repo
- Set `GOOGLE_MAPS_API_KEY` env variable
- Auto-deploys on push

### Option 3: Vercel (for static frontend)
- Deploy React frontend to Vercel
- Backend to Railway/Render
- Update `API_BASE` in frontend to your backend URL

## Next Steps

1. **Add more criteria**: Edit `CRITERIA_MAP` in `locale_backend.py`
2. **Customize climate metrics**: Modify `get_climate_data()`
3. **Add caching**: Use Redis to cache API responses
4. **Save/compare locations**: Add database (SQLite/Postgres)
5. **Reverse search**: Find locations matching criteria
6. **Map view**: Integrate Mapbox/Leaflet to show POIs

## Troubleshooting

**"Location not found"**
- Check geocoding API is enabled
- Verify API key is set correctly

**"No places found"**
- Places API might not be enabled
- Check API key restrictions
- Some place types may not exist in area

**CORS errors**
- Backend must run on different port than frontend
- `flask-cors` should handle this automatically

**API quota exceeded**
- Check Google Cloud Console → Quotas
- Enable billing for >$200/month usage

## Files

- `locale_backend.py` - Core evaluation logic
- `api_server.py` - Flask API
- `locale_frontend.jsx` - React UI
- `requirements.txt` - Python deps
- `README.md` - This file
