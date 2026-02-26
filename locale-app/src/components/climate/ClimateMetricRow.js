import React from 'react';

const US_AVG_TEMP = 52;    // °F
const US_AVG_PRECIP = 38;  // inches/year
const US_AVG_SUNNY = 205;  // days/year

export default function ClimateMetricRow({ label, value, type }) {
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
      const normalized = Math.max(0, Math.min(1, (temp - 30) / 50));
      const hue = (1 - normalized) * 240;
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
      const normalized = Math.max(0, Math.min(1, precip / 80));
      const lightness = 95 - (normalized * 50);
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
