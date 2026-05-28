import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { env }                from '../config/env';
import { connectDB }          from '../config/db';
import { getBullMQConnection } from '../config/redis';
import { GenerationJobData }  from '../queues/generation.queue';
import { jobService }         from '../services/job.service';
import { resultService }      from '../services/result.service';
import { Assignment }         from '../models/Assignment';

async function processGenerationJob(job: Job<GenerationJobData>): Promise<void> {
  const { assignmentId, jobRecordId } = job.data;

  console.log('[Worker] Processing job:', job.id, '| assignment:', assignmentId);

  await jobService.updateStatus(jobRecordId, 'processing', {
    startedAt: new Date(),
    progress:  10,
  });
  await job.updateProgress(10);

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    await jobService.updateStatus(jobRecordId, 'failed', {
      errorMessage: 'Assignment not found',
      completedAt:  new Date(),
    });
    throw new Error('Assignment not found: ' + assignmentId);
  }

  await job.updateProgress(20);
  await jobService.updateStatus(jobRecordId, 'processing', { progress: 20 });

  console.log('[Worker] Generating paper for:', assignment.title);

  await job.updateProgress(40);
  await jobService.updateStatus(jobRecordId, 'processing', { progress: 40 });

  const paper = await resultService.generate(assignmentId);

  await job.updateProgress(90);
  await jobService.updateStatus(jobRecordId, 'processing', { progress: 90 });

  console.log('[Worker] Paper saved. ID:', String(paper._id));

  await jobService.updateStatus(jobRecordId, 'completed', {
    progress:    100,
    completedAt: new Date(),
  });
  await job.updateProgress(100);

  console.log('[Worker] Job completed:', job.id);
}

async function startWorker(): Promise<void> {
  await connectDB();

  const worker = new Worker<GenerationJobData>(
    env.QUEUE_NAME,
    processGenerationJob,
    {
      connection:  getBullMQConnection(),
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    console.log('[Worker] Completed:', job.id);
  });

  worker.on('failed', async (job, err) => {
    console.error('[Worker] Failed:', job?.id, err.message);
    if (job?.data?.jobRecordId) {
      await jobService.updateStatus(job.data.jobRecordId, 'failed', {
        errorMessage: err.message,
        completedAt:  new Date(),
      }).catch(console.error);

      await Assignment.findByIdAndUpdate(
        job.data.assignmentId,
        { status: 'failed' }
      ).catch(console.error);
    }
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err.message);
  });

  console.log('');
  console.log('  VedaAI Worker');
  console.log('  Queue: ' + env.QUEUE_NAME);
  console.log('  Concurrency: 2');
  console.log('  Waiting for jobs...');
  console.log('');

  process.on('SIGTERM', async () => {
    console.log('[Worker] Shutting down...');
    await worker.close();
    await mongoose.connection.close();
    process.exit(0);
  });
}

startWorker().catch((err) => {
  console.error('[Worker] Failed to start:', err.message);
  process.exit(1);
});