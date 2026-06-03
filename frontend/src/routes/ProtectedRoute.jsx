// routes/ProtectedRoute.jsx
// -------------------------
// Purpose: A route guard component that prevents unauthenticated users from
//          accessing protected pages (Dashboard, Settings).
//
// How it works:
//   1. Calls isAuthenticated() which reads the 'travelz_auth' key from localStorage.
//   2. If the user IS authenticated  → renders the child component (the page).
//   3. If the user is NOT authenticated → immediately redirects them to /login
//      using React Router's <Navigate> component with replace=true so the
//      browser history does not include the unauthorised URL.
//
// Props:
//   children  – Any React node; typically a page component (<Dashboard />, <Settings />).
//
// This component contains no API calls and no local state.
// It is intentionally simple: a pure gating mechanism.

import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService.js';

function ProtectedRoute({ children }) {
  // Check authentication synchronously from localStorage
  const userIsAuthenticated = isAuthenticated();

  if (!userIsAuthenticated) {
    // Redirect to login page; "replace" removes the protected URL from history
    // so the back-button does not return the user to a page they cannot access
    return <Navigate to="/login" replace />;
  }

  // User is authenticated: render the requested page
  return children;
}

export default ProtectedRoute;
