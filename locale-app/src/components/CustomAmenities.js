import React from 'react';
import ExpandableAmenityRow from './shared/ExpandableAmenityRow';

export default function CustomAmenities({
  customAmenities,
  onUpdateCustomAmenity,
  report,
  availableCriteria,
  expandedAmenities,
  onToggleAmenity,
  sortOrders,
  onSortChange,
}) {
  const standardKeys = new Set(availableCriteria.map(c => c.key));
  const customResults = report
    ? Object.entries(report.amenities).filter(([key]) => !standardKeys.has(key))
    : [];

  return (
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
            onChange={(e) => onUpdateCustomAmenity(index, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
          />
        ))}
      </div>

      {customResults.length > 0 && (
        <div className="space-y-2 mt-3">
          {customResults.map(([key, data]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <ExpandableAmenityRow
                key={key}
                label={label}
                data={data}
                isExpanded={expandedAmenities.has(key)}
                onToggle={() => onToggleAmenity(key)}
                sortBy={sortOrders[key] || 'distance'}
                onSortChange={(order) => onSortChange(key, order)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
