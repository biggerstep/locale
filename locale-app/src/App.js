import React, { useState, useEffect, useRef } from 'react';

// Use relative URL if on same host, otherwise use configured IP
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5001/api'
  : `http://${window.location.hostname}:5001/api`;

export default function App() {
  const [location, setLocation] = useState('8920 River Landing Way, Atlanta, GA 30350'); // TODO: Remove default for production
  const [radius, setRadius] = useState('3');
  const [availableCriteria, setAvailableCriteria] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState(new Set());
  const [customAmenities, setCustomAmenities] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [expandedAmenities, setExpandedAmenities] = useState(new Set());
  const [sortOrders, setSortOrders] = useState({});
  const [expandedSections, setExpandedSections] = useState(new Set(['amenities', 'climate'])); // Start with both expanded
  const [restaurantMinRating, setRestaurantMinRating] = useState('3'); // Minimum rating for restaurants
  const locationInputRef = useRef(null);

  // Load available criteria on mount
  useEffect(() => {
    fetch(`${API_BASE}/criteria`)
      .then(res => res.json())
      .then(data => {
        setAvailableCriteria(data.criteria);

        // Load from localStorage or select all by default
        const savedCriteria = localStorage.getItem('selectedCriteria');
        if (savedCriteria) {
          try {
            const parsed = JSON.parse(savedCriteria);
            setSelectedCriteria(new Set(parsed));
          } catch (e) {
            setSelectedCriteria(new Set(data.criteria.map(c => c.key)));
          }
        } else {
          setSelectedCriteria(new Set(data.criteria.map(c => c.key)));
        }
      })
      .catch(err => console.error('Failed to load criteria:', err));
  }, []);

  // Save selected criteria to localStorage whenever it changes
  useEffect(() => {
    if (selectedCriteria.size > 0) {
      localStorage.setItem('selectedCriteria', JSON.stringify(Array.from(selectedCriteria)));
    }
  }, [selectedCriteria]);

  // Load custom amenities from localStorage on mount
  useEffect(() => {
    const savedCustom = localStorage.getItem('customAmenities');
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        setCustomAmenities(parsed);
      } catch (e) {
        // Keep default empty array
      }
    }
  }, []);

  // Save custom amenities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customAmenities', JSON.stringify(customAmenities));
  }, [customAmenities]);

  // Auto-refresh when radius changes (if we already have a report)
  useEffect(() => {
    if (report && location) {
      // Trigger a new search with the updated radius
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  // Auto-refresh when selected amenities change (if we already have a report)
  useEffect(() => {
    if (report && location) {
      // Trigger a new search with the updated amenities
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCriteria]);

  const toggleCriterion = (key) => {
    const newSelected = new Set(selectedCriteria);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCriteria(newSelected);
  };

  const toggleAmenity = (key) => {
    const newExpanded = new Set(expandedAmenities);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedAmenities(newExpanded);
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateCustomAmenity = (index, value) => {
    const newCustom = [...customAmenities];
    newCustom[index] = value;
    setCustomAmenities(newCustom);
  };

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    // Filter out empty custom amenities
    const filledCustom = customAmenities.filter(a => a.trim() !== '');

    try {
      const response = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          radius_miles: parseFloat(radius),
          criteria: Array.from(selectedCriteria),
          custom_amenities: filledCustom,
          restaurant_min_rating: 0  // Always fetch all restaurants, filter on frontend
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to evaluate location');
      } else {
        setReport(data);
      }
    } catch (err) {
      setError('Network error - is the API server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">Locale</h1>
          <p className="text-gray-600">Evaluate locations based on what matters to you</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={locationInputRef}
                    id="location"
                    type="text"
                    placeholder="e.g., 1234 Main St, Austin, TX or Portland, OR"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    required
                  />
                  {location && (
                    <button
                      type="button"
                      onTouchEnd={(e) => { e.preventDefault(); setLocation(''); locationInputRef.current?.focus(); }}
                      onMouseDown={(e) => { e.preventDefault(); setLocation(''); locationInputRef.current?.focus(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      aria-label="Clear location"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!location || (selectedCriteria.size === 0 && customAmenities.every(a => !a.trim())) || loading}
                  className="bg-green-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
                >
                  {loading ? '...' : 'Go'}
                </button>
              </div>
            </div>

            {/* Map Section - shown after first evaluation */}
            {report && (() => {
              // Filter amenities based on selected criteria
              // Show selected standard amenities + always show custom amenities
              const standardCriteria = new Set(availableCriteria.map(c => c.key));
              const filteredAmenities = Object.fromEntries(
                Object.entries(report.amenities)
                  .filter(([key]) =>
                    selectedCriteria.has(key) || !standardCriteria.has(key)
                  )
                  .map(([key, data]) => {
                    // Also filter restaurant places by rating
                    if (key === 'restaurants') {
                      const minRating = parseFloat(restaurantMinRating);
                      const filteredPlaces = data.places.filter(place => {
                        if (minRating === 0) return true;
                        if (typeof place.rating !== 'number') return false;
                        return place.rating >= minRating;
                      });
                      return [key, { ...data, places: filteredPlaces }];
                    }
                    return [key, data];
                  })
              );

              return (
                <div>
                  <LocationMap
                    center={report.coordinates}
                    amenities={filteredAmenities}
                    radiusMiles={parseFloat(radius)}
                  />
                </div>
              );
            })()}

            <div className="flex items-center gap-3">
              <label htmlFor="radius" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Search Radius
              </label>
              <select
                id="radius"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
              >
                <option value="1">1 mile</option>
                <option value="2">2 miles</option>
                <option value="3">3 miles</option>
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
              </select>
            </div>

            {/* Criteria Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select amenities to evaluate
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableCriteria.map(criterion => (
                  <div
                    key={criterion.key}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <label className="flex items-center space-x-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedCriteria.has(criterion.key)}
                        onChange={() => toggleCriterion(criterion.key)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{criterion.label}</span>
                    </label>
                    {criterion.key === 'restaurants' && (
                      <select
                        value={restaurantMinRating}
                        onChange={(e) => setRestaurantMinRating(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        title="Minimum rating"
                      >
                        <option value="0">Any ⭐</option>
                        <option value="3">3+ ⭐</option>
                        <option value="4">4.0+ ⭐</option>
                        <option value="4.5">4.5+ ⭐</option>
                        <option value="5">5 ⭐</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {selectedCriteria.size} of {availableCriteria.length} selected
              </p>
            </div>

            {/* Custom Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Amenities (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Enter up to 5 business names or search terms (e.g., Starbucks, Whole Foods, library, museum)
              </p>
              <div className="space-y-2">
                {customAmenities.map((amenity, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={index === 0 ? 'e.g., Starbucks' : index === 1 ? 'e.g., Whole Foods' : `Custom amenity ${index + 1}`}
                    value={amenity}
                    onChange={(e) => updateCustomAmenity(index, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                  />
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-gray-600 py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p>Gathering data for {location}...</p>
          </div>
        )}

        {/* Report */}
        {report && !loading && (
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
            {/* Report Header */}
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">{report.location}</h2>
              <p className="text-sm text-gray-600">
                Within {report.radius_miles} miles • {report.coordinates.lat.toFixed(4)}°, {report.coordinates.lng.toFixed(4)}°
              </p>
            </div>

            {/* Amenities Section */}
            {Object.keys(report.amenities).length > 0 && (
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('amenities')}
                  className="w-full flex justify-between items-center mb-3 hover:opacity-70 transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Amenity Details</h3>
                  <svg
                    className={`w-6 h-6 text-gray-600 transition-transform ${expandedSections.has('amenities') ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.has('amenities') && (
                  <div className="space-y-2">
                    {Object.entries(report.amenities).map(([key, data]) => {
                      // Filter restaurants by minimum rating on the frontend
                      let filteredData = data;
                      if (key === 'restaurants') {
                        const minRating = parseFloat(restaurantMinRating);
                        // Filter restaurants by minimum rating
                        const filteredPlaces = data.places.filter(place => {
                          if (minRating === 0) return true;
                          if (typeof place.rating !== 'number') return false;
                          return place.rating >= minRating;
                        });

                        filteredData = {
                          count: filteredPlaces.length,
                          places: filteredPlaces  // Show all filtered results (scrollable)
                        };
                      }

                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                      return (
                        <ExpandableAmenityRow
                          key={key}
                          label={label}
                          data={filteredData}
                          isExpanded={expandedAmenities.has(key)}
                          onToggle={() => toggleAmenity(key)}
                          sortBy={sortOrders[key] || 'distance'}
                          onSortChange={(order) => setSortOrders(prev => ({ ...prev, [key]: order }))}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Climate Section */}
            <div className="mb-8">
              <button
                onClick={() => toggleSection('climate')}
                className="w-full flex justify-between items-center mb-3 hover:opacity-70 transition"
              >
                <h3 className="text-lg font-semibold text-gray-900">Climate</h3>
                <svg
                  className={`w-6 h-6 text-gray-600 transition-transform ${expandedSections.has('climate') ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.has('climate') && (
                <div className="space-y-3">
                  <ClimateMetricRow label="Average Temperature" value={report.climate.avg_temp_f} type="temperature" />
                  <ClimateMetricRow label="Annual Precipitation" value={report.climate.annual_precipitation} type="precipitation" />
                  <ClimateMetricRow label="Sunny Days" value={report.climate.sunny_days} type="sunny" />
                </div>
              )}
            </div>

            {/* Transportation Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transportation</h3>
              <div className="space-y-3">
                <MetricRow
                  label="Nearest Airport"
                  value={`${report.transportation.nearest_airport} — ${report.transportation.airport_distance}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function ClimateMetricRow({ label, value, type }) {
  // US Averages
  const US_AVG_TEMP = 52; // °F
  const US_AVG_PRECIP = 38; // inches/year
  const US_AVG_SUNNY = 205; // days/year

  const getLegend = () => {
    if (type === 'temperature') {
      return (
        <div className="flex items-center gap-1 ml-2" title="Temperature scale: Cold to Hot">
          <div className="w-12 h-2 rounded-full" style={{
            background: 'linear-gradient(to right, hsl(240, 70%, 50%), hsl(120, 70%, 50%), hsl(0, 70%, 50%))'
          }}></div>
        </div>
      );
    } else if (type === 'precipitation') {
      return (
        <div className="flex items-center gap-1 ml-2" title="Precipitation scale: Dry to Wet">
          <div className="w-12 h-2 rounded-full" style={{
            background: 'linear-gradient(to right, hsl(210, 70%, 95%), hsl(210, 70%, 45%))'
          }}></div>
        </div>
      );
    } else if (type === 'sunny') {
      return (
        <div className="flex items-center gap-0.5 ml-2 text-xs" title="Sunny days scale: Cloudy to Sunny">
          <span>☁️</span>
          <span>⛅</span>
          <span>☀️</span>
        </div>
      );
    }
    return null;
  };

  const getIndicator = () => {
    if (type === 'temperature') {
      const temp = parseFloat(value);
      if (isNaN(temp)) return null;

      // Calculate color based on temperature (30-80°F range)
      const normalized = Math.max(0, Math.min(1, (temp - 30) / 50));
      const hue = (1 - normalized) * 240; // 240 = blue, 0 = red
      return (
        <div
          className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0"
          style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
          title={`${temp > US_AVG_TEMP ? 'Warmer' : 'Colder'} than US avg (${US_AVG_TEMP}°F)`}
        />
      );
    } else if (type === 'precipitation') {
      const precip = parseFloat(value);
      if (isNaN(precip)) return null;

      // Calculate color based on precipitation (0-80 inches range)
      const normalized = Math.max(0, Math.min(1, precip / 80));
      const lightness = 95 - (normalized * 50); // 95% (white) to 45% (darker blue)
      return (
        <div
          className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0"
          style={{ backgroundColor: `hsl(210, 70%, ${lightness}%)` }}
          title={`${precip > US_AVG_PRECIP ? 'Wetter' : 'Drier'} than US avg (${US_AVG_PRECIP} in/yr)`}
        />
      );
    } else if (type === 'sunny') {
      const sunny = parseInt(value);
      if (isNaN(sunny)) return null;

      // Choose icon based on sunny days
      let icon;
      if (sunny >= 250) icon = '☀️';
      else if (sunny >= 220) icon = '🌤️';
      else if (sunny >= 180) icon = '⛅';
      else if (sunny >= 150) icon = '🌥️';
      else icon = '☁️';

      return (
        <span
          className="text-2xl flex-shrink-0"
          title={`${sunny > US_AVG_SUNNY ? 'Sunnier' : 'Cloudier'} than US avg (${US_AVG_SUNNY} days/yr)`}
        >
          {icon}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center">
        <span className="text-gray-600">{label}</span>
        {getLegend()}
      </div>
      <div className="flex items-center gap-3">
        {getIndicator()}
        <span className="font-medium text-gray-900">{value}</span>
      </div>
    </div>
  );
}

function ExpandableAmenityRow({ label, data, isExpanded, onToggle, sortBy, onSortChange }) {
  const count = data.count || 0;
  const places = data.places || [];

  const sortedPlaces = [...places].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    return (a.distance || 0) - (b.distance || 0);
  });

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-3 px-4 hover:bg-gray-50 transition"
      >
        <span className="text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{count}</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && places.length > 0 && (
        <div className="px-4 pb-3 pt-1 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-4 py-2 text-xs text-gray-500">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name={`sort-${label}`}
                value="distance"
                checked={sortBy === 'distance'}
                onChange={() => onSortChange('distance')}
              />
              Distance
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name={`sort-${label}`}
                value="rating"
                checked={sortBy === 'rating'}
                onChange={() => onSortChange('rating')}
              />
              Rating
            </label>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {sortedPlaces.map((place, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 text-sm">
                <div className="flex items-center gap-2">
                  {place.url ? (
                    <a
                      href={place.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {place.name}
                    </a>
                  ) : (
                    <span className="text-gray-700">{place.name}</span>
                  )}
                  {place.rating && (
                    <span className="text-yellow-600 text-xs">
                      ⭐ {place.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <span className="text-gray-500 font-medium">{place.distance} mi</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isExpanded && places.length === 0 && (
        <div className="px-4 pb-3 pt-1 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          No places found
        </div>
      )}
    </div>
  );
}

function LocationMap({ center, amenities, radiusMiles }) {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const circleRef = React.useRef(null);
  const openInfoWindowRef = React.useRef(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [apiKey, setApiKey] = React.useState(null);

  // Color map for different amenity types
  const categoryColors = {
    'grocery_stores': '#10B981',    // green
    'restaurants': '#EF4444',       // red
    'coffee_shops': '#8B4513',      // brown
    'bars': '#9333EA',              // purple
    'breweries': '#F59E0B',         // amber
    'pharmacies': '#EC4899',        // pink
    'gyms': '#6366F1',              // indigo
    'parks': '#22C55E',             // lime green
    'schools': '#3B82F6',           // blue
    'hospitals': '#DC2626',         // dark red
    'gas_stations': '#FBBF24',      // yellow
  };

  // Icons for different amenity types
  const categoryIcons = {
    'grocery_stores': '🛒',
    'restaurants': '🍽️',
    'coffee_shops': '☕',
    'bars': '🍸',
    'breweries': '🍺',
    'pharmacies': '💊',
    'gyms': '💪',
    'parks': '🌳',
    'schools': '🏫',
    'hospitals': '🏥',
    'gas_stations': '⛽',
  };

  // Fetch API key
  useEffect(() => {
    fetch(`${API_BASE}/config`)
      .then(res => res.json())
      .then(data => setApiKey(data.mapsApiKey))
      .catch(err => console.error('Failed to load Maps API key:', err));
  }, []);

  // Load Google Maps API
  useEffect(() => {
    if (!apiKey) return;

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize map (runs once when loaded)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !center) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Override InfoWindow styles to remove built-in close button and extra top padding
    const style = document.createElement('style');
    style.textContent = `
      .gm-ui-hover-effect { display: none !important; }
      .gm-style-iw { padding: 0 !important; }
      .gm-style-iw-d { overflow: hidden !important; padding: 0 !important; }
    `;
    document.head.appendChild(style);

    // Close open InfoWindow when clicking on the map
    map.addListener('click', () => {
      if (openInfoWindowRef.current) {
        openInfoWindowRef.current.close();
        openInfoWindowRef.current = null;
      }
    });

    // Add center marker (location) - yellow star
    new window.google.maps.Marker({
      position: { lat: center.lat, lng: center.lng },
      map: map,
      title: 'Search Location',
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <text x="16" y="24" font-size="28" text-anchor="middle">⭐</text>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16),
      },
    });
  }, [isLoaded, center]);

  // Update markers whenever amenities change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !amenities) return;

    // Clear existing amenity markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Draw radius circle
    if (circleRef.current) circleRef.current.setMap(null);
    circleRef.current = new window.google.maps.Circle({
      map,
      center: { lat: center.lat, lng: center.lng },
      radius: radiusMiles * 1609.34,
      strokeColor: '#9CA3AF',
      strokeOpacity: 0.5,
      strokeWeight: 1,
      fillColor: '#9CA3AF',
      fillOpacity: 0.06,
    });

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: center.lat, lng: center.lng });

    // Add markers for all amenities
    Object.entries(amenities).forEach(([category, data]) => {
      const icon = categoryIcons[category] || '📍';
      const color = categoryColors[category] || '#9CA3AF';
      const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      data.places?.forEach(place => {
        if (place.lat && place.lng) {
          const svgIcon = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="32" viewBox="0 0 200 32">
                <text x="16" y="24" font-size="24" text-anchor="middle">${icon}</text>
                <text x="38" y="20" font-size="12" font-family="Arial, sans-serif" fill="${color}" font-weight="600" stroke="#ffffff" stroke-width="3" paint-order="stroke">${place.name}</text>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(200, 32),
            anchor: new window.google.maps.Point(16, 16),
          };

          const marker = new window.google.maps.Marker({
            position: { lat: place.lat, lng: place.lng },
            map: map,
            title: place.name,
            icon: svgIcon,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 2px 8px 8px 8px; min-width: 180px;">
                <div style="font-size: 15px; font-weight: 600; margin-bottom: 3px;">${icon} ${place.name}</div>
                <div style="color: #666; font-size: 12px; margin-bottom: 2px;">${categoryLabel}</div>
                ${place.rating ? `<div style="color: #b45309; font-size: 12px; margin-bottom: 2px;">⭐ ${place.rating.toFixed(1)}</div>` : ''}
                <div style="color: #999; font-size: 12px;">${place.distance} mi away</div>
                ${place.url ? `<a href="${place.url}" target="_blank" rel="noopener noreferrer" style="color: #3B82F6; font-size: 12px; margin-top: 5px; display: inline-block;">View on Google Maps →</a>` : ''}
              </div>
            `
          });

          marker.addListener('click', () => {
            if (openInfoWindowRef.current) openInfoWindowRef.current.close();
            infoWindow.open(map, marker);
            openInfoWindowRef.current = infoWindow;
          });

          markersRef.current.push(marker);
          bounds.extend({ lat: place.lat, lng: place.lng });
        }
      });
    });

    // Fit map to show all markers
    map.fitBounds(bounds);

    const listener = window.google.maps.event.addListener(map, 'idle', () => {
      if (map.getZoom() > 15) map.setZoom(15);
      window.google.maps.event.removeListener(listener);
    });
  }, [amenities, center, isLoaded, radiusMiles]);

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div>
      <div ref={mapRef} className="w-full h-96 rounded-lg border border-gray-200" />

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Center location */}
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm text-gray-700">Search Location</span>
          </div>

          {/* Amenity categories that exist in data */}
          {Object.keys(amenities).map(category => (
            <div key={category} className="flex items-center gap-2">
              <span className="text-lg">{categoryIcons[category] || '📍'}</span>
              <span className="text-sm text-gray-700">
                {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
