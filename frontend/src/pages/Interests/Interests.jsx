import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import { getStoredUser } from '../../services/authService.js';
import {
  getAllInterests,
  getUserInterests,
  addUserInterest,
  removeUserInterest,
  createCustomInterest,
} from '../../services/interestsService.js';
import './Interests.css';

const ICONS = {
  Adventure:'🧗', Beach:'🏖️', Culture:'🎭', 'Food & Drink':'🍜',
  History:'🏛️', Nature:'🌿', Nightlife:'🌃', Photography:'📷',
  'Religious Sites':'🕌', Shopping:'🛍️', Sport:'⚽', Architecture:'🏰',
  'Art & Museums':'🎨', Music:'🎵', Wildlife:'🦁', Hiking:'🥾',
  Skiing:'⛷️', Diving:'🤿', Cycling:'🚴', Backpacking:'🎒',
  'Luxury Travel':'💎', 'Budget Travel':'💰', 'Family Travel':'👨‍👩‍👧',
  'Solo Travel':'🧳', 'Romantic Trips':'❤️',
  Historical:'🏛️', Religious:'🕌', 'Amusement Park':'🎡',
  'Water Park':'💦', 'Theme Park':'🎠', Adventure:'🧗',
};
const icon = (name) => ICONS[name] ?? '🌍';

