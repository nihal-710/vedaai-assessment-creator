// All socket event names and payload types in one place

export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM:  'join_assignment_room',
  LEAVE_ROOM: 'leave_assignment_room',

  // Server → Client
  GENERATION_STARTED:   'generation_started',
  GENERATION_PROGRESS:  'generation_progress',
  GENERATION_COMPLETED: 'generation_completed',
  GENERATION_FAILED:    'generation_failed',
} as const;

export interface GenerationStartedPayload {
  assignmentId: string;
  jobId:        string;
  status:       'queued' | 'processing';
  progress:     number;
  message:      string;
}

export interface GenerationProgressPayload {
  assignmentId: string;
  jobId:        string;
  status:       'processing';
  progress:     number;
  step:         string;
  message:      string;
}

export interface GenerationCompletedPayload {
  assignmentId: string;
  jobId:        string;
  status:       'completed';
  progress:     100;
  resultId?:    string;
  message:      string;
}

export interface GenerationFailedPayload {
  assignmentId: string;
  jobId:        string;
  status:       'failed';
  progress:     number;
  message:      string;
  error?:       string;
}

// Progress data passed via BullMQ job.updateProgress()
export interface JobProgressData {
  assignmentId: string;
  jobId:        string;
  step:         string;
  message:      string;
  progress:     number;
}