// pages/Settings/Settings.jsx
// ----------------------------
// Purpose: Allows the authenticated user to view and update their profile settings.
//
// Editable settings:
//   1. First Name  – synced with the backend via PUT /api/settings
//   2. Last Name   – synced with the backend via PUT /api/settings
//   3. Email       – synced with the backend via PUT /api/settings
//   4. Theme       – 'light' | 'dark', applied via a CSS class on <html>
//
// Backend endpoints used (via settingsService):
//   GET /api/settings  – Loads current firstName, lastName, email, userRole, theme.
//   PUT /api/settings  – Saves all updated fields to the backend.
//
// ── Why we validate on the frontend BEFORE the PUT request ───────────────
// Sending invalid data to the backend wastes a network round-trip and forces
// the server to return an error that the frontend must then parse and re-map
// to the correct field. Frontend validation is instant, offline, and gives the
// user a direct red message under the exact field that is wrong. The backend
// PUT is called ONLY after every field has passed all rules.
//
// ── Email validation ──────────────────────────────────────────────────────
// The email field uses type="text" (not type="email") to prevent any browser
// from silently trimming, correcting, or skipping our custom regex check.
// All email validation is handled exclusively by EMAIL_REGEX so the behaviour
// is identical across every browser.
//
// EMAIL_REGEX breakdown:  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
//   ^[^\s@]+    – local part: one or more chars that are NOT whitespace or @
//   @           – literal @ symbol
//   [^\s@]+     – domain: one or more chars that are NOT whitespace or @
//   \.          – literal dot
//   [^\s@]{2,}$ – TLD: at least 2 chars, no whitespace or @
//   Examples that PASS:  hila@travelz.com  user@example.co.il  a@b.org
//   Examples that FAIL:  hila  hila@  @travelz.com  hila@travelz  h@b.c
//
// ── Name validation ───────────────────────────────────────────────────────
// NAME_REGEX accepts only letters, with optional single spaces or hyphens
// between word groups (e.g. "Ben David", "Jean-Pierre"). Numbers and special
// characters such as @, !, 1, # are all rejected.
//
// ── Form state management ─────────────────────────────────────────────────
// A single `form` state object holds all field values. Every input calls
// handleChange, which updates the relevant key and clears that field's error.
// handleBlur runs the same validate() on focus-out so the user sees errors
// before they ever click Save.
//
// ── Error state management ────────────────────────────────────────────────
//   fieldErrors – per-field messages shown under each input.
//   error       – global banner for network / server failures only.
// These two are independent: a field error never overwrites a server error.
//
// Components used: Navbar, Footer
// State managed: form, loading, saving, successMsg, error, fieldErrors, userRole

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import { getSettings, updateSettings, applyTheme } from '../../services/settingsService.js';
import './Settings.css';

// ---------------------------------------------------------------------------
// Validation constants – defined at module level so they are compiled once.
// ---------------------------------------------------------------------------

// Accepts: "Hila", "Ben David", "Jean-Pierre"
// Rejects: "H1la", "Ben@David", "123", "!Hila"
const NAME_REGEX = /^[a-zA-Z]+([ \-][a-zA-Z]+)*$/;

// Requires: local-part @ domain . TLD (min 2 chars)
// Accepts:  hila@travelz.com  |  user@example.co.il  |  a@b.org
// Rejects:  hila  |  hila@  |  @travelz.com  |  hila@travelz  |  h@b.c
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------------------------------------------------------------------------

