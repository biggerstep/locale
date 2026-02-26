import React from 'react';

export default function ExpandableAmenityRow({ label, data, isExpanded, onToggle, sortBy, onSortChange }) {
  const count = data.count || 0;
  const places = data.places || [];

  const sortedPlaces = [...places].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
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
                    <span className="text-yellow-600 text-xs">⭐ {place.rating.toFixed(1)}</span>
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
