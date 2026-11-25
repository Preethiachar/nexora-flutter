import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('nexora_token') },
    });
    socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
    socket.on('disconnect', () => console.log('[Socket] Disconnected'));
    socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));
  }
  return socket;
};

export const getSocket = () => socket;

export const joinGroup = (groupId) => socket?.emit('join_group', groupId);
export const leaveGroup = (groupId) => socket?.emit('leave_group', groupId);
export const emitTyping = (groupId, userId, userName) =>
  socket?.emit('typing', { groupId, userId, userName });
export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
