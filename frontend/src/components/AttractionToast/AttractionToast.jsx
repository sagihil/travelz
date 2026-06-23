import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AttractionToast.css';

const CATEGORY_ICONS = {
  Landmark:     '🗼',
  History:      '🏛️',
  Architecture: '⛪',
  Nature:       '🌿',
};

export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880,  ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
  } catch (_) {}
}

const AUTO_CLOSE_MS = 6000;

function AttractionToast({ toast, onClose }) {
  const [exiting, setExiting] = useState(false);
  const timerRef  = useRef(null);
  const exitingRef = useRef(false);

  const close = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    setTimeout(() => onClose(toast.id), 320);
  }, [onClose, toast.id]);

  useEffect(() => {
    timerRef.current = setTimeout(close, AUTO_CLOSE_MS);
    return () => clearTimeout(timerRef.current);
  }, []); // eslint-disable-line

  const icon = CATEGORY_ICONS[toast.attraction.category] ?? '🗺️';

  const handleView = () => {
    close();
    setTimeout(() => {
      document.getElementById('section-attractions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div
      className={`at-toast${exiting ? ' at-toast--exit' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="at-toast-header">
        <span className="at-toast-bell">🔔</span>
        <span className="at-toast-title">New Attraction Added</span>
        <button className="at-toast-close" onClick={close} aria-label="Close notification">✕</button>
      </div>

      <div className="at-toast-body">
        <span className="at-toast-cat-icon">{icon}</span>
        <div className="at-toast-info">
          <p className="at-toast-name">{toast.attraction.name}</p>
          <p className="at-toast-meta">
            {[toast.attraction.country, toast.attraction.category].filter(Boolean).join(' • ')}
          </p>
          {toast.addedBy && (
            <p className="at-toast-by">Added by <strong>{toast.addedBy}</strong></p>
          )}
        </div>
      </div>

      <div className="at-toast-footer">
        <button className="at-toast-view-btn" onClick={handleView}>
          View Attraction →
        </button>
      </div>

      <div className="at-toast-progress" />
    </div>
  );
}

export function AttractionToastContainer({ toasts, onClose }) {
  if (toasts.length === 0) return null;
  return (
    <div className="at-container" aria-label="Attraction notifications">
      {toasts.map(t => (
        <AttractionToast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}

export default AttractionToast;
