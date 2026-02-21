# Locale Backlog

## Features

- [ ] Save and compare multiple locations side by side
- [ ] Reverse search: find locations that match a set of criteria
- [ ] Map view with draw-your-own radius
- [ ] Customize number of results shown per amenity (currently capped at 20 by Google API)
- [ ] Add more amenity types (libraries, entertainment venues, etc.)
- [ ] Add ratings/reviews summary to amenity detail rows

## Improvements

- [ ] Add caching (Redis or simple in-memory) to reduce API costs and speed up repeat searches
- [ ] Show loading state per-amenity rather than blocking the whole UI
- [ ] Add a "copy link" / shareable URL for a location + criteria combo
- [ ] Persist last searched location across sessions (localStorage)

## Bugs / Polish

- [ ] Google Places API caps at 20 results per request — explore pagination or alternate ranking strategies
- [ ] Haversine approximation drifts at high latitudes — replace with proper great-circle calculation
- [ ] Custom amenity text search uses `locationBias` (not strict radius) — results may fall outside the drawn circle
