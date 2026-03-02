# Refactoring Analysis

## File Sizes

| File | Lines |
|------|-------|
| `locale_backend.py` | 450 |
| `api_server.py` | 89 |
| `App.js` | 288 |
| `api.js` | 28 |
| `CriteriaSelector.js` | 150 |
| `CustomAmenities.js` | 61 |
| `ReportPanel.js` | 60 |
| `LocationMap.js` | 209 |
| `mapConstants.js` | 30 |
| `ClimateMetricRow.js` | 96 |
| `TemperatureRow.js` | 91 |
| `ExpandableAmenityRow.js` | 91 |
| `MetricRow.js` | 11 |

---

## Duplicated Logic

### 1. Distance calculation — 3 copies in `locale_backend.py`
Same 3-line Haversine approximation appears in `count_nearby_places` (~line 140),
`search_by_text` (~line 209), and `find_nearest_airport` (~line 359).

**Fix**: extract to a module-level helper:
```python
def calculate_distance_miles(lat1, lng1, lat2, lng2):
    lat_diff = abs(lat1 - lat2) * 69
    lng_diff = abs(lng1 - lng2) * 54.6
    return round((lat_diff**2 + lng_diff**2)**0.5, 2)
```

---

### 2. Place-data processing — 2 copies in `locale_backend.py`
The loop that converts raw API `places` items into dicts with `name`, `distance`,
`rating`, `url`, `lat`, `lng` is duplicated almost verbatim in `count_nearby_places`
and `search_by_text`.

**Fix**: extract to a shared helper:
```python
def build_place_list(raw_places, center_lat, center_lng, radius_miles=None):
    ...
```

---

### 3. Google Places API request headers — 3 copies in `locale_backend.py`
`Content-Type`, `X-Goog-Api-Key`, and `X-Goog-FieldMask` are set manually in
`count_nearby_places`, `search_by_text`, and `find_nearest_airport`.

**Fix**: define a module-level constant or small helper that accepts an optional
field mask override.

---

### 4. Place filtering logic — 2 copies in React
Restaurant rating filtering is implemented identically in `App.js`
(`filteredAmenities` computation) and in `CriteriaSelector.js` (lines 25–33).
A change to filtering rules must be made in both places.

**Fix**: extract to `src/utils/filterHelpers.js`:
```javascript
export function filterRestaurantsByRating(data, minRating) { ... }
export function filterAmenitiesForDisplay(report, selectedCriteria, availableCriteria) { ... }
```

---

### 5. Place sort logic — 2 copies in React
Identical 4-line sort is in `CriteriaSelector.js` (lines 36–39) and
`ExpandableAmenityRow.js` (lines 7–10).

**Fix**: one-liner in `src/utils/sortHelpers.js`:
```javascript
export function sortPlaces(places, sortBy = 'distance') {
  return [...places].sort((a, b) =>
    sortBy === 'rating' ? (b.rating||0)-(a.rating||0) : (a.distance||0)-(b.distance||0)
  );
}
```

---

### 6. Temperature color calculation — 4+ copies in React
The two-line normalized hue formula appears in `ClimateMetricRow.js` and
multiple times in `TemperatureRow.js` / `TempDot`.

**Fix**: extract to `src/utils/temperatureUtils.js`:
```javascript
export function getTempColor(temp) {
  const normalized = Math.max(0, Math.min(1, (temp - 30) / 50));
  return `hsl(${(1 - normalized) * 240}, 70%, 50%)`;
}
```

---

### 7. Label formatting — 3+ copies in React
`key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())` is scattered
across `CriteriaSelector.js`, `CustomAmenities.js`, and `LocationMap.js`.

**Fix**: `src/utils/formatLabel.js` (or part of a general utils file).

---

## Components With Too Many Responsibilities

### `App.js` (288 lines)
Currently manages 13 state variables, 6 `useEffect` hooks, 5 event handlers,
business logic (filtering, localStorage), and the top-level layout.

**Recommended split**:
```
src/hooks/
  useLocationSearch.js   — location, radius, report, loading, error, performSearch
  useCriteriaState.js    — selectedCriteria, expandedAmenities, sortOrders + localStorage
  useCustomAmenities.js  — customAmenities array + localStorage
```

