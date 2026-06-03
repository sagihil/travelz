// App.jsx
// -------
// Purpose: Root component that wires together routing and theme management.
// - Sets up React Router with BrowserRouter for client-side navigation.
// - Defines three routes: /login, /dashboard, /settings.
// - Wraps /dashboard and /settings in <ProtectedRoute> so only authenticated
//   users can access them; unauthenticated visitors are redirected to /login.
// - Reads the saved theme preference from localStorage on first render and
//   applies it to the <html> element so CSS variables activate immediately.
//
// Components used: ProtectedRoute, Login, Dashboard, Settings
// State managed: none (auth state lives in localStorage, theme in CSS class)

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Login from './pages/Login/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Settings from './pages/Settings/Settings.jsx';

function App() {
  // Apply the stored theme class to <html> immediately on app load.
  // This prevents a flash of the wrong theme between page refreshes.
  useEffect(() => {
    const savedSettings = localStorage.getItem('travelz_settings');
    if (savedSettings) {
      const { theme } = JSON.parse(savedSettings);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route: anyone can visit /login */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes: only accessible when authenticated */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Default redirect: visiting "/" goes to /dashboard (or /login if not authed) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all: any unknown URL goes to /dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
