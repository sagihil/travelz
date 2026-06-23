import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar  from '../../components/Navbar/Navbar.jsx';
import Footer  from '../../components/Footer/Footer.jsx';
import Modal   from '../../components/Modal/Modal.jsx';
import { getStoredUser } from '../../services/authService.js';
import { getAllTrips, createTrip, updateTrip, deleteTrip } from '../../services/tripsService.js';
import { canEditTrip, canDeleteTrip } from '../../utils/permissions.js';
import './Trips.css';

const EMPTY_FORM = { title: '', description: '', startDate: '', endDate: '' };

function Trips() {
  const currentUser   = getStoredUser();
  const userRole      = currentUser?.userRole ?? 'user';
  const currentUserId = currentUser?.userId ?? currentUser?.id;

  const [trips,      setTrips]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [actionMsg,  setActionMsg]  = useState('');
  const [modal,      setModal]      = useState({ isOpen: false, mode: 'create', item: null });
  const [formData,   setFormData]   = useState({ ...EMPTY_FORM });
  const [formError,  setFormError]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllTrips();
      setTrips(data);
    } catch (err) {
      setError(err.message || 'Failed to load trips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const openCreate = () => {
    setFormData({ ...EMPTY_FORM });
    setFormError('');
    setModal({ isOpen: true, mode: 'create', item: null });
  };

  const openEdit = (trip) => {
    setFormData({
      title:       trip.title,
      description: trip.description || '',
      startDate:   trip.startDate   || '',
      endDate:     trip.endDate     || '',
    });
    setFormError('');
    setModal({ isOpen: true, mode: 'edit', item: trip });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
    setFormData({ ...EMPTY_FORM });
    setFormError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (!formData.title.trim()) { setFormError('Title is required.'); return; }
      if (modal.mode === 'create') {
        await createTrip(formData);
        showSuccess('Trip created!');
      } else {
        await updateTrip(modal.item.id, formData);
        showSuccess('Trip updated!');
      }
      closeModal();
      await load();
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await deleteTrip(id);
      showSuccess('Trip deleted.');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete.');
    }
  };

  const pageTitle    = userRole === 'user' ? 'My Trips' : 'All Trips';
  const pageSubtitle = userRole === 'user'
    ? 'Plan, manage, and explore your travel itineraries.'
    : 'Monitor and manage all user trips.';

  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-content">
        <div className="container">

          <div className="trips-header">
            <div>
              <h1 className="trips-title">{pageTitle}</h1>
              <p className="trips-subtitle">{pageSubtitle}</p>
            </div>
            <button className="btn-add" onClick={openCreate}>+ New Trip</button>
          </div>

          {error     && <div className="alert-banner alert-banner--error">⚠️ {error}</div>}
          {actionMsg && <div className="alert-banner alert-banner--success">✅ {actionMsg}</div>}

          {loading ? (
            <div className="trips-loading">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="trips-empty">
              <p>No trips yet. Create your first trip to get started!</p>
            </div>
          ) : (
            <div className="trips-grid">
              {trips.map(trip => (
                <div key={trip.id} className="trip-card">
                  <div className="trip-card-header">
                    <span className="trip-icon">✈️</span>
                    <div className="trip-card-actions">
                      {canEditTrip(userRole, trip.userId, currentUserId) && (
                        <button className="btn-action btn-edit" onClick={() => openEdit(trip)}>Edit</button>
                      )}
                      {canDeleteTrip(userRole, trip.userId, currentUserId) && (
                        <button className="btn-action btn-delete" onClick={() => handleDelete(trip.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                  <h3 className="trip-card-title">
                    <Link to={`/trips/${trip.id}`}>{trip.title}</Link>
                  </h3>
                  {trip.description && <p className="trip-card-desc">{trip.description}</p>}
                  <div className="trip-card-dates">
                    {trip.startDate && <span>📅 {trip.startDate}</span>}
                    {trip.endDate   && <span> → {trip.endDate}</span>}
                  </div>
                  {trip.User && <div className="trip-card-user">👤 {trip.User.name}</div>}
                  <Link to={`/trips/${trip.id}`} className="trip-view-link">View Details →</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Modal
        isOpen={modal.isOpen}
        title={modal.mode === 'create' ? 'Create New Trip' : 'Edit Trip'}
        onClose={closeModal}
      >
        {modal.isOpen && (
          <form className="modal-form" onSubmit={handleSubmit} noValidate>
            {formError && <div className="modal-error">⚠️ {formError}</div>}
            <div className="modal-field">
              <label className="modal-label">Title *</label>
              <input className="modal-input" name="title" type="text" value={formData.title} onChange={handleChange} placeholder="e.g. European Summer 2025" required />
            </div>
            <div className="modal-field">
              <label className="modal-label">Description</label>
              <textarea className="modal-input" name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="What is this trip about?" />
            </div>
            <div className="modal-row">
              <div className="modal-field">
                <label className="modal-label">Start Date</label>
                <input className="modal-input" name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
              </div>
              <div className="modal-field">
                <label className="modal-label">End Date</label>
                <input className="modal-input" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-btn-cancel" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button type="submit" className="modal-btn-submit" disabled={submitting}>
                {submitting ? 'Saving...' : modal.mode === 'create' ? 'Create Trip' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default Trips;
