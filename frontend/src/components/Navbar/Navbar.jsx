// components/Navbar/Navbar.jsx
// ----------------------------
// Purpose: The top navigation bar displayed on all authenticated pages.
//
// Features:
//   - TravelZ brand name / logo.
//   - Navigation links to Dashboard and Settings (using React Router <Link>).
//   - Displays the logged-in user's full name (fetched from backend on mount).
//   - Logout button that calls authService.logout() and redirects to /login.
//
// Backend endpoints used:
//   GET /users/:id  – Loads the current user's profile via authService.getCurrentUser().
//
// Props: none (reads auth state from localStorage via authService)
//
// State managed:
//   user     – The full user object returned by the backend.
//   loading  – True while the GET /users/:id request is in flight.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logout, getStoredUser } from '../../services/authService.js';
import './Navbar.css';

function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Start with the locally cached user so the name appears instantly (no flicker)
  const [user, setUser]       = useState(getStoredUser());
  const [loading, setLoading] = useState(false);

  // Refresh user data from the backend every time the Navbar mounts or the
  // route changes, so the displayed name stays in sync with Settings changes.
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        // Network call: GET /users/:id
        const freshUser = await getCurrentUser();
        if (freshUser) setUser(freshUser);
      } catch {
        // If the network call fails, keep the cached user – degrade gracefully
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [location.pathname]); // Re-fetch whenever the active route changes

  // Handle logout: clear auth state then redirect to the login page.
  //
  // Why logout() is NOT awaited:
  //   logout() clears localStorage synchronously on its very first lines,
  //   before hitting any await. So by the time navigate() runs, localStorage
  //   is already empty and isAuthenticated() returns false. Awaiting would
  //   delay the redirect until the network round-trip completes – causing a
  //   visible pause with no benefit to the user.
  const handleLogout = () => {
    logout(); // clears localStorage synchronously; backend call runs in background
    navigate('/login', { replace: true });
  };

  // Helper: returns 'active' class when the link matches the current route
  const isActive = (path) => (location.pathname === path ? 'nav-link active' : 'nav-link');

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* ── Brand ──────────────────────────────────────────────── */}
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">✈️</span>
          <span className="brand-name">TravelZ</span>
        </Link>

        {/* ── Navigation Links ──────────────────────────────────── */}
        <ul className="navbar-links">
          <li>
            <Link to="/dashboard" className={isActive('/dashboard')}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/settings" className={isActive('/settings')}>
              Settings
            </Link>
          </li>
        </ul>

        {/* ── User Area ─────────────────────────────────────────── */}
        <div className="navbar-user">
          {/* Display user name; show a placeholder while loading */}
          <span className="user-greeting">
            {loading
              ? 'Loading...'
              : user
              ? `Hello, ${user.firstName} ${user.lastName}`
              : 'Welcome'}
          </span>

          {/* Role badge – helps visually identify admin / manager */}
          {user && (
            <span className={`role-badge role-${user.userRole}`}>
              {user.userRole}
            </span>
          )}

          {/* Logout button */}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
