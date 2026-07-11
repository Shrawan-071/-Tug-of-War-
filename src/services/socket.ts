import { io, Socket } from 'socket.io-client';

// Generate or retrieve persistent Session ID for reconnection support
export function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('tow_session_id');
  if (!sessionId) {
    sessionId = 'p_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('tow_session_id', sessionId);
  }
  return sessionId;
}

// Retrieve previously saved nickname & avatar
export function getSavedProfile(): { nickname: string; avatar: string } {
  const nickname = localStorage.getItem('tow_nickname') || '';
  const avatar = localStorage.getItem('tow_avatar') || '🦊';
  return { nickname, avatar };
}

export function saveProfile(nickname: string, avatar: string) {
  localStorage.setItem('tow_nickname', nickname.trim());
  localStorage.setItem('tow_avatar', avatar);
}

// Socket client instance
// In full-stack Node environments, the frontend is served on the same host & port
export const socket: Socket = io(window.location.origin, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000
});

export default socket;
