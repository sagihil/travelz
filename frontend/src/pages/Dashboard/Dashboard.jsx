// pages/Dashboard/Dashboard.jsx
// ------------------------------
// Purpose: Main application dashboard – the first page after login.
//
// ── Role-Based UI ────────────────────────────────────────────────────────────
// The dashboard adapts its UI to the authenticated user's role:
//
//   Admin   – full CRUD on Users and Attractions:
//               • "Create User" button in Users section header
//               • Edit + Delete buttons per user row
//               • "Create Attraction" button in Attractions section header
//               • Edit + Delete buttons per attraction row
//
//   Manager – partial access:
//               • Edit button per user row (no Create, no Delete)
//               • Edit button per attraction row (no Create, no Delete)
//
//   User    – read-only:
//               • No action buttons anywhere
//               • All tables are visible but non-editable
//
// ── Permission guards ─────────────────────────────────────────────────────────
// Every handler (handleSubmit, handleDeleteUser, handleDeleteAttraction)
// calls can(userRole, '…') before touching the API.  This prevents accidental
// 403 responses even if the button was somehow shown incorrectly.
//
// ── Sections ─────────────────────────────────────────────────────────────────
//   1. Overview        – 3 stat cards (all roles)
//   2. Role Overview   – permission matrix for the current role (all roles)
//   3. Users Mgmt      – DataTable with role-dependent action buttons
//   4. Attractions Mgmt– DataTable with role-dependent action buttons
//   5. Featured        – 3 attraction cards (all roles)
//
// Components: Navbar, Footer, Card, DataTable, Modal
// Services:   attractionsService, usersManagementService
// Utils:      permissions (can, getPermissions, PERMISSION_LABELS)

import React, { useState, useEffect, useCallback } from 'react';
import Navbar            from '../../components/Navbar/Navbar.jsx';
import Footer            from '../../components/Footer/Footer.jsx';
import Card              from '../../components/Card/Card.jsx';
import DataTable         from '../../components/DataTable/DataTable.jsx';
import Modal             from '../../components/Modal/Modal.jsx';
import NotificationsPanel from '../../components/Notifications/NotificationsPanel.jsx';
import { AttractionToastContainer, playNotificationSound } from '../../components/AttractionToast/AttractionToast.jsx';
import socket            from '../../services/socketService.js';
import { getStoredUser } from '../../services/authService.js';
import {
  getAllAttractions,
  createAttraction,
  updateAttraction,
  deleteAttraction,
} from '../../services/attractionsService.js';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../../services/usersManagementService.js';
import { can, getPermissions, PERMISSION_LABELS } from '../../utils/permissions.js';
import './Dashboard.css';

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------

const CATEGORY_ICONS = {
  Landmark:     '🗼',
  History:      '🏛️',
  Architecture: '⛪',
  Nature:       '🌿',
  Default:      '🗺️',
};

// Empty form states – spread into formData when a modal is opened
const USER_FORM_DEFAULTS       = { firstName: '', lastName: '', email: '', password: '', userRole: 'user' };
const ATTRACTION_FORM_DEFAULTS = { name: '', city: '', country: '', category: 'Landmark', description: '', rating: '0' };

// ---------------------------------------------------------------------------