function Settings() {
  // ── Form state ────────────────────────────────────────────────────────
  // Single controlled-input hub. Every field lives here so we can pass
  // the whole object to updateSettings() in one call.
  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    theme:     'light',
  });

  // ── UI state ──────────────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(true);   // initial GET in-flight
  const [saving,      setSaving]      = useState(false);  // PUT in-flight
  const [successMsg,  setSuccessMsg]  = useState('');
  const [error,       setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});     // { firstName?, lastName?, email? }
  const [userRole,    setUserRole]    = useState('');     // display-only

  // ── Load settings on mount ────────────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError('');
      try {
        // GET /api/settings – returns { firstName, lastName, email, theme, userRole }
        const settings = await getSettings();
        setForm({
          firstName: settings.firstName,
          lastName:  settings.lastName,
          email:     settings.email,
          theme:     settings.theme,
        });
        setUserRole(settings.userRole);
      } catch (err) {
        setError(err.message || 'Could not load settings. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // ── validate() ───────────────────────────────────────────────────────
  // Pure function: reads `form`, returns { fieldName: errorMessage }.
  // An empty object means every field is valid and the PUT may proceed.
  // Called both in handleBlur (single-field early warning) and in
  // handleSave (full check before submitting).
  const validate = () => {
    const errs = {};

    // First Name – required + letters only
    const firstName = form.firstName.trim();
    if (!firstName) {
      errs.firstName = 'First name is required.';
    } else if (!NAME_REGEX.test(firstName)) {
      errs.firstName = 'First name may only contain letters, spaces, or hyphens.';
    }

    // Last Name – required + letters only
    const lastName = form.lastName.trim();
    if (!lastName) {
      errs.lastName = 'Last name is required.';
    } else if (!NAME_REGEX.test(lastName)) {
      errs.lastName = 'Last name may only contain letters, spaces, or hyphens.';
    }

    // Email – required + must satisfy EMAIL_REGEX
    // "hila"            → fails (no @)
    // "hila@"           → fails (nothing after @)
    // "hila@travelz"    → fails (no dot + TLD)
    // "hila@travelz.com" → passes
    const email = form.email.trim();
    if (!email) {
      errs.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email)) {
      errs.email = 'Please enter a valid email address (e.g. user@example.com).';
    }

    return errs;
  };

  // ── handleChange ─────────────────────────────────────────────────────
  // Updates the form state for the changed field.
  // Clears that field's error immediately so the red border disappears as
  // soon as the user starts correcting their input.
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    // Remove the error for this specific field as soon as the user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Theme is applied live – no save required for the visual preview
    if (name === 'theme') {
      applyTheme(value);
    }
  };

  // ── handleBlur ───────────────────────────────────────────────────────
  // Runs when the user leaves a field (focus out / tab away).
  // Validates only that one field so errors appear BEFORE the user clicks
  // Save – giving early feedback without interrupting mid-typing.
  const handleBlur = (e) => {
    const { name } = e.target;

    // Run the full validation; extract only the error for this field
    const allErrors = validate();

    if (allErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: allErrors[name] }));
    }
    // If the field is now valid, handleChange already cleared the error
  };

  // ── handleSave ───────────────────────────────────────────────────────
  // The submit handler. Follows a strict sequential flow so that invalid
  // data can NEVER reach the backend.
  const handleSave = async (e) => {
    // Step 1 – prevent browser from reloading the page on form submit
    e.preventDefault();

    // Step 2 – clear any previous success banner or server-error banner
    setSuccessMsg('');
    setError('');

    // Step 3 – run ALL validations in one pass
    const validationErrors = validate();

    // Step 4 – if ANY field failed, show the errors and STOP.
    //          The PUT request is NOT sent.
    //          localStorage is NOT updated.
    //          No success message is shown.
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return; // ← hard stop: nothing below this line will execute
    }

    // Step 5 – all fields are valid; clear any leftover field errors
    setFieldErrors({});

    // Step 6 – send the PUT request to the backend
    setSaving(true);
    try {
      await updateSettings({
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim(),
        theme:     form.theme,
      });

      // Step 7 – show success banner; auto-dismiss after 3 seconds
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      // Step 8 – network or server error: show banner but keep form editable
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-layout">
      <Navbar />

      <main className="page-content">
        <div className="container">
          <div className="settings-page">

            {/* ── Page header ────────────────────────────────────── */}
            <div className="settings-header">
              <h1 className="settings-title">⚙️ Settings</h1>
              <p className="settings-subtitle">
                Manage your account preferences and profile information.
              </p>
            </div>

            {/* ── Loading state ───────────────────────────────────── */}
            {loading ? (
              <div className="settings-loading">
                <span className="settings-spinner" />
                <p>Loading your settings...</p>
              </div>
            ) : (
              /* noValidate disables all browser-native constraint validation
                 so our custom EMAIL_REGEX is the sole authority on email format. */
              <form className="settings-form" onSubmit={handleSave} noValidate>

                {/* Global success banner */}
                {successMsg && (
                  <div className="settings-alert settings-alert--success">
                    ✅ {successMsg}
                  </div>
                )}

                {/* Global network / server error banner */}
                {error && (
                  <div className="settings-alert settings-alert--error">
                    ⚠️ {error}
                  </div>
                )}

                {/* ── Profile fieldset ────────────────────────────── */}
                <fieldset className="settings-fieldset">
                  <legend className="fieldset-legend">Profile</legend>

                  {/* First Name + Last Name side by side */}
                  <div className="form-row">

                    {/* Setting 1 – First Name */}
                    <div className="form-group">
                      <label htmlFor="firstName" className="form-label">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        className={`form-input ${fieldErrors.firstName ? 'input-error' : ''}`}
                        value={form.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={saving}
                        placeholder="e.g. Hila"
                        autoComplete="given-name"
                      />
                      {fieldErrors.firstName && (
                        <p className="field-error" role="alert">{fieldErrors.firstName}</p>
                      )}
                    </div>

                    {/* Setting 2 – Last Name */}
                    <div className="form-group">
                      <label htmlFor="lastName" className="form-label">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        className={`form-input ${fieldErrors.lastName ? 'input-error' : ''}`}
                        value={form.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={saving}
                        placeholder="e.g. Sagi"
                        autoComplete="family-name"
                      />
                      {fieldErrors.lastName && (
                        <p className="field-error" role="alert">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Setting 3 – Email
                      type="text" (NOT type="email") so the browser never
                      modifies or skips the value before EMAIL_REGEX sees it. */}
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="text"
                      className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={saving}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {/* Error appears both on blur (early) and on submit attempt */}
                    {fieldErrors.email && (
                      <p className="field-error" role="alert">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Read-only role display */}
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <div className="role-display">
                      <span className={`role-badge role-${userRole}`}>{userRole}</span>
                      <span className="role-note">Role cannot be changed here.</span>
                    </div>
                  </div>
                </fieldset>

                {/* ── Preferences fieldset ────────────────────────── */}
                <fieldset className="settings-fieldset">
                  <legend className="fieldset-legend">Preferences</legend>

                  {/* Setting 4 – Theme (radio buttons; always a valid value) */}
                  <div className="form-group">
                    <label className="form-label">Theme Preference</label>
                    <div className="theme-options">
                      <label className={`theme-option ${form.theme === 'light' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={form.theme === 'light'}
                          onChange={handleChange}
                          disabled={saving}
                        />
                        <span className="theme-icon">☀️</span>
                        <span>Light</span>
                      </label>
                      <label className={`theme-option ${form.theme === 'dark' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={form.theme === 'dark'}
                          onChange={handleChange}
                          disabled={saving}
                        />
                        <span className="theme-icon">🌙</span>
                        <span>Dark</span>
                      </label>
                    </div>
                  </div>
                </fieldset>

                {/* ── Save button ──────────────────────────────────── */}
                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving || loading}
                >
                  {saving ? (
                    <>
                      <span className="btn-spinner" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>

              </form>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Settings;
