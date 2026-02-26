import React, { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../../api';
import { categoryColors, categoryIcons } from './mapConstants';

export default function LocationMap({ center, amenities, radiusMiles, controlRef }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const openInfoWindowRef = useRef(null);
  const infoWindowsRef = useRef({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiKey, setApiKey] = useState(null);

  // Expose openInfo to parent via controlRef
  useEffect(() => {
    if (!controlRef) return;
    controlRef.current = {
      openInfo: (lat, lng) => {
        const entry = infoWindowsRef.current[`${lat},${lng}`];
        const map = mapInstanceRef.current;
        if (!entry || !map) return;
        if (openInfoWindowRef.current) openInfoWindowRef.current.close();
        entry.infoWindow.open(map, entry.marker);
        openInfoWindowRef.current = entry.infoWindow;
        map.panTo({ lat, lng });
        mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
  }, [controlRef]);

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
    if (mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
      ],
    });

    mapInstanceRef.current = map;

    const style = document.createElement('style');
    style.textContent = `
      .gm-style-iw { padding: 0 !important; }
      .gm-style-iw-d { overflow: hidden !important; padding: 0 !important; }
      .amenity-label {
        white-space: nowrap !important;
        pointer-events: none !important;
        text-shadow: -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff !important;
      }
    `;
    document.head.appendChild(style);

    map.addListener('click', () => {
      if (openInfoWindowRef.current) {
        openInfoWindowRef.current.close();
        openInfoWindowRef.current = null;
      }
    });

    new window.google.maps.Marker({
      position: { lat: center.lat, lng: center.lng },
      map,
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

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    infoWindowsRef.current = {};

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

    Object.entries(amenities).forEach(([category, data]) => {
      const icon = categoryIcons[category] || '📍';
      const color = categoryColors[category] || '#9CA3AF';
      const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      data.places?.forEach(place => {
        if (place.lat && place.lng) {
          const safeName = place.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const shortName = safeName.length > 15 ? safeName.slice(0, 14) + '…' : safeName;
          const svgIcon = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="96" height="46" viewBox="0 0 96 46">
                <text x="48" y="24" font-size="22" text-anchor="middle">${icon}</text>
                <rect x="2" y="27" width="92" height="16" rx="8" fill="white" fill-opacity="0.85"/>
                <text x="48" y="39" font-size="10" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" fill="${color}">${shortName}</text>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(96, 46),
            anchor: new window.google.maps.Point(48, 26),
          };

          const marker = new window.google.maps.Marker({
            position: { lat: place.lat, lng: place.lng },
            map,
            title: place.name,
            icon: svgIcon,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 24px 8px 8px 8px; min-width: 180px;">
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

          infoWindow.addListener('closeclick', () => {
            openInfoWindowRef.current = null;
          });

          infoWindowsRef.current[`${place.lat},${place.lng}`] = { marker, infoWindow };
          markersRef.current.push(marker);
          bounds.extend({ lat: place.lat, lng: place.lng });
        }
      });
    });

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
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm text-gray-700">Search Location</span>
          </div>
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
