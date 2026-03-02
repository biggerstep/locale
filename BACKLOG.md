# Locale Backlog

## Features

- [ ] Customize number of results shown per amenity (currently capped at 20 by Google API)
- [ ] Add more amenity types (libraries, entertainment venues, etc.)
- [ ] Provide different sets of amenities: home, vacation, day trip, etc.
- [ ] Add a small picture of the location
- [ ] Save and compare multiple locations side by side
- [ ] Reverse search: find locations that match a set of criteria
- [ ] Map view with draw-your-own radius
- [ ] Add ratings/reviews summary to amenity detail rows

## Improvements

- [x] Reduce the size of the Default Search Radius selector to be about 25% of what it is now
- [x] Add clear text icon (little x) at the right of the location window, to clear whatever is in there
- [ ] Improve the look and feel, so it's not a boring white background
- [ ] Think about how to declutter the map
- [ ] Modify amenity list item behavior: tapping one could highlight it on the map
- [ ] Add look-ahead for location bar
- [ ] Add caching (Redis or simple in-memory) to reduce API costs and speed up repeat searches
- [ ] Show loading state per-amenity rather than blocking the whole UI
- [ ] Add a "copy link" / shareable URL for a location + criteria combo
- [ ] Persist last searched location across sessions (localStorage)

## Bugs / Polish

- [ ] Google Places API caps at 20 results per request — explore pagination or alternate ranking strategies
- [ ] Haversine approximation drifts at high latitudes — replace with proper great-circle calculation
- [ ] Custom amenity text search uses `locationBias` (not strict radius) — results may fall outside the drawn circle

## Deployment
- [ ] Deploy on DO: create URL, secure with LetsEncrypt
