import React, { useState, useEffect, useRef } from 'react';
import { fetchCriteria, evaluateLocation } from './api';
import LocationMap from './components/map/LocationMap';
import CriteriaSelector from './components/CriteriaSelector';
import CustomAmenities from './components/CustomAmenities';
import ReportPanel from './components/ReportPanel';

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
  const [expandedSections, setExpandedSections] = useState(new Set(['climate']));
  const [restaurantMinRating, setRestaurantMinRating] = useState('3');
  const [tempView, setTempView] = useState('annual');
  const locationInputRef = useRef(null);
  const mapControlRef = useRef(null);

  // Load available criteria on mount
  useEffect(() => {
    fetchCriteria()
      .then(data => {
        setAvailableCriteria(data.criteria);
        const savedCriteria = localStorage.getItem('selectedCriteria');
        if (savedCriteria) {
          try {
            setSelectedCriteria(new Set(JSON.parse(savedCriteria)));
          } catch (e) {
            setSelectedCriteria(new Set(data.criteria.map(c => c.key)));
          }
        } else {
          setSelectedCriteria(new Set(data.criteria.map(c => c.key)));
        }
      })
      .catch(err => console.error('Failed to load criteria:', err));
  }, []);

  // Save selected criteria to localStorage
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
        setCustomAmenities(JSON.parse(savedCustom));
      } catch (e) {
        // Keep default empty array
      }
    }
  }, []);

  // Save custom amenities to localStorage
  useEffect(() => {
    localStorage.setItem('customAmenities', JSON.stringify(customAmenities));
  }, [customAmenities]);

  // Auto-refresh when radius changes (if we already have a report)
  useEffect(() => {
    if (report && location) performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  // Auto-refresh when selected amenities change (if we already have a report)
  useEffect(() => {
    if (report && location) performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCriteria]);

  const toggleCriterion = (key) => {
    const newSelected = new Set(selectedCriteria);
    newSelected.has(key) ? newSelected.delete(key) : newSelected.add(key);
    setSelectedCriteria(newSelected);
  };

  const toggleAmenity = (key) => {
    const newExpanded = new Set(expandedAmenities);
    newExpanded.has(key) ? newExpanded.delete(key) : newExpanded.add(key);
    setExpandedAmenities(newExpanded);
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    newExpanded.has(section) ? newExpanded.delete(section) : newExpanded.add(section);
    setExpandedSections(newExpanded);
  };

  const updateCustomAmenity = (index, value) => {
    const newCustom = [...customAmenities];
    newCustom[index] = value;
    setCustomAmenities(newCustom);
  };

  const handleSortChange = (key, order) => {
    setSortOrders(prev => ({ ...prev, [key]: order }));
  };

  const performSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await evaluateLocation({ location, radius, selectedCriteria, customAmenities });
      setReport(data);
    } catch (err) {
      setError(err.message || 'Network error - is the API server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performSearch();
  };

  // Build filtered amenities for map display
  const filteredAmenities = report ? (() => {
    const standardCriteria = new Set(availableCriteria.map(c => c.key));
    return Object.fromEntries(
      Object.entries(report.amenities)
        .filter(([key]) => selectedCriteria.has(key) || !standardCriteria.has(key))
        .map(([key, data]) => {
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
  })() : null;

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
            {/* Location Input */}
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

            {/* Map */}
            {report && filteredAmenities && (
              <LocationMap
                center={report.coordinates}
                amenities={filteredAmenities}
                radiusMiles={parseFloat(radius)}
                controlRef={mapControlRef}
              />
            )}

            {/* Radius */}
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
            <CriteriaSelector
              availableCriteria={availableCriteria}
              selectedCriteria={selectedCriteria}
              onToggleCriterion={toggleCriterion}
              report={report}
              restaurantMinRating={restaurantMinRating}
              onRestaurantMinRatingChange={setRestaurantMinRating}
              expandedAmenities={expandedAmenities}
              onToggleAmenity={toggleAmenity}
              sortOrders={sortOrders}
              onSortChange={handleSortChange}
              mapControlRef={mapControlRef}
            />

            {/* Custom Amenities */}
            <CustomAmenities
              customAmenities={customAmenities}
              onUpdateCustomAmenity={updateCustomAmenity}
              report={report}
              availableCriteria={availableCriteria}
              expandedAmenities={expandedAmenities}
              onToggleAmenity={toggleAmenity}
              sortOrders={sortOrders}
              onSortChange={handleSortChange}
            />
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
          <ReportPanel
            report={report}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            tempView={tempView}
            onTempViewChange={setTempView}
          />
        )}
      </div>
    </div>
  );
}
