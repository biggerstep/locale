# Locale - Claude Code Context

This is a location evaluation application that helps users assess locations based on amenities, climate, and transportation access.

## Architecture

```
Backend (Flask)          Frontend (React)
├── api_server.py       └── locale-app/src/App.js
└── locale_backend.py
```

**Backend**: Flask REST API (port 5001)
- Google Places API (New) for amenity search
- Google Geocoding API for address → coordinates
- Open-Meteo API for climate data (free, no key needed)

**Frontend**: React with Tailwind CSS (port 3000)
- create-react-app (`locale-app/`)

## Key Design Decisions

### Port 5001 (Not 5000)
macOS AirPlay Receiver uses port 5000 by default, so we use 5001 to avoid conflicts.

### Environment Variables via .env
API keys are stored in `.env` file (not shell config) for:
- Project isolation
- Easy key rotation
- Git safety (`.env` is in `.gitignore`)

Uses `python-dotenv` to load environment variables.

### Virtual Environment (venv)
Python dependencies are isolated in `venv/` to avoid system conflicts.
- Created once: `python3 -m venv venv`
- Activated each session: `source venv/bin/activate`

### Expandable Amenities
Each amenity type returns:
```json
{
  "count": 15,          // Total found
  "places": [           // Top 5 closest
    {"name": "Store Name", "distance": 0.5}
  ]
}
```
UI shows count with chevron; clicking expands to show 5 nearest places sorted by distance.

## Development Workflow

### Quick Start
```bash
./start_locale   # Starts both Flask (5001) and React (3000)
./stop_locale    # Stops both servers
```

### Manual Start
```bash
# Backend
source venv/bin/activate
python3 api_server.py

# Frontend
cd locale-app && npm start
```

### Logs
- API: `/tmp/locale_api.log`
- React: `/tmp/locale_react.log`
- View: `tail -f /tmp/locale_api.log`

## Important Patterns

### Adding New Amenity Types
1. Add to `CRITERIA_MAP` in `locale_backend.py`:
   ```python
   'libraries': 'library'
   ```
