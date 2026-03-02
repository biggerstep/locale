export function sortPlaces(places, sortBy = 'distance') {
  return [...places].sort((a, b) =>
    sortBy === 'rating'
      ? (b.rating || 0) - (a.rating || 0)
      : (a.distance || 0) - (b.distance || 0)
  );
}

export function filterRestaurantsByRating(data, minRating) {
  const rating = parseFloat(minRating);
  if (!rating) return data;
  const filteredPlaces = data.places.filter(
    place => typeof place.rating === 'number' && place.rating >= rating
  );
  return { ...data, count: filteredPlaces.length, places: filteredPlaces };
}

export function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