With these hooks, App.js would shrink to ~150 lines of pure layout/composition.

---

### `LocationMap.js` (209 lines)
Mixes API-key fetching, Maps script loading, map initialization, CSS injection,
marker/InfoWindow creation, and the radius circle. Every concern is entangled.

**Recommended split**:
```
src/components/map/
  LocationMap.js          — composition only (~70 lines)
  useMapLoader.js         — fetch API key, inject script tag, expose isLoaded
  useMapInstance.js       — create Map, inject CSS, add click listener, center marker
  useAmenityMarkers.js    — marker/InfoWindow lifecycle tied to amenities prop
  markerFactory.js        — buildSvgIcon(), buildInfoWindowContent()
```

---

### `CriteriaSelector.js` (150 lines)
Does three things: renders the checkbox grid, contains the expandable place list,
and duplicates the restaurant filtering and sort logic that lives in `App.js` and
`ExpandableAmenityRow`.

**Recommended split**:
- Move restaurant-rating filtering to `filterHelpers.js`
- Move sort to `sortHelpers.js`
- Extract the inline place list into a reusable `PlaceList.js` component (also
  used by `ExpandableAmenityRow`)
- Resulting `CriteriaSelector.js` ~90 lines

---

### `ClimateMetricRow.js` (96 lines)
Uses `getLegend()` and `getIndicator()` with 3-way `if/else if` branching on
`type`. Each branch is effectively a different component.

**Option A** (lighter touch): keep the file but move the per-type logic into
named sub-functions so each branch is 3–5 lines.

**Option B** (cleaner): split into three focused components:
```
climate/
  PrecipitationMetric.js
  SunnyDaysMetric.js
  TemperatureMetric.js   (annual view only; TemperatureRow already handles toggles)
```

---

## New Shared Components Worth Creating

| Component | Replaces |
|-----------|---------|
| `shared/PlaceList.js` | Inline place lists in `CriteriaSelector` and `ExpandableAmenityRow` |
| `shared/SortToggle.js` | Radio sort controls duplicated in same two components |

---

## Other Code Quality Notes

### Backend
- **Error handling**: all functions use bare `except Exception` with `print()`. Should
  use `logging` and catch specific exceptions (`requests.RequestException`, etc.).
- **Magic numbers**: `69` (miles/degree lat) and `54.6` (miles/degree lng) appear 6
  times with no named constants.
- **Type hints**: `count_nearby_places` now accepts `str | list` but the signature
  still says `place_type` with no annotation.

### Frontend
- **Default location hardcoded** in `App.js` line 9 with a `// TODO` comment. Should
  be an env variable (`REACT_APP_DEFAULT_LOCATION`).
- **localStorage keys** are raw strings scattered across `App.js`. A small
  `src/utils/storage.js` module with named keys and typed get/set helpers would
  make it easier to change key names or add new persisted state.
- **Map control ref pattern**: passing `controlRef` down through props and mutating
  it inside `LocationMap` is fragile. A React Context for map control would be
  cleaner, but the current approach is acceptable given the app's size.

---

## Recommended Order of Work

### Phase 1 — Quick wins (low effort, high value)
1. Extract `calculate_distance_miles` in `locale_backend.py`
2. Extract `build_place_list` in `locale_backend.py`
3. Extract `getTempColor` to `temperatureUtils.js`
4. Extract `sortPlaces` to `sortHelpers.js`
5. Extract `filterRestaurantsByRating` to `filterHelpers.js`
6. Extract `formatLabel` utility

### Phase 2 — Component splits (medium effort)
7. Create `useLocationSearch`, `useCriteriaState`, `useCustomAmenities` hooks
8. Create `shared/PlaceList.js` and `shared/SortToggle.js`
9. Refactor `CriteriaSelector.js` to use shared helpers
10. Split `ClimateMetricRow.js` into variant components (Option A or B)

### Phase 3 — Map refactor (higher effort, isolated)
11. Split `LocationMap.js` into hooks + factory functions
12. Replace `print()` with `logging` in backend
