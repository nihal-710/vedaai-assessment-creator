import { Queue } from 'bullmq';
import { getBullMQConnection } from '../config/redis';
import { env } from '../config/env';

export interface GenerationJobData {
  assignmentId: string;
  jobRecordId:  string;
}

let queue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> {
  if (queue) return queue;

  queue = new Queue<GenerationJobData>(env.QUEUE_NAME, {
    connection: getBullMQConnection(),
    defaultJobOptions: {
      attempts:         3,
      backoff:          { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 },
      removeOnFail:     { age: 86400 },
    },
  });

  queue.on('error', (err) => {
    console.error('[Queue] Error:', err.message);
  });

  return queue;
}

export async function addGenerationJob(
  assignmentId: string,
  jobRecordId:  string
): Promise<string> {
  const q   = getGenerationQueue();
  const job = await q.add(
    'generate-paper',
    { assignmentId, jobRecordId },
    { jobId: jobRecordId }
  );
  return job.id ?? jobRecordId;
}