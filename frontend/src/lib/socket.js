import { io } from 'socket.io-client';
import { API_BASE_URL } from './api.js';

let socket;

export function connectSocket(user) {
  if (!user?.id) {
    return null;
  }

  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }

  socket.emit('join_room', { room: `user:${user.id}` });
  socket.emit('join_room', { room: `user:${user.id}:caregivers` });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
