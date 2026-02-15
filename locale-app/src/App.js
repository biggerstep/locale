import React, { useState, useEffect } from 'react';

const API_BASE = 'http://10.0.0.203:5001/api';

export default function App() {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState('3');
  const [availableCriteria, setAvailableCriteria] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState(new Set());
  const [customAmenities, setCustomAmenities] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [expandedAmenities, setExpandedAmenities] = useState(new Set());

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

  const updateCustomAmenity = (index, value) => {
    const newCustom = [...customAmenities];
    newCustom[index] = value;
    setCustomAmenities(newCustom);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);

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
          custom_amenities: filledCustom
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
              <input
                id="location"
                type="text"
                placeholder="e.g., 1234 Main St, Austin, TX or Portland, OR"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius
              </label>
              <select
                id="radius"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
                  <label
                    key={criterion.key}
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCriteria.has(criterion.key)}
                      onChange={() => toggleCriterion(criterion.key)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{criterion.label}</span>
                  </label>
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

            <button
              type="submit"
              disabled={!location || (selectedCriteria.size === 0 && customAmenities.every(a => !a.trim())) || loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Evaluating...' : 'Evaluate Location'}
            </button>
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

            {/* Map Section */}
            <div className="mb-8">
              <LocationMap
                center={report.coordinates}
                amenities={report.amenities}
              />
            </div>

            {/* Climate Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Climate</h3>
              <div className="space-y-3">
                <ClimateMetricRow label="Average Temperature" value={report.climate.avg_temp_f} type="temperature" />
                <ClimateMetricRow label="Annual Precipitation" value={report.climate.annual_precipitation} type="precipitation" />
                <ClimateMetricRow label="Sunny Days" value={report.climate.sunny_days} type="sunny" />
              </div>
            </div>

            {/* Amenities Section */}
            {Object.keys(report.amenities).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="space-y-2">
                  {Object.entries(report.amenities).map(([key, data]) => (
                    <ExpandableAmenityRow
                      key={key}
                      label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      data={data}
                      isExpanded={expandedAmenities.has(key)}
                      onToggle={() => toggleAmenity(key)}
                    />
                  ))}
                </div>
              </div>
            )}

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

function ExpandableAmenityRow({ label, data, isExpanded, onToggle }) {
  const count = data.count || 0;
  const places = data.places || [];

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
          {count > 5 && (
            <div className="text-xs font-medium text-gray-600 mb-2 pt-2">Nearest 5</div>
          )}
          <div className="space-y-2">
            {places.map((place, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 text-sm">
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

function LocationMap({ center, amenities }) {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [apiKey, setApiKey] = React.useState(null);

  // Color map for different amenity types
  const categoryColors = {
    'grocery_stores': '#10B981',    // green
    'restaurants': '#EF4444',       // red
    'coffee_shops': '#8B4513',      // brown
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

  // Initialize map and markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !center) return;

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

    // Add center marker (location)
    new window.google.maps.Marker({
      position: { lat: center.lat, lng: center.lng },
      map: map,
      title: 'Search Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    // Collect all place coordinates for bounds
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: center.lat, lng: center.lng });

    // Add markers for all amenities
    Object.entries(amenities).forEach(([category, data]) => {
      const icon = categoryIcons[category] || '📍';
      const color = categoryColors[category] || '#9CA3AF';
      const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      data.places?.forEach(place => {
        if (place.lat && place.lng) {
          // Create emoji marker icon with color-coded label
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

          // Create InfoWindow with amenity info
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <div style="font-size: 18px; margin-bottom: 4px;">${icon} <strong>${place.name}</strong></div>
                <div style="color: #666; font-size: 13px; margin-bottom: 4px;">${categoryLabel}</div>
                <div style="color: #999; font-size: 12px;">${place.distance} mi away</div>
                ${place.url ? `<a href="${place.url}" target="_blank" rel="noopener noreferrer" style="color: #3B82F6; font-size: 12px; margin-top: 6px; display: inline-block;">View on Google Maps →</a>` : ''}
              </div>
            `
          });

          // Open InfoWindow on marker click
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          bounds.extend({ lat: place.lat, lng: place.lng });
        }
      });
    });

    // Fit map to show all markers
    map.fitBounds(bounds);

    // Ensure minimum zoom level
    const listener = window.google.maps.event.addListener(map, 'idle', () => {
      if (map.getZoom() > 15) map.setZoom(15);
      window.google.maps.event.removeListener(listener);
    });
  }, [isLoaded, center, amenities]);

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
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
            <span className="text-sm text-gray-700">Search Location</span>
          </div>

          {/* Amenity categories that exist in data */}
          {Object.keys(amenities).map(category => (
            <div key={category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-white shadow"
                style={{ backgroundColor: categoryColors[category] || '#9CA3AF' }}
              ></div>
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
