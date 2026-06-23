import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar               from '../../components/Navbar/Navbar.jsx';
import Footer               from '../../components/Footer/Footer.jsx';
import Modal                from '../../components/Modal/Modal.jsx';
import IllustratedTravelMap from './IllustratedTravelMap.jsx';
import TravelAgentChat      from '../../components/TravelAgentChat/TravelAgentChat.jsx';
import { getStoredUser }    from '../../services/authService.js';
import {
  getTripById, getTripAttractions,
  addAttractionToTrip, removeAttractionFromTrip,
} from '../../services/tripsService.js';
import { getAllAttractions } from '../../services/attractionsService.js';
import { canModifyTripAttractions } from '../../utils/permissions.js';
import './TripDetails.css';

// Auto-assign dayNumbers to attractions that don't have one,
// so they spread across sequential days instead of piling on day 1.
function withAutoDay(attractions) {
  const sorted = [...attractions].sort((a, b) => {
    const da = a.TripAttraction?.dayNumber ?? Infinity;
    const db = b.TripAttraction?.dayNumber ?? Infinity;
    return da !== db ? da - db : a.id - b.id;
  });
  const maxAssigned = sorted.reduce((m, a) => {
    const d = a.TripAttraction?.dayNumber;
    return d && d > m ? d : m;
  }, 0);
  let next = maxAssigned;
  return sorted.map(attr => {
    if (attr.TripAttraction?.dayNumber) return attr;
    next += 1;
    return { ...attr, TripAttraction: { ...attr.TripAttraction, dayNumber: next } };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
function TripDetails() {
  const { id }        = useParams();
  const currentUser   = getStoredUser();
  const userRole      = currentUser?.userRole ?? 'user';
  const currentUserId = currentUser?.userId ?? currentUser?.id;

  const [trip,            setTrip]            = useState(null);
  const [tripAttractions, setTripAttractions] = useState([]);
  const [allAttractions,  setAllAttractions]  = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [actionMsg,       setActionMsg]       = useState('');
  const initialLoadDone = useRef(false); // prevents remounting TravelAgentChat on refresh

  // Add-attraction modal
  const [addModal,   setAddModal]   = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [dayNumber,  setDayNumber]  = useState('');
  const [notes,      setNotes]      = useState('');
  const [adding,     setAdding]     = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────
  // setLoading(true) is only called on the FIRST load — subsequent refreshes
  // (triggered by the AI chat after applying changes) silently update data
  // without unmounting the TravelAgentChat component.
  const load = async () => {
    if (!initialLoadDone.current) setLoading(true);
    setError('');
    try {
      const [tripData, tripAttr, allAttr] = await Promise.all([
        getTripById(id),
        getTripAttractions(id),
        getAllAttractions(),
      ]);
      setTrip(tripData);
      setTripAttractions(tripAttr || []);
      setAllAttractions(allAttr  || []);
    } catch (err) {
      setError(err.message || 'Failed to load trip.');
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const processedAttr = withAutoDay(tripAttractions);
  const days          = [...new Set(processedAttr.map(a => a.TripAttraction?.dayNumber ?? 1))].sort((a,b) => a-b);
  const available     = allAttractions.filter(a => !tripAttractions.some(ta => ta.id === a.id));
  const suggestedDay  = days.length > 0 ? Math.max(...days) + 1 : 1;
  const tripDayCount  = trip?.startDate && trip?.endDate
    ? Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1)
    : null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setSelectedId('');
    setDayNumber(String(suggestedDay));
    setNotes('');
    setAddModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setAdding(true);
    try {
      await addAttractionToTrip(id, Number(selectedId), {
        dayNumber: dayNumber ? Number(dayNumber) : undefined,
        notes:     notes || undefined,
      });
      showSuccess('Attraction added!');
      setAddModal(false);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to add attraction.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (attractionId) => {
    if (!window.confirm('Remove this attraction from the trip?')) return;
    try {
      await removeAttractionFromTrip(id, attractionId);
      showSuccess('Attraction removed.');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to remove attraction.');
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-layout">
      <Navbar />
      <main className="page-content">
        <div className="container td-loading">Loading trip itinerary…</div>
      </main>
      <Footer />
    </div>
  );

  if (!trip) return (
    <div className="page-layout">
      <Navbar />
      <main className="page-content">
        <div className="container">
          <p className="td-error">
            Trip not found. <Link to="/trips">← Back to Trips</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-content">
        <div className="container">

          <div className="td-breadcrumb">
            <Link to="/trips">{userRole === 'user' ? '← My Trips' : '← All Trips'}</Link>
          </div>

          {error     && <div className="alert-banner alert-banner--error">⚠️ {error}</div>}
          {actionMsg && <div className="alert-banner alert-banner--success">✅ {actionMsg}</div>}

          {/* ── Trip hero card ───────────────────────────────────────────── */}
          <div className="td-hero">
            <span className="td-hero-plane">✈️</span>
            <div className="td-hero-info">
              <h1 className="td-title">{trip.title}</h1>
              {trip.description && <p className="td-desc">{trip.description}</p>}
              <div className="td-meta">
                {trip.startDate && <span>📅 {trip.startDate}</span>}
                {trip.endDate   && <span> – {trip.endDate}</span>}
                {tripDayCount   && <span className="td-meta-sep">🗓 {tripDayCount} days</span>}
                {trip.User      && <span className="td-meta-sep">👤 {trip.User.name}</span>}
              </div>
            </div>
          </div>

          {/* ── Illustrated travel map ───────────────────────────────────── */}
          <section className="td-section">
            {(() => {
              const canModify = canModifyTripAttractions(userRole, trip?.userId, currentUserId);
              return (
                <IllustratedTravelMap
                  attractions={processedAttr}
                  onRemove={canModify ? handleRemove : undefined}
                  onAdd={canModify ? openAddModal : undefined}
                  canAdd={canModify && available.length > 0}
                />
              );
            })()}
          </section>

          {/* ── AI Travel Agent chat ─────────────────────────────────────── */}
          <section className="td-section">
            <TravelAgentChat tripId={id} onRefresh={load} />
          </section>

        </div>
      </main>
      <Footer />

      {/* ── Add Attraction modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={addModal}
        title="Add Attraction to Trip"
        onClose={() => setAddModal(false)}
      >
        {addModal && (
          <form className="modal-form" onSubmit={handleAdd}>
            <div className="modal-field">
              <label className="modal-label">Attraction *</label>
              <select
                className="modal-select"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                required
              >
                <option value="">— Select an attraction —</option>
                {available.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.city}, {a.country}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label className="modal-label">
                Day Number
                {tripDayCount && (
                  <span className="modal-optional"> (trip has {tripDayCount} days)</span>
                )}
              </label>
              <input
                className="modal-input"
                type="number"
                min="1"
                max={tripDayCount || 99}
                value={dayNumber}
                onChange={e => setDayNumber(e.target.value)}
                placeholder={`e.g. ${suggestedDay}`}
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Notes</label>
              <input
                className="modal-input"
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Book tickets in advance"
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setAddModal(false)}
                disabled={adding}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="modal-btn-submit"
                disabled={adding || !selectedId}
              >
                {adding ? 'Adding…' : 'Add to Itinerary'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default TripDetails;
