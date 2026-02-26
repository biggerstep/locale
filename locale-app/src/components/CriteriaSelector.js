import React from 'react';

export default function CriteriaSelector({
  availableCriteria,
  selectedCriteria,
  onToggleCriterion,
  report,
  restaurantMinRating,
  onRestaurantMinRatingChange,
  expandedAmenities,
  onToggleAmenity,
  sortOrders,
  onSortChange,
  mapControlRef,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select amenities to evaluate
      </label>
      <div className="grid grid-cols-2">
        {availableCriteria.map(criterion => {
          let amenityData = report?.amenities?.[criterion.key];
          if (amenityData && criterion.key === 'restaurants') {
            const minRating = parseFloat(restaurantMinRating);
            const filteredPlaces = amenityData.places.filter(place => {
              if (minRating === 0) return true;
              if (typeof place.rating !== 'number') return false;
              return place.rating >= minRating;
            });
            amenityData = { count: filteredPlaces.length, places: filteredPlaces };
          }
          const isExpanded = expandedAmenities.has(criterion.key);
          const sortBy = sortOrders[criterion.key] || 'distance';
          const sortedPlaces = [...(amenityData?.places || [])].sort((a, b) => {
            if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
            return (a.distance || 0) - (b.distance || 0);
          });

          return (
            <div key={criterion.key} className="odd:pr-4 even:pl-4 even:border-l even:border-gray-200">
              <div className="flex items-center justify-between py-1.5">
                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedCriteria.has(criterion.key)}
                    onChange={() => onToggleCriterion(criterion.key)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">{criterion.label}</span>
                </label>
                <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                  {criterion.key === 'restaurants' && (
                    <select
                      value={restaurantMinRating}
                      onChange={(e) => onRestaurantMinRatingChange(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="px-1 py-0.5 text-xs border border-gray-300 rounded outline-none"
                      title="Minimum rating"
                    >
                      <option value="0">Any ⭐</option>
                      <option value="3">3+ ⭐</option>
                      <option value="4">4.0+ ⭐</option>
                      <option value="4.5">4.5+ ⭐</option>
                      <option value="5">5 ⭐</option>
                    </select>
                  )}
                  {amenityData && (
                    <span className="text-xs text-gray-500 font-medium w-6 text-right">{amenityData.count}</span>
                  )}
                  {amenityData && (
                    <button
                      type="button"
                      onClick={() => onToggleAmenity(criterion.key)}
                      className="text-gray-400 hover:text-gray-600 transition p-0.5"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {isExpanded && amenityData && (
                <div className="mb-2 ml-6 border-l-2 border-gray-100 pl-3">
                  {amenityData.places.length > 0 && (
                    <div className="flex gap-3 pb-1 text-xs text-gray-400">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`sort-${criterion.key}`}
                          value="distance"
                          checked={sortBy === 'distance'}
                          onChange={() => onSortChange(criterion.key, 'distance')}
                        />
                        Nearest
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`sort-${criterion.key}`}
                          value="rating"
                          checked={sortBy === 'rating'}
                          onChange={() => onSortChange(criterion.key, 'rating')}
                        />
                        Rating
                      </label>
                    </div>
                  )}
                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                    {sortedPlaces.length === 0 ? (
                      <div className="text-xs text-gray-400 py-1">None found</div>
                    ) : sortedPlaces.map((place, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5 text-xs gap-2">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => mapControlRef.current?.openInfo(place.lat, place.lng)}
                            className="text-blue-600 hover:underline truncate text-left"
                          >
                            {place.name}
                          </button>
                          {place.rating && (
                            <span className="text-yellow-600 flex-shrink-0">⭐ {place.rating.toFixed(1)}</span>
                          )}
                        </div>
                        <span className="text-gray-400 flex-shrink-0">{place.distance} mi</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {selectedCriteria.size} of {availableCriteria.length} selected
      </p>
    </div>
  );
}
