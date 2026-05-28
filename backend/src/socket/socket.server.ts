import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { QueueEvents } from 'bullmq';
import { env, isRedisAvailable } from '../config/env';
import { getBullMQConnection } from '../config/redis';
import { GenerationJob } from '../models/GenerationJob';
import { GeneratedPaper } from '../models/GeneratedPaper';
import {
  SOCKET_EVENTS,
  JobProgressData,
} from './socket.events';

let io: SocketServer | null = null;

// ─── Room helper ──────────────────────────────────────────────────────────────
function roomName(assignmentId: string): string {
  return 'assignment:' + assignmentId;
}

// ─── Initialize Socket.io server ──────────────────────────────────────────────
export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin:      env.FRONTEND_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log('[Socket] Client connected:', socket.id);

    // Client joins a room for a specific assignment
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (data: { assignmentId: string }) => {
      const room = roomName(data.assignmentId);
      socket.join(room);
      console.log('[Socket] Client', socket.id, 'joined room:', room);
      socket.emit('joined', { room, message: 'Joined room: ' + room });
    });

    // Client leaves a room
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data: { assignmentId: string }) => {
      const room = roomName(data.assignmentId);
      socket.leave(room);
      console.log('[Socket] Client', socket.id, 'left room:', room);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Client disconnected:', socket.id, '|', reason);
    });
  });

  // Start listening to BullMQ queue events if Redis is available
  if (isRedisAvailable()) {
    startQueueEventListener();
  }

  console.log('[Socket] Socket.io server initialized');
  return io;
}

// ─── Get socket instance (used by controllers) ────────────────────────────────
export function getIO(): SocketServer | null {
  return io;
}

export function emitToAssignment(
  assignmentId: string,
  event: string,
  data: object
): void {
  if (!io) return;
  io.to(roomName(assignmentId)).emit(event, data);
}

// ─── BullMQ QueueEvents listener ─────────────────────────────────────────────
// This runs in the SERVER process.
// Worker calls job.updateProgress(data) → BullMQ fires 'progress' event here
// → we emit to the correct Socket.io room

function startQueueEventListener(): void {
  const queueEvents = new QueueEvents(env.QUEUE_NAME, {
    connection: getBullMQConnection(),
  });

  // Job added to queue
  queueEvents.on('added', async ({ jobId }) => {
    try {
      const jobRecord = await GenerationJob.findById(jobId);
      if (!jobRecord) return;
      const assignmentId = jobRecord.assignmentId.toString();

      emitToAssignment(assignmentId, SOCKET_EVENTS.GENERATION_STARTED, {
        assignmentId,
        jobId,
        status:   'queued',
        progress: 0,
        message:  'Your assignment has been queued for generation',
      });
    } catch (err) {
      console.error('[QueueEvents] added error:', (err as Error).message);
    }
  });

  // Worker calls job.updateProgress()
  queueEvents.on('progress', async ({ jobId, data }) => {
    try {
      const progressData = data as unknown as JobProgressData;
      const jobRecord = await GenerationJob.findById(jobId);
      if (!jobRecord) return;
      const assignmentId = jobRecord.assignmentId.toString();

      emitToAssignment(assignmentId, SOCKET_EVENTS.GENERATION_PROGRESS, {
        assignmentId,
        jobId,
        status:   'processing',
        progress: progressData.progress ?? 0,
        step:     progressData.step    ?? 'processing',
        message:  progressData.message ?? 'Processing...',
      });
    } catch (err) {
      console.error('[QueueEvents] progress error:', (err as Error).message);
    }
  });

  // Job completed
  queueEvents.on('completed', async ({ jobId }) => {
    try {
      const jobRecord = await GenerationJob.findById(jobId);
      if (!jobRecord) return;
      const assignmentId = jobRecord.assignmentId.toString();

      // Find the result paper
      const paper = await GeneratedPaper.findOne({ assignmentId: jobRecord.assignmentId });

      emitToAssignment(assignmentId, SOCKET_EVENTS.GENERATION_COMPLETED, {
        assignmentId,
        jobId,
        status:   'completed',
        progress: 100,
        resultId: paper ? String(paper._id) : undefined,
        message:  'Your question paper has been generated successfully!',
      });
    } catch (err) {
      console.error('[QueueEvents] completed error:', (err as Error).message);
    }
  });

  // Job failed
  queueEvents.on('failed', async ({ jobId, failedReason }) => {
    try {
      const jobRecord = await GenerationJob.findById(jobId);
      if (!jobRecord) return;
      const assignmentId = jobRecord.assignmentId.toString();

      emitToAssignment(assignmentId, SOCKET_EVENTS.GENERATION_FAILED, {
        assignmentId,
        jobId,
        status:   'failed',
        progress: jobRecord.progress ?? 0,
        message:  'Generation failed. Please try again.',
        error:    failedReason,
      });
    } catch (err) {
      console.error('[QueueEvents] failed error:', (err as Error).message);
    }
  });

  queueEvents.on('error', (err) => {
    console.error('[QueueEvents] Error:', err.message);
  });

  console.log('[Socket] BullMQ QueueEvents listener started');
}