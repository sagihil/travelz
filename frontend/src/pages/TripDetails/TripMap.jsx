import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './TripMap.css';

// ── Day colours (cycles if more than 7 days) ──────────────────────────────
const DAY_COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#dc2626', // red
  '#d97706', // amber
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#be185d', // pink
];
const dayColor = (day) => DAY_COLORS[(Number(day) - 1) % DAY_COLORS.length];

// ── Custom circular marker with day number ────────────────────────────────
function makeDayIcon(day) {
  const color = dayColor(day);
  const html = `
    <div class="trip-map-marker" style="background:${color};border-color:${color}">
      <span class="trip-map-marker-day">${day}</span>
    </div>`;
  return L.divIcon({ html, className: '', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -20] });
}

// ── Auto-fit map bounds to all markers ───────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 10);
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [48, 48] });
    }
  }, [positions, map]); // eslint-disable-line
  return null;
}

// ── Category icons for popup ─────────────────────────────────────────────
const CAT_ICONS = {
  Landmark:'🗼', History:'🏛️', Architecture:'🏰', Nature:'🌿',
  Museum:'🎨', Beach:'🏖️', Religious:'🕌', Entertainment:'🎡',
  Park:'🌳', Default:'📍',
};
const catIcon = (cat) => CAT_ICONS[cat] ?? CAT_ICONS.Default;

// ── Main component ────────────────────────────────────────────────────────
function TripMap({ attractions }) {
  // Only render markers for attractions with valid, realistic coordinates
  const withCoords = attractions.filter(a => {
    const lat = Number(a.latitude);
    const lng = Number(a.longitude);
    return a.latitude != null && a.longitude != null &&
           !isNaN(lat) && !isNaN(lng) &&
           (lat !== 0 || lng !== 0) &&      // exclude (0,0) — Gulf of Guinea
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180;
  });

  if (withCoords.length === 0) {
    return (
      <div className="trip-map-empty">
        <span>🗺️</span>
        <p>No mapped attractions yet. Add attractions with coordinates to see the route.</p>
      </div>
    );
  }

  // Sort by dayNumber → orderInDay for the route line
  const sorted = [...withCoords].sort((a, b) => {
    const da = a.TripAttraction?.dayNumber  ?? 99;
    const db = b.TripAttraction?.dayNumber  ?? 99;
    const oa = a.TripAttraction?.orderInDay ?? 99;
    const ob = b.TripAttraction?.orderInDay ?? 99;
    return da !== db ? da - db : oa - ob;
  });

  const positions = sorted.map(a => [Number(a.latitude), Number(a.longitude)]);

  // Default centre: average of all points
  const defaultCenter = [
    positions.reduce((s, p) => s + p[0], 0) / positions.length,
    positions.reduce((s, p) => s + p[1], 0) / positions.length,
  ];

  // Build per-day polyline segments so each day gets its own colour
  const daySegments = [];
  let prevPos = null;
  let prevDay = null;
  sorted.forEach(attr => {
    const day = attr.TripAttraction?.dayNumber ?? 1;
    const pos = [Number(attr.latitude), Number(attr.longitude)];
    if (prevPos !== null) {
      daySegments.push({ from: prevPos, to: pos, day: prevDay });
    }
    prevPos = pos;
    prevDay = day;
  });

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      scrollWheelZoom
      className="trip-map-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds positions={positions} />

      {/* Route lines — one segment per pair of consecutive stops */}
      {daySegments.map((seg, idx) => (
        <Polyline
          key={idx}
          positions={[seg.from, seg.to]}
          color={dayColor(seg.day)}
          weight={3}
          opacity={0.75}
          dashArray="8 5"
        />
      ))}

      {/* Markers */}
      {sorted.map(attr => {
        const day = attr.TripAttraction?.dayNumber ?? 1;
        return (
          <Marker
            key={attr.id}
            position={[Number(attr.latitude), Number(attr.longitude)]}
            icon={makeDayIcon(day)}
          >
            <Popup maxWidth={260}>
              <div className="trip-map-popup">
                <div className="trip-map-popup-title">
                  {catIcon(attr.category)} {attr.name}
                </div>
                <div className="trip-map-popup-row">📍 {attr.city}, {attr.country}</div>
                <div className="trip-map-popup-row">⭐ {attr.rating}</div>
                <div className="trip-map-popup-row" style={{ color: dayColor(day), fontWeight: 600 }}>
                  Day {day}
                  {attr.TripAttraction?.orderInDay ? ` · Stop ${attr.TripAttraction.orderInDay}` : ''}
                </div>
                {attr.TripAttraction?.notes && (
                  <div className="trip-map-popup-notes">📝 {attr.TripAttraction.notes}</div>
                )}
                {attr.description && (
                  <div className="trip-map-popup-desc">
                    {attr.description.slice(0, 120)}{attr.description.length > 120 ? '…' : ''}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default TripMap;
