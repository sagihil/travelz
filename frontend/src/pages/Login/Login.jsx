// pages/Login/Login.jsx
// ---------------------
// Purpose: The public login page. First screen the user sees.
//
// Behaviour:
//   1. Renders an email + password form.
//   2. Validates inputs on submit (client-side, before any network call):
//        - Email field is required.
//        - Email must match a valid format (regex).
//        - Password field is required.
//        - Password must be at least 6 characters.
//   3. On valid input, calls authService.login(email, password):
//        - The service fetches GET /users from the backend.
//        - Matches the email prefix (firstname.lastname) against the user list.
//        - On success: stores auth data in localStorage and redirects to /dashboard.
//        - On failure: displays an error message returned by the service.
//   4. Shows a loading spinner while the request is in-flight.
//   5. Shows a brief success banner before navigating away.
//   6. If the user is already logged in, redirects them to /dashboard immediately.
//
// Backend endpoint (via authService):
//   POST /api/auth/login  – validates email + exact password, returns { token, user }
//
// State managed:
//   email        – Controlled input value
//   password     – Controlled input value
//   errors       – Object with field-level validation error messages
//   loading      – True while the login request is in-flight
//   successMsg   – Shown briefly before redirect on successful login
//   serverError  – Error message returned by the backend / network

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, isAuthenticated } from '../../services/authService.js';
import './Login.css';

function Login() {
  const navigate = useNavigate();

  // ── Redirect if already logged in ──────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // ── Controlled form state ───────────────────────────────────────────────
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [errors, setErrors]         = useState({});       // field-level errors
  const [loading, setLoading]       = useState(false);    // request in-flight
  const [serverError, setServerError] = useState('');     // server / auth error
  const [successMsg, setSuccessMsg] = useState('');       // shown on success

  // ── Client-side validation ──────────────────────────────────────────────
  // Returns an errors object; empty object means no errors found.
  const validate = () => {
    const newErrors = {};

    // Email: required + format check
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password: required + minimum length
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    return newErrors;
  };

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();           // Prevent browser from refreshing the page
    setServerError('');           // Clear any previous server error
    setSuccessMsg('');

    // Step 1 – run client-side validation
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // Stop here; do not call the backend
    }
    setErrors({}); // Clear old errors

    // Step 2 – show loading state and call the backend via authService
    setLoading(true);
    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        // Step 3 – show brief success message then navigate to dashboard
        setSuccessMsg(`Welcome, ${result.user.firstName}! Redirecting...`);
        setTimeout(() => navigate('/dashboard', { replace: true }), 800);
      }
    } catch (err) {
      // Step 4 – display the error returned by authService
      setServerError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-card">

        {/* Brand header */}
        <div className="login-header">
          <span className="login-logo">✈️</span>
          <h1 className="login-title">TravelZ</h1>
          <p className="login-subtitle">Sign in to explore the world</p>
        </div>

        {/* Server-level error (wrong credentials / network down) */}
        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="alert alert-success" role="status">
            {successMsg}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Email field ─────────────────────────────────── */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="e.g. hila.sagi@travelz.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
            {/* Field-level validation error */}
            {errors.email && (
              <p className="field-error">{errors.email}</p>
            )}
          </div>

          {/* ── Password field ───────────────────────────────── */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="field-error">{errors.password}</p>
            )}
          </div>

          {/* ── Submit button ────────────────────────────────── */}
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
          Don't have an account? <Link to="/register" style={{ color: '#2563eb', fontWeight: 600 }}>Sign Up</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
