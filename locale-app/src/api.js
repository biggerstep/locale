export const API_BASE = '/api';

export async function fetchReverseGeocode(lat, lng) {
  const res = await fetch(`${API_BASE}/reverse-geocode?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error('Could not resolve location');
  const data = await res.json();
  return data.address;
}

export async function fetchAutocomplete(input, sessionToken) {
  const params = new URLSearchParams({ input });
  if (sessionToken) params.set('session_token', sessionToken);
  const res = await fetch(`${API_BASE}/autocomplete?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions || [];
}

export async function fetchCriteria() {
  const res = await fetch(`${API_BASE}/criteria`);
  if (!res.ok) throw new Error('Failed to load criteria');
  return res.json();
}

export async function evaluateLocation({ location, radius, selectedCriteria, customAmenities }) {
  const filledCustom = customAmenities.filter(a => a.trim() !== '');
  const res = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location,
      radius_miles: parseFloat(radius),
      criteria: Array.from(selectedCriteria),
      custom_amenities: filledCustom,
      restaurant_min_rating: 0,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to evaluate location');
  return data;
}
