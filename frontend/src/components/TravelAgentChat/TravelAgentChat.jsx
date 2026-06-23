import React, { useState, useRef, useEffect, useCallback } from 'react';
import { askTravelAgent } from '../../services/aiService.js';
import './TravelAgentChat.css';

const QUICK_PROMPTS = [
  'Plan my trip',
  'What attraction should I not miss?',
  'Add attractions based on my interests',
  'Which attraction is best for photography?',
  'Make itinerary balanced',
  'Why did you recommend these attractions?',
];

const CATEGORY_ICONS = {
  Landmark:     '🗼',
  History:      '🏛️',
  Architecture: '⛪',
  Nature:       '🌿',
  Adventure:    '🧗',
  Photography:  '📸',
};

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildSummary(applied) {
  const add    = applied.filter(a => a.type === 'ADD_ATTRACTION_TO_TRIP').length;
  const remove = applied.filter(a => a.type === 'REMOVE_ATTRACTION_FROM_TRIP').length;
  const update = applied.filter(a => a.type === 'UPDATE_TRIP_ATTRACTION').length;
  return [
    add    && `${add} added`,
    remove && `${remove} removed`,
    update && `${update} reordered`,
  ].filter(Boolean).join(', ');
}

// ── Recommendation card ───────────────────────────────────────────────────────
function RecommendationCard({ rec }) {
  const icon = CATEGORY_ICONS[rec.category] ?? '🗺️';
  const scores = rec.relevanceScores
    ? Object.entries(rec.relevanceScores).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="tac-rec-card">
      <div className="tac-rec-header">
        <span className="tac-rec-icon">{icon}</span>
        <div className="tac-rec-title">
          <span className="tac-rec-name">{rec.name}</span>
          <span className="tac-rec-meta">{rec.country}{rec.category ? ` • ${rec.category}` : ''}</span>
        </div>
      </div>

      {scores.length > 0 && (
        <div className="tac-rec-scores">
          {scores.map(([interest, score]) => (
            <div key={interest} className="tac-score-row">
              <span className="tac-score-label">{interest}</span>
              <div className="tac-score-track">
                <div
                  className="tac-score-fill"
                  style={{ width: `${score}%` }}
                  data-score={score}
                />
              </div>
              <span className="tac-score-pct">{score}%</span>
            </div>
          ))}
        </div>
      )}

      {rec.reason && <p className="tac-rec-reason">"{rec.reason}"</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function TravelAgentChat({ tripId, onRefresh }) {
  const [isOpen,   setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Auto-scroll whenever messages or loading state change
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, {
      role: 'user',
      content: text,
      time: timestamp(),
    }]);
    setLoading(true);

    try {
      const result = await askTravelAgent(tripId, text);
      const { message, applied = [], skipped = [], recommendations = [] } = result;

      setMessages(prev => [...prev, {
        role:            'ai',
        content:         message,
        time:            timestamp(),
        applied,
        skipped,
        recommendations,
      }]);

      if (applied.length > 0) onRefresh?.();
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    'ai',
        content: err.message,
        time:    timestamp(),
        applied: [],
        skipped: [],
        recommendations: [],
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, tripId, onRefresh]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const unreadCount = 0; // future: badge for collapsed state

  return (
    <div className="tac-wrapper">

      {/* ── Toggle header ───────────────────────────────────────────────── */}
      <button
        className={`tac-header${isOpen ? ' tac-header--open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
      >
        <span className="tac-header-left">
          <span className="tac-robot">🤖</span>
          <span className="tac-title">AI Travel Agent</span>
          <span className="tac-badge">Beta</span>
          {messages.length > 0 && !isOpen && (
            <span className="tac-history-hint">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
          )}
        </span>
        <span className="tac-chevron">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* ── Collapsible chat body ────────────────────────────────────────── */}
      {isOpen && (
        <div className="tac-body">

          {/* ── Messages ──────────────────────────────────────────────────── */}
          <div className="tac-messages" role="log" aria-live="polite">

            {/* Empty state */}
            {messages.length === 0 && !loading && (
              <div className="tac-empty">
                <p className="tac-empty-icon">✈️</p>
                <p className="tac-empty-title">AI Travel Agent</p>
                <p className="tac-empty-text">
                  I know your interests, your trip, and all available attractions.
                  Ask me to plan your itinerary, recommend specific attractions,
                  explain choices, or answer any travel question.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`tac-msg tac-msg--${msg.role}${msg.isError ? ' tac-msg--error' : ''}`}
              >
                {/* Avatar — AI only */}
                {msg.role === 'ai' && (
                  <div className="tac-avatar-wrap">
                    <span className="tac-avatar">{msg.isError ? '⚠️' : '🤖'}</span>
                  </div>
                )}

                <div className="tac-msg-col">
                  {/* Bubble */}
                  <div className="tac-bubble">
                    <p className="tac-bubble-text">{msg.content}</p>
                  </div>

                  {/* Recommendation cards */}
                  {msg.role === 'ai' && msg.recommendations?.length > 0 && (
                    <div className="tac-recommendations">
                      {msg.recommendations.map((rec, j) => (
                        <RecommendationCard key={j} rec={rec} />
                      ))}
                    </div>
                  )}

                  {/* Applied / skipped summary */}
                  {msg.role === 'ai' && (msg.applied?.length > 0 || msg.skipped?.length > 0) && (
                    <div className="tac-summary">
                      {msg.applied?.length > 0 && (
                        <span className="tac-tag tac-tag--ok">✅ {buildSummary(msg.applied)}</span>
                      )}
                      {msg.skipped?.map((s, j) => (
                        <span key={j} className="tac-tag tac-tag--warn">⚠️ Skipped: {s.reason}</span>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className={`tac-time tac-time--${msg.role}`}>{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="tac-msg tac-msg--ai">
                <div className="tac-avatar-wrap">
                  <span className="tac-avatar">🤖</span>
                </div>
                <div className="tac-msg-col">
                  <div className="tac-bubble tac-bubble--typing">
                    <span className="tac-dot" />
                    <span className="tac-dot" />
                    <span className="tac-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Quick prompts ──────────────────────────────────────────────── */}
          <div className="tac-prompts">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                className="tac-prompt-btn"
                onClick={() => sendMessage(p)}
                disabled={loading}
              >
                {p}
              </button>
            ))}
          </div>

          {/* ── Input row ──────────────────────────────────────────────────── */}
          <div className="tac-input-row">
            <input
              ref={inputRef}
              className="tac-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about your trip…"
              disabled={loading}
              maxLength={500}
            />
            <button
              className="tac-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              {loading ? '…' : '↑'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default TravelAgentChat;
