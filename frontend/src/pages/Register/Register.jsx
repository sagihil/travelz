import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, isAuthenticated } from '../../services/authService.js';
import '../Login/Login.css';

function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const [form, setForm]           = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required.';
    if (!form.email.trim())     e.email     = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address.';
    if (!form.password)         e.password  = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(form.firstName, form.lastName, form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <span className="login-logo">✈️</span>
          <h1 className="login-title">TravelZ</h1>
          <p className="login-subtitle">Create your account</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className={`form-input ${errors.firstName ? 'input-error' : ''}`}
              type="text" placeholder="Hila" value={form.firstName} onChange={set('firstName')} disabled={loading} />
            {errors.firstName && <p className="field-error">{errors.firstName}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className={`form-input ${errors.lastName ? 'input-error' : ''}`}
              type="text" placeholder="Sagi" value={form.lastName} onChange={set('lastName')} disabled={loading} />
            {errors.lastName && <p className="field-error">{errors.lastName}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className={`form-input ${errors.email ? 'input-error' : ''}`}
              type="email" placeholder="hila@example.com" value={form.email} onChange={set('email')} disabled={loading} />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className={`form-input ${errors.password ? 'input-error' : ''}`}
              type="password" placeholder="Minimum 6 characters" value={form.password} onChange={set('password')} disabled={loading} />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className={`form-input ${errors.confirm ? 'input-error' : ''}`}
              type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} disabled={loading} />
            {errors.confirm && <p className="field-error">{errors.confirm}</p>}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Creating account...</> : 'Sign Up'}
          </button>

        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
          Already have an account? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Sign In</Link>
        </p>

      </div>
    </div>
  );
}

export default Register;