function Dashboard() {
  // ── Current user (read from localStorage – no network call needed here) ──
  const currentUser = getStoredUser();
  const userRole    = currentUser?.userRole ?? 'user';
  const permissions = getPermissions(userRole);

  // ── Who can see the users list? ──────────────────────────────────────────
  // Regular users must NOT see the list of all users (names, emails, roles).
  // Exposing that data to every logged-in user would be a privacy violation
  // and is not required for their workflow – they only need to see attractions
  // and manage their own profile. Admin and manager need the users list to
  // perform their management duties.
  const canSeeUsers = userRole === 'admin' || userRole === 'manager';

  // ── Data state ─────────────────────────────────────────────────────────
  const [attractions,    setAttractions]    = useState([]);
  const [users,          setUsers]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');

  // ── Online users (live via socket) ─────────────────────────────────────
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // ── Real-time notifications (up to 20, newest first) ───────────────────
  const [notifications, setNotifications] = useState([]);
  const [toasts,        setToasts]        = useState([]);

  const addNotification = useCallback((type, message) => {
    setNotifications(prev => [
      { id: Date.now() + Math.random(), type, message, timestamp: new Date().toISOString() },
      ...prev,
    ].slice(0, 20));
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Subscribe to online-users updates
  useEffect(() => {
    const onOnlineUsers = ({ onlineUsers: count, users }) => {
      setOnlineCount(count);
      setOnlineUsers(users || []);
    };
    socket.on('onlineUsersUpdated', onOnlineUsers);
    return () => socket.off('onlineUsersUpdated', onOnlineUsers);
  }, []);

  // Subscribe to attraction Socket.IO events only
  useEffect(() => {
    const onAttractionCreated = ({ attraction, addedBy, message }) => {
      // Add to table immediately — no page refresh needed
      setAttractions(prev =>
        prev.some(a => a.id === attraction.id) ? prev : [...prev, attraction]
      );
      addNotification('attraction_created', message || `New attraction added: ${attraction.name}`);

      // Show large toast popup
      const soundEnabled = localStorage.getItem('travelz_notification_sound') !== 'false';
      if (soundEnabled) playNotificationSound();

      setToasts(prev => [
        { id: Date.now() + Math.random(), attraction, addedBy: addedBy || null },
        ...prev,
      ].slice(0, 5));
    };

    const onAttractionUpdated = ({ id, name, updatedFields, message }) => {
      // Patch the attraction in the table immediately
      setAttractions(prev =>
        prev.map(a => a.id === id ? { ...a, ...updatedFields, name } : a)
      );
      addNotification('attraction_updated', message || `Attraction updated: ${name}`);
    };

    socket.on('attraction_created', onAttractionCreated);
    socket.on('attraction_updated', onAttractionUpdated);

    return () => {
      socket.off('attraction_created', onAttractionCreated);
      socket.off('attraction_updated', onAttractionUpdated);
    };
  }, [addNotification]);

  // ── Action feedback (success banner auto-clears after 3 s) ─────────────
  const [actionMsg, setActionMsg] = useState('');

  // ── Modal state ─────────────────────────────────────────────────────────
  // mode: 'create' | 'edit'
  // type: 'user'   | 'attraction'
  // item: the row being edited (null when creating)
  const [modal,     setModal]     = useState({ isOpen: false, mode: 'create', type: 'user', item: null });
  const [formData,  setFormData]  = useState({});
  const [formError, setFormError] = useState('');
  const [submitting,setSubmitting]= useState(false);

  // ── Data loading ────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Only fetch the users list for roles that are allowed to see it.
      // Regular users get an empty array so the component renders correctly
      // without ever sending a request for user data they cannot view.
      const [attractionsData, usersData] = await Promise.all([
        getAllAttractions(),
        canSeeUsers ? getAllUsers() : Promise.resolve([]),
      ]);
      setAttractions(attractionsData);
      setUsers(usersData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Action message helper ───────────────────────────────────────────────
  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  // ── Modal helpers ───────────────────────────────────────────────────────
  const openCreateModal = (type) => {
    setFormData(type === 'user' ? { ...USER_FORM_DEFAULTS } : { ...ATTRACTION_FORM_DEFAULTS });
    setFormError('');
    setModal({ isOpen: true, mode: 'create', type, item: null });
  };

  const openEditModal = (type, item) => {
    if (type === 'user') {
      // PUT /api/users/:id only accepts firstName, lastName, userRole
      setFormData({ firstName: item.firstName, lastName: item.lastName, userRole: item.userRole });
    } else {
      setFormData({
        name:        item.name,
        city:        item.city,
        country:     item.country,
        category:    item.category,
        description: item.description || '',
        rating:      String(item.rating),
      });
    }
    setFormError('');
    setModal({ isOpen: true, mode: 'edit', type, item });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
    setFormData({});
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Form submit (create or edit) ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const { mode, type, item } = modal;

      if (type === 'user') {
        if (mode === 'create') {
          if (!can(userRole, 'canCreateUser')) { setFormError('You do not have permission to create users.'); return; }
          await createUser(formData);
          showSuccess('User created successfully.');
        } else {
          if (!can(userRole, 'canEditUser')) { setFormError('You do not have permission to edit users.'); return; }
          // Only send the fields the backend PUT endpoint accepts
          await updateUser(item.userId, {
            firstName: formData.firstName,
            lastName:  formData.lastName,
            userRole:  formData.userRole,
          });
          showSuccess('User updated successfully.');
        }
      } else {
        // Attractions – price and rating arrive as strings from the input; convert to numbers
        const attractionPayload = {
          name:        formData.name,
          city:        formData.city,
          country:     formData.country,
          category:    formData.category,
          description: formData.description,
          rating:      Number(formData.rating),
        };

        if (mode === 'create') {
          if (!can(userRole, 'canCreateAttraction')) { setFormError('You do not have permission to create attractions.'); return; }
          await createAttraction(attractionPayload);
          showSuccess('Attraction created successfully.');
        } else {
          if (!can(userRole, 'canEditAttraction')) { setFormError('You do not have permission to edit attractions.'); return; }
          await updateAttraction(item.id, attractionPayload);
          showSuccess('Attraction updated successfully.');
        }
      }

      closeModal();
      await loadData(); // Refresh tables
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete handlers ─────────────────────────────────────────────────────
  const handleDeleteUser = async (userId) => {
    if (!can(userRole, 'canDeleteUser')) return;
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await deleteUser(userId);
      showSuccess('User deleted.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  const handleDeleteAttraction = async (id) => {
    if (!can(userRole, 'canDeleteAttraction')) return;
    if (!window.confirm('Delete this attraction? This action cannot be undone.')) return;
    try {
      await deleteAttraction(id);
      showSuccess('Attraction deleted.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete attraction.');
    }
  };

  // ── Column definitions (computed per render; role-dependent Actions column) ──

  const userColumns = [
    { key: 'userId',    label: 'ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName',  label: 'Last Name' },
    { key: 'email',     label: 'Email' },
    {
      key: 'userRole',
      label: 'Role',
      render: (v) => <span className={`role-badge role-${v}`}>{v}</span>,
    },
    // Actions column – shown only when the current user can edit OR delete
    ...(can(userRole, 'canEditUser') || can(userRole, 'canDeleteUser')
      ? [{
          key: '_userActions',
          label: 'Actions',
          render: (_, row) => (
            <div className="table-actions">
              {can(userRole, 'canEditUser') && (
                <button className="btn-action btn-edit" onClick={() => openEditModal('user', row)}>
                  Edit
                </button>
              )}
              {can(userRole, 'canDeleteUser') && (
                <button className="btn-action btn-delete" onClick={() => handleDeleteUser(row.userId)}>
                  Delete
                </button>
              )}
            </div>
          ),
        }]
      : []),
  ];

  const attractionColumns = [
    { key: 'id',       label: '#' },
    { key: 'name',     label: 'Attraction' },
    { key: 'city',     label: 'City' },
    { key: 'country',  label: 'Country' },
    { key: 'category', label: 'Category' },
    { key: 'rating',   label: 'Rating', render: (v) => `⭐ ${v}` },
    // Actions column – shown only when the current user can edit OR delete
    ...(can(userRole, 'canEditAttraction') || can(userRole, 'canDeleteAttraction')
      ? [{
          key: '_attractionActions',
          label: 'Actions',
          render: (_, row) => (
            <div className="table-actions">
              {can(userRole, 'canEditAttraction') && (
                <button className="btn-action btn-edit" onClick={() => openEditModal('attraction', row)}>
                  Edit
                </button>
              )}
              {can(userRole, 'canDeleteAttraction') && (
                <button className="btn-action btn-delete" onClick={() => handleDeleteAttraction(row.id)}>
                  Delete
                </button>
              )}
            </div>
          ),
        }]
      : []),
  ];

  // ── Derived statistics ──────────────────────────────────────────────────
  const totalAttractions    = attractions.length;
  const uniqueCountries     = [...new Set(attractions.map((a) => a.country))].length;
  const totalUsers          = users.length;
  const featuredAttractions = attractions.slice(0, 3);

  // Top-rated attraction: scan once with reduce, keeping the entry whose
  // rating is highest. If two attractions tie, the first one found wins
  // (reduce keeps the accumulator on equal values). Falls back to null
  // when the array is empty so the card can show "N/A" instead of crashing.
  //
  // Why show this for regular users instead of "Registered Users":
  //   Regular users cannot see user-account data (privacy rule), so the
  //   third stat slot would otherwise be empty. Showing the top-rated
  //   attraction is both meaningful and relevant to their workflow –
  //   they are here to explore travel destinations, not manage accounts.
  const topRatedAttraction = attractions.length > 0
    ? attractions.reduce((best, a) => (a.rating > best.rating ? a : best))
    : null;

  // ── Modal form content ──────────────────────────────────────────────────
  // Returns the <form> JSX that lives inside the Modal.
  // Rendered conditionally so formData is never stale when the modal is closed.
  const renderModalForm = () => (
    <form className="modal-form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="modal-error">⚠️ {formError}</div>}

      {modal.type === 'user' ? (
        /* ── User form ─────────────────────────────────────────────── */
        <>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">First Name *</label>
              <input
                className="modal-input"
                name="firstName"
                type="text"
                value={formData.firstName || ''}
                onChange={handleFormChange}
                placeholder="e.g. Hila"
                required
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Last Name *</label>
              <input
                className="modal-input"
                name="lastName"
                type="text"
                value={formData.lastName || ''}
                onChange={handleFormChange}
                placeholder="e.g. Sagi"
                required
              />
            </div>
          </div>

          {/* Email – only on create (backend PUT does not update email) */}
          {modal.mode === 'create' && (
            <div className="modal-field">
              <label className="modal-label">Email <span className="modal-optional">(optional – auto-generated if blank)</span></label>
              <input
                className="modal-input"
                name="email"
                type="text"
                value={formData.email || ''}
                onChange={handleFormChange}
                placeholder="user@travelz.com"
              />
            </div>
          )}

          {/* Password – only on create */}
          {modal.mode === 'create' && (
            <div className="modal-field">
              <label className="modal-label">Password <span className="modal-optional">(optional – defaults to ChangeMe@1)</span></label>
              <input
                className="modal-input"
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleFormChange}
                placeholder="Min 6 characters"
              />
            </div>
          )}

          <div className="modal-field">
            <label className="modal-label">Role *</label>
            <select
              className="modal-select"
              name="userRole"
              value={formData.userRole || 'user'}
              onChange={handleFormChange}
            >
              <option value="user">user</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </>
      ) : (
        /* ── Attraction form ────────────────────────────────────────── */
        <>
          <div className="modal-field">
            <label className="modal-label">Attraction Name *</label>
            <input
              className="modal-input"
              name="name"
              type="text"
              value={formData.name || ''}
              onChange={handleFormChange}
              placeholder="e.g. Eiffel Tower"
              required
            />
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">City *</label>
              <input
                className="modal-input"
                name="city"
                type="text"
                value={formData.city || ''}
                onChange={handleFormChange}
                placeholder="e.g. Paris"
                required
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Country *</label>
              <input
                className="modal-input"
                name="country"
                type="text"
                value={formData.country || ''}
                onChange={handleFormChange}
                placeholder="e.g. France"
                required
              />
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Category *</label>
            <select
              className="modal-select"
              name="category"
              value={formData.category || 'Landmark'}
              onChange={handleFormChange}
            >
              <option value="Landmark">Landmark</option>
              <option value="History">History</option>
              <option value="Architecture">Architecture</option>
              <option value="Nature">Nature</option>
            </select>
          </div>

          <div className="modal-field">
            <label className="modal-label">Description</label>
            <textarea
              className="modal-input"
              name="description"
              rows={3}
              value={formData.description || ''}
              onChange={handleFormChange}
              placeholder="Short description of the attraction"
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Rating (0–5) *</label>
            <input
              className="modal-input"
              name="rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating ?? '0'}
              onChange={handleFormChange}
              required
            />
          </div>
        </>
      )}

      <div className="modal-actions">
        <button type="button" className="modal-btn-cancel" onClick={closeModal} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="modal-btn-submit" disabled={submitting}>
          {submitting ? 'Saving...' : modal.mode === 'create' ? 'Create' : 'Save Changes'}
        </button>
      </div>
    </form>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="page-layout">
      <Navbar />

      <main className="page-content">
        <div className="container">

          {/* ── Welcome header with role badge ──────────────────── */}
          <div className="dashboard-header">
            <div className="dashboard-header-row">
              <h1 className="dashboard-title">
                Welcome back, {currentUser?.firstName ?? 'Traveller'}! 👋
              </h1>
              <span className={`role-badge role-${userRole}`}>{userRole}</span>
            </div>
            <p className="dashboard-subtitle">
              Here is a live overview of TravelZ data from the server.
            </p>
          </div>

          {/* ── Global error banner ──────────────────────────────── */}
          {error && (
            <div className="alert-banner alert-banner--error">⚠️ {error}</div>
          )}

          {/* ── Global success banner (auto-clears) ─────────────── */}
          {actionMsg && (
            <div className="alert-banner alert-banner--success">✅ {actionMsg}</div>
          )}

          {/* ── Section 1: Overview (3 stat cards for every role) ── */}
          {/* The third card switches based on role:
              - Admin / Manager: "Registered Users" – they manage accounts
                and need a quick headcount visible on the dashboard.
              - Regular user: "Top Rated Attraction" – they cannot see user
                data (privacy rule) and are here to explore destinations,
                so an attraction-focused stat is more relevant to them.
              Both paths always produce exactly three visible cards so the
              grid layout never collapses to two columns. */}
          <section className="dashboard-section">
            <h2 className="section-title">Overview</h2>
            <div className="stats-grid stats-grid--4">
              <Card variant="stat" icon="🗺️" title="Total Attractions" value={loading ? '...' : totalAttractions} />
              <Card variant="stat" icon="🌍" title="Countries Covered"  value={loading ? '...' : uniqueCountries} />

              {canSeeUsers ? (
                <Card variant="stat" icon="👥" title="Registered Users" value={loading ? '...' : totalUsers} />
              ) : (
                <Card
                  variant="stat"
                  icon="🏆"
                  title="Top Rated Attraction"
                  value={loading ? '...' : (topRatedAttraction ? topRatedAttraction.name : 'N/A')}
                />
              )}

              {/* Live online users — all roles */}
              <Card variant="stat" icon="🟢" title="Active Users" value={`${onlineCount} Online`} />
            </div>
          </section>

          {/* ── Admin: Online Users Panel ────────────────────────── */}
          {userRole === 'admin' && (
            <section className="dashboard-section">
              <h2 className="section-title">Online Users</h2>
              {onlineUsers.length === 0 ? (
                <p className="empty-msg">No users currently online.</p>
              ) : (
                <div className="online-users-panel">
                  {onlineUsers.map((u, i) => (
                    <div key={i} className="online-user-row">
                      <span className="ou-dot" />
                      <span className="ou-name">{u.userName}</span>
                      <span className={`role-badge role-${(u.role || 'user').toLowerCase()}`}>
                        {u.role}
                      </span>
                      <span className="ou-time">
                        Active since {new Date(u.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Section 2: Role Overview (allowed permissions only) ─ */}
          {/* Why denied permissions are not shown:
              Showing red-X items for things the user cannot do clutters the
              UI with negative information that has no actionable value.
              A clean "here is what you CAN do" list is friendlier and clearer. */}
          <section className="dashboard-section">
            <h2 className="section-title">Role Overview</h2>
            <div className="role-overview-card">
              <div className="role-overview-header">
                <span>Your permissions as</span>
                <span className={`role-badge role-${userRole}`}>{userRole}</span>
              </div>

              {/* Build the list once so we can check length for the empty state */}
              {(() => {
                const allowed = Object.entries(PERMISSION_LABELS).filter(
                  ([key]) => permissions[key] === true
                );
                return allowed.length === 0 ? (
                  <p className="no-permissions-msg">
                    No special management permissions are assigned to this role.
                  </p>
                ) : (
                  <div className="permissions-grid">
                    {allowed.map(([key, label]) => (
                      <div key={key} className="permission-item allowed">
                        <span className="permission-icon">✅</span>
                        <span className="permission-label">{label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </section>

          {/* ── Section 3: Users Management (admin + manager only) ─ */}
          {/* Hidden for regular users: showing all registered users
              (names, emails, roles) to a regular user is a privacy violation
              and is not needed for their workflow. The backend enforces the
              same restriction via role-based authorization middleware. */}
          {canSeeUsers && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2 className="section-title">Users Management</h2>
                {can(userRole, 'canCreateUser') && (
                  <button className="btn-add" onClick={() => openCreateModal('user')}>
                    + Create User
                  </button>
                )}
              </div>
              <DataTable
                columns={userColumns}
                data={users}
                loading={loading}
                emptyMessage="No users found."
              />
            </section>
          )}

          {/* ── Section 4: Attractions Management ───────────────── */}
          <section id="section-attractions" className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Attractions Management</h2>
              {can(userRole, 'canCreateAttraction') && (
                <button className="btn-add" onClick={() => openCreateModal('attraction')}>
                  + Create Attraction
                </button>
              )}
            </div>
            <DataTable
              columns={attractionColumns}
              data={attractions}
              loading={loading}
              emptyMessage="No attractions found."
            />
          </section>

          {/* ── Section 5: Featured Attractions (all roles) ──────── */}
          <section className="dashboard-section">
            <h2 className="section-title">Featured Attractions</h2>
            {loading ? (
              <div className="cards-loading">Loading attractions...</div>
            ) : featuredAttractions.length === 0 ? (
              <p className="empty-msg">No attractions found.</p>
            ) : (
              <div className="attractions-grid">
                {featuredAttractions.map((attraction) => (
                  <Card
                    key={attraction.id}
                    variant="attraction"
                    title={attraction.name}
                    icon={CATEGORY_ICONS[attraction.category] ?? CATEGORY_ICONS.Default}
                    city={attraction.city}
                    country={attraction.country}
                    category={attraction.category}
                    price={attraction.price}
                    rating={attraction.rating}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Section 6: Live Activity / Notifications ─────────── */}
          <section className="dashboard-section">
            <h2 className="section-title">Live Activity</h2>
            <NotificationsPanel
              notifications={notifications}
              onClear={() => setNotifications([])}
            />
          </section>

        </div>
      </main>

      <Footer />

      {/* ── Attraction toast notifications ─────────────────────── */}
      <AttractionToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Create / Edit modal ────────────────────────────────── */}
      <Modal
        isOpen={modal.isOpen}
        title={`${modal.mode === 'create' ? 'Create' : 'Edit'} ${modal.type === 'user' ? 'User' : 'Attraction'}`}
        onClose={closeModal}
      >
        {modal.isOpen && renderModalForm()}
      </Modal>
    </div>
  );
}

export default Dashboard;
