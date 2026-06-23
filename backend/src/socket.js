'use strict';
// socket.js — shared Socket.IO instance + online user registry
//
// Online users are keyed by socketId.
// getOnlineUsers() deduplicates by userId so a user with two tabs counts once.
// getOnlineCount() returns the number of unique logged-in users.

let _io = null;

// socketId → { socketId, userId, userName, role, loginTime }
const _onlineUsers = new Map();

module.exports = {
  init(io) { _io = io; },

  emit(event, data) {
    if (_io) _io.emit(event, data);
    else console.warn(`[socket] tried to emit "${event}" before init`);
  },

  getIO() { return _io; },

  // ── Online user registry ────────────────────────────────────────────────
  addUser(socketId, { userId, userName, role }) {
    _onlineUsers.set(socketId, {
      socketId,
      userId,
      userName,
      role,
      loginTime: new Date().toISOString(),
    });
  },

  getUser(socketId) {
    return _onlineUsers.get(socketId) ?? null;
  },

  removeUser(socketId) {
    _onlineUsers.delete(socketId);
  },

  // Deduplicated by userId — latest loginTime wins when same user has multiple tabs
  getOnlineUsers() {
    const byUser = new Map();
    for (const u of _onlineUsers.values()) {
      const existing = byUser.get(u.userId);
      if (!existing || u.loginTime > existing.loginTime) {
        byUser.set(u.userId, u);
      }
    }
    return [...byUser.values()].sort((a, b) =>
      new Date(b.loginTime) - new Date(a.loginTime)
    );
  },

  // Count of unique logged-in users (anonymous sockets that never sent user:join are excluded)
  getOnlineCount() {
    const ids = new Set(
      [..._onlineUsers.values()].map(u => u.userId).filter(Boolean)
    );
    return ids.size;
  },
};
