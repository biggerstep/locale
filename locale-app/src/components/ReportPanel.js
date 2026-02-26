import React from 'react';
import MetricRow from './shared/MetricRow';
import ClimateMetricRow from './climate/ClimateMetricRow';
import TemperatureRow from './climate/TemperatureRow';

export default function ReportPanel({ report, expandedSections, onToggleSection, tempView, onTempViewChange }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
      {/* Report Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">{report.location}</h2>
        <p className="text-sm text-gray-600">
          Within {report.radius_miles} miles • {report.coordinates.lat.toFixed(4)}°, {report.coordinates.lng.toFixed(4)}°
        </p>
      </div>

      {/* Climate Section */}
      <div className="mb-8">
        <button
          onClick={() => onToggleSection('climate')}
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
            <TemperatureRow
              annual={report.climate.avg_temp_f}
              monthly={report.climate.monthly_temps || {}}
              seasonal={report.climate.seasonal_temps || {}}
              view={tempView}
              onViewChange={onTempViewChange}
            />
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
  );
}
