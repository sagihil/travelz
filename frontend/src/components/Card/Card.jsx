// components/Card/Card.jsx
// ------------------------
// Purpose: A generic, reusable card component used across the Dashboard page.
//
// Why it is reusable:
//   - All content is passed via props – the Card itself has no hardcoded data.
//   - The "variant" prop switches the visual style and data layout, making the
//     same component suitable for multiple entity types:
//       "stat"       – Displays a large numeric value with an icon (summary cards).
//       "attraction" – Displays a travel attraction with city, country, category,
//                      price, and rating details.
//   - Adding a new entity type only requires a new variant value and a
//     corresponding CSS class – the component structure does not change.
//
// Props:
//   variant    {string}  – "stat" | "attraction"  (controls layout)
//   title      {string}  – Main heading text
//   value      {string|number} – Large displayed value (stat variant only)
//   icon       {string}  – Emoji or symbol shown next to the title
//   city       {string}  – City name         (attraction variant)
//   country    {string}  – Country name      (attraction variant)
//   category   {string}  – Category label    (attraction variant)
//   price      {number}  – Admission price   (attraction variant)
//   rating     {number}  – Rating out of 5   (attraction variant)
//
// Used on the Dashboard page:
//   - 3 × stat cards (Total Attractions, Unique Countries, Total Users)
//   - 3 × attraction cards (featured / highlighted attractions)

import React from 'react';
import './Card.css';

function Card({
  variant = 'stat',
  title,
  value,
  icon,
  city,
  country,
  category,
  price,
  rating,
}) {
  // ── Stat Card ───────────────────────────────────────────────────────────
  // Shows a headline number (value) with a label (title) and a decorative icon.
  if (variant === 'stat') {
    return (
      <div className="card card--stat">
        <div className="card-icon">{icon}</div>
        <div className="card-body">
          <p className="card-value">{value}</p>
          <p className="card-title">{title}</p>
        </div>
      </div>
    );
  }

  // ── Attraction Card ─────────────────────────────────────────────────────
  // Shows detailed information about a single travel attraction.
  return (
    <div className="card card--attraction">
      {/* Header: icon + attraction name */}
      <div className="card-header">
        <span className="card-icon">{icon || '🗺️'}</span>
        <h3 className="card-title">{title}</h3>
      </div>

      {/* Location */}
      <p className="card-location">
        📍 {city}, {country}
      </p>

      {/* Category badge */}
      <span className="card-category">{category}</span>

      {/* Price and rating row */}
      <div className="card-footer">
        <span className="card-price">
          {price === 0 ? 'Free' : `$${price}`}
        </span>
        <span className="card-rating">
          ⭐ {rating}
        </span>
      </div>
    </div>
  );
}

export default Card;