export default function Interests() {
  const currentUser = getStoredUser();
  const userId      = currentUser?.userId;

  const [myInterests,  setMyInterests]  = useState([]);  // user's saved interests
  const [allInterests, setAllInterests] = useState([]);  // every interest in DB
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [msg,          setMsg]          = useState('');

  // "Add existing" dropdown
  const [selectedDropdown, setSelectedDropdown] = useState('');
  const [addingExisting,   setAddingExisting]   = useState(false);

  // "Add custom" text field
  const [customName,   setCustomName]   = useState('');
  const [addingCustom, setAddingCustom] = useState(false);
  const customRef = useRef(null);

  // ── helpers ──────────────────────────────────────────────────────────────
  const showMsg = (text, isError = false) => {
    if (isError) setError(text);
    else { setMsg(text); setTimeout(() => setMsg(''), 3000); }
  };

  const myIds = new Set(myInterests.map(i => i.id));

  // Interests available to add (not yet selected by this user)
  const dropdownOptions = allInterests.filter(i => !myIds.has(i.id));

  // ── load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [all, mine] = await Promise.all([
          getAllInterests(),
          userId ? getUserInterests(userId) : [],
        ]);
        setAllInterests(all  ?? []);
        setMyInterests(mine  ?? []);
      } catch (err) {
        showMsg(err.message || 'Failed to load interests.', true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  // ── remove one interest ───────────────────────────────────────────────────
  const handleRemove = async (interest) => {
    if (!userId) return;
    // Optimistic update
    setMyInterests(prev => prev.filter(i => i.id !== interest.id));
    try {
      await removeUserInterest(userId, interest.id);
      showMsg(`"${interest.name}" removed.`);
    } catch (err) {
      // Roll back on failure
      setMyInterests(prev => [...prev, interest]);
      showMsg(err.message || 'Failed to remove.', true);
    }
  };

  // ── add existing interest from dropdown ───────────────────────────────────
  const handleAddExisting = async () => {
    if (!selectedDropdown || !userId) return;
    const toAdd = allInterests.find(i => i.id === Number(selectedDropdown));
    if (!toAdd || myIds.has(toAdd.id)) return;

    setAddingExisting(true);
    setError('');
    try {
      await addUserInterest(userId, toAdd.id);
      setMyInterests(prev => [...prev, toAdd]);
      setSelectedDropdown('');
      showMsg(`"${toAdd.name}" added!`);
    } catch (err) {
      showMsg(err.message || 'Failed to add interest.', true);
    } finally {
      setAddingExisting(false);
    }
  };

  // ── add custom interest ───────────────────────────────────────────────────
  const handleAddCustom = async (e) => {
    e.preventDefault();
    const name = customName.trim();
    if (!name || !userId) return;
    setAddingCustom(true);
    setError('');
    try {
      const { id } = await createCustomInterest(name);
      const newInterest = { id, name };
      // Add to allInterests if brand new
      setAllInterests(prev => prev.some(i => i.id === id) ? prev : [...prev, newInterest]);
      // Add to myInterests if not already there
      setMyInterests(prev => prev.some(i => i.id === id) ? prev : [...prev, newInterest]);
      setCustomName('');
      customRef.current?.focus();
      showMsg(`"${name}" added!`);
    } catch (err) {
      showMsg(err.message || 'Failed to add custom interest.', true);
    } finally {
      setAddingCustom(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-content">
        <div className="container">

          <div className="int-header">
            <div>
              <h1 className="int-title">My Interests</h1>
              <p className="int-subtitle">
                {myInterests.length} interest{myInterests.length !== 1 ? 's' : ''} saved to your profile.
              </p>
            </div>
          </div>

          {error && <div className="alert-banner alert-banner--error">⚠️ {error}</div>}
          {msg   && <div className="alert-banner alert-banner--success">✅ {msg}</div>}

          {loading ? (
            <div className="int-loading">Loading…</div>
          ) : (
            <>
              {/* ── A: My Interests ──────────────────────────────────────── */}
              <section className="int-section">
                <h2 className="section-title">My Interests</h2>
                {myInterests.length === 0 ? (
                  <p className="int-empty">
                    No interests saved yet. Add some below!
                  </p>
                ) : (
                  <div className="int-chips">
                    {myInterests.map(i => (
                      <span key={i.id} className="int-chip int-chip--selected">
                        <span className="int-chip-icon">{icon(i.name)}</span>
                        {i.name}
                        <button
                          className="int-chip-remove"
                          onClick={() => handleRemove(i)}
                          title={`Remove ${i.name}`}
                          aria-label={`Remove ${i.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* ── B: Add Existing Interest (dropdown) ──────────────────── */}
              <section className="int-section">
                <h2 className="section-title">Add Existing Interest</h2>
                {dropdownOptions.length === 0 && allInterests.length === 0 ? (
                  <p className="int-empty">
                    No interests in database. Run <code>npm run db:seed</code> in the backend.
                  </p>
                ) : dropdownOptions.length === 0 ? (
                  <p className="int-empty">You have added all available interests!</p>
                ) : (
                  <div className="int-add-row">
                    <select
                      className="int-select"
                      value={selectedDropdown}
                      onChange={e => setSelectedDropdown(e.target.value)}
                      disabled={addingExisting}
                    >
                      <option value="">— Choose an interest —</option>
                      {dropdownOptions.map(i => (
                        <option key={i.id} value={i.id}>
                          {icon(i.name)}  {i.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-add"
                      onClick={handleAddExisting}
                      disabled={addingExisting || !selectedDropdown}
                    >
                      {addingExisting ? 'Adding…' : '+ Add'}
                    </button>
                  </div>
                )}
              </section>

              {/* ── C: Add Custom Interest ───────────────────────────────── */}
              <section className="int-section">
                <h2 className="section-title">Add Custom Interest</h2>
                <p className="int-hint">
                  Type a new interest that doesn't exist in the list above.
                  It will be created and added to your profile.
                </p>
                <form className="int-add-row" onSubmit={handleAddCustom}>
                  <input
                    ref={customRef}
                    className="int-text-input"
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Street Food, Paragliding, Hot Springs…"
                    disabled={addingCustom}
                  />
                  <button
                    type="submit"
                    className="btn-add"
                    disabled={addingCustom || !customName.trim()}
                  >
                    {addingCustom ? 'Adding…' : '+ Add'}
                  </button>
                </form>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
