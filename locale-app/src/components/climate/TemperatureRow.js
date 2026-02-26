import React from 'react';

function TempDot({ temp }) {
  if (temp == null) return <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />;
  const normalized = Math.max(0, Math.min(1, (temp - 30) / 50));
  const hue = (1 - normalized) * 240;
  return (
    <div
      className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0"
      style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
      title={`${Math.round(temp)}°F`}
    />
  );
}

const VIEWS = ['annual', 'seasonal', 'monthly'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

export default function TemperatureRow({ annual, monthly, seasonal, view, onViewChange }) {
  const annualTemp = parseFloat(annual);
  const annualNormalized = !isNaN(annualTemp) ? Math.max(0, Math.min(1, (annualTemp - 30) / 50)) : null;
  const annualHue = annualNormalized != null ? (1 - annualNormalized) * 240 : null;

  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      {/* Label row with toggle */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Average Temperature</span>
          <div className="w-12 h-2 rounded-full flex-shrink-0" style={{
            background: 'linear-gradient(to right, hsl(240, 70%, 50%), hsl(120, 70%, 50%), hsl(0, 70%, 50%))'
          }} />
        </div>
        <div className="flex rounded-full border border-gray-200 overflow-hidden text-xs">
          {VIEWS.map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-2 py-0.5 capitalize transition ${view === v ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === 'annual' && (
        <div className="flex items-center justify-end gap-2">
          {annualHue != null && (
            <div
              className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0"
              style={{ backgroundColor: `hsl(${annualHue}, 70%, 50%)` }}
            />
          )}
          <span className="font-medium text-gray-900">{annual}</span>
        </div>
      )}

      {view === 'seasonal' && (
        <div className="flex justify-end gap-4">
          {SEASONS.map(s => (
            <div key={s} className="flex flex-col items-center gap-1">
              <TempDot temp={seasonal[s]} />
              <span className="text-xs text-gray-500">{s}</span>
              <span className="text-xs font-medium text-gray-900">
                {seasonal[s] != null ? `${Math.round(seasonal[s])}°F` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {view === 'monthly' && (
        <div className="flex flex-col gap-1 mt-1">
          {MONTH_NAMES.map(m => (
            <div key={m} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-6">{m}</span>
              <TempDot temp={monthly[m]} />
              <span className="text-xs font-medium text-gray-900 w-8 text-right">
                {monthly[m] != null ? `${Math.round(monthly[m])}°F` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
