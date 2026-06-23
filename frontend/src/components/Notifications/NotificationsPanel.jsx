import React from 'react';
import './NotificationsPanel.css';

const EVENT_META = {
  attraction_created: { icon: '🔔', label: 'New Attraction', color: '#16a34a' },
  attraction_updated: { icon: '🔔', label: 'Attraction Updated', color: '#2563eb' },
};

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function NotificationsPanel({ notifications, onClear }) {
  return (
    <div className="np-panel">
      <div className="np-header">
        <div className="np-title">
          <span className="np-bell">🔔</span>
          Live Attraction Activity
          {notifications.length > 0 && (
            <span className="np-count">{notifications.length}</span>
          )}
        </div>
        {notifications.length > 0 && (
          <button className="np-clear" onClick={onClear}>Clear all</button>
        )}
      </div>

      <div className="np-list">
        {notifications.length === 0 ? (
          <div className="np-empty">
            <span>📡</span>
            <p>No attraction activity yet.</p>
            <p className="np-empty-hint">
              When any user adds or updates an attraction, it appears here instantly.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const meta = EVENT_META[n.type] || { icon: '🔔', label: 'Update', color: '#64748b' };
            return (
              <div key={n.id} className="np-item" style={{ borderLeftColor: meta.color }}>
                <div className="np-item-top">
                  <span className="np-item-icon">{meta.icon}</span>
                  <span className="np-item-label" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="np-item-time">{formatTime(n.timestamp)}</span>
                </div>
                <p className="np-item-msg">{n.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationsPanel;
