# Locale - Claude Code Context

This is a location evaluation application that helps users assess locations based on amenities, climate, and transportation access.

## Opening Every Session
When Pete opens a session:
1. Read the `## Session State` section in this CLAUDE.md
2. Summarize briefly: what was worked on, what's in progress, what's next
3. Ask Pete what he wants to work on

## Tasks

Tasks are assigned by petebot and surfaced automatically at session start.

- **Task file location**: `~/petebot/tasks/locale.md`
- When a task is complete, move it to the completed folder:
  ```bash
  mv ~/petebot/tasks/locale.md ~/petebot/tasks/completed/locale-$(date +%Y-%m-%d).md
  ```

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
- **Repo moved** to `~/code/locale`; updated launchd plists and reloaded agents
- **deploy/ folder added**: launchd plists (macOS) and systemd + nginx configs (DO) now versioned in the repo
- **Deployment target decided**: `locale.peterbriggs.info` (subdomain of existing droplet, serves React at domain root — no subpath prefix)
- `DEPLOYMENT.md` rewritten to match

### What's currently in progress
Nothing — all changes committed and working.

### Key decisions made
- **launchd plists now in repo** at `deploy/macos/` — copy to `~/Library/LaunchAgents/` to install; paths hard-coded to `/Users/pete/code/locale`
- **locale.peterbriggs.info over peterbriggs.ai**: `.ai` TLD doesn't fit a non-AI tool; subdomain avoids React path-prefix headaches
- **DO deployment**: `deploy/do/` has `locale-api.service` (systemd) and `nginx-locale.peterbriggs.info.conf`; app lives at `/var/www/locale`, runs as `www-data`

### Next steps
1. **Deploy to DigitalOcean** — TOP PRIORITY
   - Add DNS A record: `locale` → droplet IP
   - SSH in, clone repo to `/var/www/locale`, set up venv, build React
   - Install `deploy/do/locale-api.service` and `deploy/do/nginx-locale.peterbriggs.info.conf`
   - Run Certbot for SSL
   - Full steps in `DEPLOYMENT.md`
2. **Continue Komoot-inspired styling** — orange accent color, bolder typography, pill-style buttons
3. **No version tags yet** — consider tagging current state as v1.0

### Gotchas / context
- `GOOGLE_MAPS_API_KEY` was previously exposed in chat — should be regenerated in Google Cloud Console before DO deploy
- `urgent_care_center` is NOT a valid Google Places API type; medical = `['hospital', 'pharmacy']`
- If macOS firewall ever gets re-enabled: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off`
- Access from iPhone/iPad: `http://dev.peterbriggs.info:3000` (requires Tailscale connected)

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
