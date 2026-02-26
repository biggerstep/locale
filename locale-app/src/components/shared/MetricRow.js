import React from 'react';

export default function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
