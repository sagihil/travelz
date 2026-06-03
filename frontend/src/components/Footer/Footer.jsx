// components/Footer/Footer.jsx
// ----------------------------
// Purpose: A reusable footer component displayed at the bottom of every
//          authenticated page (Dashboard and Settings).
//
// Why this component is reusable:
//   - It accepts NO props – all content is defined once in this single file.
//   - Any page that needs a footer simply imports and renders <Footer />.
//   - Adding the footer to a new page requires exactly one line of JSX.
//   - If team members, the slogan, or the project name ever change, only this
//     file needs to be updated – no other page is affected.
//
// What is displayed:
//   - Project name: "TravelZ" with a plane emoji.
//   - Slogan:       "Plan Less, Experience More".
//   - Team section: names of all team members listed individually.
//   - Copyright:    current year generated dynamically (see below).
//
// How the current year is generated dynamically:
//   new Date().getFullYear() returns the 4-digit year of the current date at
//   runtime. Because it is evaluated every time the component renders, the
//   copyright line always shows the correct year without any manual editing.
//
// Props:        none
// State:        none
// API calls:    none

import React from 'react';
import './Footer.css';

// Team members listed here so adding a new member only requires editing this array.
const TEAM_MEMBERS = ['Hila Sagi', 'Chen Birnfeld'];

function Footer() {
  // Dynamically computed – never needs a manual update as years pass
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* ── Left: brand + slogan ─────────────────────────────── */}
        <div className="footer-brand">
          <span className="footer-logo">✈️ TravelZ</span>
          <p className="footer-slogan">Plan Less, Experience More</p>
        </div>

        {/* ── Centre: team members ─────────────────────────────── */}
        <div className="footer-team">
          <p className="footer-team-label">Team</p>
          <ul className="footer-team-list">
            {/* Render each team member from the TEAM_MEMBERS array.
                Using .map() means adding a new member is a single-line edit. */}
            {TEAM_MEMBERS.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>

        {/* ── Right: copyright ─────────────────────────────────── */}
        <div className="footer-copyright">
          © {currentYear} TravelZ. All rights reserved.
        </div>

      </div>
    </footer>
  );
}

export default Footer;
