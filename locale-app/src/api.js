export const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5001/api'
  : `http://${window.location.hostname}:5001/api`;

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
