import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports:       ['websocket', 'polling'],
      autoConnect:      true,
      reconnection:     true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinAssignmentRoom(assignmentId: string): void {
  const s = getSocket();
  s.emit('join_assignment_room', { assignmentId });
  console.log('[Socket] Joining room for assignment:', assignmentId);
}

export function leaveAssignmentRoom(assignmentId: string): void {
  if (socket) {
    socket.emit('leave_assignment_room', { assignmentId });
    console.log('[Socket] Leaving room for assignment:', assignmentId);
  }
}