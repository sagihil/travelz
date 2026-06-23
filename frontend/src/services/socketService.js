import { io } from 'socket.io-client';
import { getStoredUser } from './authService.js';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
const socket = io(SOCKET_URL, {
  autoConnect:          true,
  reconnectionAttempts: 5,
  reconnectionDelay:    2000,
});

// Announce presence to the backend so this user appears in the online count.
// Safe to call multiple times — backend overwrites the same socketId entry.
export function announcePresence() {
  const user = getStoredUser();
  if (user && socket.connected) {
    socket.emit('user:join', {
      userId:   user.userId,
      userName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email,
      role:     user.userRole,
    });
  }
}

socket.on('connect', () => {
  console.log('[socket] connected →', socket.id);
  announcePresence(); // handles reconnects mid-session
});

socket.on('disconnect',    ()    => console.log('[socket] disconnected'));
socket.on('connect_error', (err) => console.warn('[socket] connection error:', err.message));

export default socket;