2. Uses Google Places type from [official list](https://developers.google.com/maps/documentation/places/web-service/supported_types)

### API Response Structure
```json
{
  "location": "Austin, TX",
  "coordinates": {"lat": 30.2672, "lng": -97.7431},
  "radius_miles": 3,
  "climate": {
    "avg_temp_f": "68.5°F",
    "annual_precipitation": "34.2 in/yr",
    "sunny_days": "300 days/yr"
  },
  "amenities": {
    "grocery_stores": {
      "count": 12,
      "places": [
        {"name": "Whole Foods", "distance": 0.3},
        ...
      ]
    }
  },
  "transportation": {
    "nearest_airport": "Austin-Bergstrom International",
    "airport_distance": "8.5 mi"
  }
}
```

### Frontend State Management
- `selectedCriteria`: Set of criterion keys to evaluate
- `expandedAmenities`: Set of amenity keys currently expanded
- `report`: Full evaluation result from API

## Common Tasks

### Commit Changes
Use descriptive messages with Co-Authored-By:
```bash
git commit -m "$(cat <<'EOF'
Brief description

- Bullet points of changes
- More details

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### Update README
Keep README in sync when adding features, especially:
- New endpoints
- New criteria
- Development utilities

### Testing API Directly
```bash
curl -X POST http://localhost:5001/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{"location": "Austin, TX", "radius_miles": 3}'
```

## Gotchas & Notes

### Restaurants Use 4+ Star Filter
Restaurants have special handling with `min_rating=4.0` to filter quality.

### Distance Calculation
Uses simplified Haversine formula (not true great circle):
- ~69 miles per degree latitude
- ~54.6 miles per degree longitude (at mid-latitudes)
- Good enough for local distances (<50 miles)

### Google Places API Limits
- Max 20 results per request
- We show top 5 closest to user
- Requires both Places API (New) and Geocoding API enabled

### Auto-Reload
Both servers auto-reload on file changes:
- Flask: `debug=True`
- React: HMR enabled by default

### Branch Name
Uses `master` (not `main`) per user preference.

## File Structure

```
locale/
├── api_server.py           # Flask REST API
├── locale_backend.py       # Core evaluation logic
├── start_locale            # Dev server startup script
├── stop_locale             # Dev server shutdown script
├── .env                    # API keys (NOT committed)
├── .env.example            # Template for .env
├── .gitignore              # Excludes .env, venv/
├── requirements.txt        # Python dependencies
├── README.md               # User documentation
├── CLAUDE.md               # This file
└── locale-app/src/
    ├── App.js              # Root component (state, layout only)
    ├── api.js              # All fetch calls to backend
    ├── utils/
    │   ├── amenityUtils.js     # sortPlaces, filterRestaurantsByRating, formatLabel
    │   └── temperatureUtils.js # getTempColor
    └── components/
        ├── LocationInput.js        # Location field with autocomplete dropdown
        ├── CriteriaSelector.js     # Amenity checkboxes + inline results
        ├── CustomAmenities.js      # Free-text custom amenity inputs
        ├── ReportPanel.js          # Full report layout
        ├── shared/
        │   └── ExpandableAmenityRow.js  # Reusable expandable place list row
        ├── climate/
        │   ├── ClimateMetricRow.js      # Single climate stat row
        │   └── TemperatureRow.js        # Temp row with Annual/Seasonal/Monthly toggle
        └── map/
            ├── LocationMap.js           # Google Maps with markers + InfoWindows
            ├── mapConstants.js          # Amenity colors and icons
            └── mapUtils.js             # SVG marker builder
```

## Session State

### What we accomplished
- **Refactored App.js** (1095 lines → ~200 lines) into 10 focused component files under `locale-app/src/components/` and `utils/`
- **Fixed amenity data quality issues**: Starbucks excluded from coffee shops (exclusion list pattern), `urgent_care_center` invalid type removed, sports/music/yoga schools excluded from Schools
- **Renamed "Hospitals" → "Medical"** combining hospitals + pharmacies
- **UI improvements**: amenity icons inline with checkboxes, star icon left of location input, radius selector repositioned, map legend removed, InfoWindow padding trimmed, amenity name truncation at 20 chars
- **Extracted shared utilities**: `amenityUtils.js` (sortPlaces, filterRestaurantsByRating, formatLabel), `temperatureUtils.js` (getTempColor)
- **Added location autocomplete**: `/api/autocomplete` endpoint (Google Places Autocomplete API), `LocationInput` component with debounced suggestions, keyboard nav (↑↓ Enter Esc), session tokens for cost efficiency
- **Dropped auto-location detection**: navigator.geolocation blocked on HTTP (Tailscale); ip-api.com unreliable on cellular. Feature removed entirely.
- **Fixed Tailscale connectivity**: Flask on port 5001 was blocked by macOS firewall when Python uprevved (3.14.0→3.14.3). Fixed by adding CRA proxy (`"proxy": "http://localhost:5001"` in package.json) so all API calls go through port 3000. Also disabled macOS app firewall (router NAT provides sufficient protection at home).

### Key decisions
- **Autocomplete via backend proxy**: keeps API key server-side; uses same `GOOGLE_MAPS_API_KEY` (Places API already enabled for nearby search)
- **Session tokens on autocomplete**: groups keystrokes into one billable session per selection (~$0.017/search vs per-keystroke billing)
- **Google Places type exclusion lists**: rather than strict primary-type matching, use `any type in set` + exclude known false-positive primary types (e.g. `gas_station` for cafes, `sports_school` for schools)
- **No auto-location**: HTTP (Tailscale URL) blocks geolocation in all modern browsers regardless of user gesture; IP fallback unreliable on cellular
- **CRA proxy for API**: `api.js` now uses `API_BASE = '/api'` (relative URL); React dev server proxies to `localhost:5001`. Means Flask never needs firewall rules for external access.
- **macOS firewall disabled**: home router NAT is sufficient protection; macOS app firewall was only causing pain as Python uprevved

### Gotchas
- Autocomplete requires Places API enabled in Google Cloud Console — it uses the same key as nearby search so likely already works, but verify if suggestions don't appear
- The `GOOGLE_MAPS_API_KEY` in `.env` was previously exposed in chat — should be regenerated
- `urgent_care_center` is NOT a valid Google Places API type (causes 400 error); medical = `['hospital', 'pharmacy']`
- Schools use specific types `['primary_school', 'secondary_school', 'university', 'preschool']` — generic `school` type returns sports/music/yoga false positives
- If macOS firewall ever gets re-enabled, run: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off`

### Next steps
1. **Verify autocomplete works** — test zip code input (e.g. "78701") and partial city/address names from iPad
2. Consider implementing **temperature toggle** (Annual/Seasonal/Monthly) — plan exists at `/Users/pete/.claude/plans/cosmic-gathering-fountain.md`

## Next Steps / Future Ideas

- [ ] Add caching (Redis) to reduce API costs
- [ ] Save/compare multiple locations
- [ ] Reverse search: find locations matching criteria
- [ ] Map view with Mapbox/Leaflet
- [ ] More criteria (libraries, entertainment, etc.)
- [ ] Customize detail limit (currently hardcoded to 5)
- [ ] Add ratings/reviews to place details

## API Costs

**Google Maps Platform** (first $200/month free):
- Geocoding: $5 per 1000 requests
- Places Nearby Search: $32 per 1000 requests
- Per evaluation: ~$0.32 (1 geocode + ~10 place searches)
- Free tier: ~625 evaluations/month

**Open-Meteo**: Free for non-commercial (<10k requests/day)

## Security Notes

- **NEVER** commit `.env` file (already in `.gitignore`)
- Regenerate API key if exposed
- Consider IP restrictions on Google API key for production
- Use production WSGI server (gunicorn) instead of Flask dev server for deployment
