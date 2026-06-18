# CLAUDE.md Session History

## 2026-06-14

### What we accomplished
- **Refactored App.js** (1095 lines → ~200 lines) into 10 focused component files under `locale-app/src/components/` and `utils/`
- **Fixed amenity data quality issues**: Starbucks excluded from coffee shops (exclusion list pattern), `urgent_care_center` invalid type removed, sports/music/yoga schools excluded from Schools
- **Renamed "Hospitals" → "Medical"** combining hospitals + pharmacies
- **UI improvements**: amenity icons inline with checkboxes, star icon left of location input, radius selector repositioned, map legend removed, InfoWindow padding trimmed, amenity name truncation at 20 chars
- **Extracted shared utilities**: `amenityUtils.js` (sortPlaces, filterRestaurantsByRating, formatLabel), `temperatureUtils.js` (getTempColor)
- **Added location autocomplete**: `/api/autocomplete` endpoint (Google Places Autocomplete API), `LocationInput` component with debounced suggestions, keyboard nav (↑↓ Enter Esc), session tokens for cost efficiency
- **Dropped auto-location detection**: navigator.geolocation blocked on HTTP (Tailscale); ip-api.com unreliable on cellular. Feature removed entirely.
- **Fixed Tailscale connectivity**: Flask on port 5001 was blocked by macOS firewall when Python uprevved. Fixed by adding CRA proxy (`"proxy": "http://localhost:5001"` in package.json). Also disabled macOS app firewall.

### Key decisions made
- **Autocomplete via backend proxy**: keeps API key server-side; uses same `GOOGLE_MAPS_API_KEY`
- **Session tokens on autocomplete**: groups keystrokes into one billable session per selection
- **Google Places type exclusion lists**: use `any type in set` + exclude known false-positive primary types
- **No auto-location**: HTTP blocks geolocation in all modern browsers; IP fallback unreliable on cellular
- **CRA proxy for API**: `api.js` uses `API_BASE = '/api'` (relative URL); React dev server proxies to `localhost:5001`
- **macOS firewall disabled**: home router NAT is sufficient; app firewall was causing pain as Python uprevved
