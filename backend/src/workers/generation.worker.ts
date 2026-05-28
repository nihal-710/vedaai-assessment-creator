import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { env }                 from '../config/env';
import { connectDB }           from '../config/db';
import { getBullMQConnection }  from '../config/redis';
import { GenerationJobData }   from '../queues/generation.queue';
import { jobService }          from '../services/job.service';
import { Assignment }          from '../models/Assignment';
import { GeneratedPaper }      from '../models/GeneratedPaper';
import { generatePaperWithAi } from '../services/ai/gemini.service';
import { Types }               from 'mongoose';
import type { JobProgressData } from '../socket/socket.events';

// Helper to emit structured progress via BullMQ
// Server's QueueEvents listener picks this up and emits to Socket.io
async function emitProgress(
  job: Job<GenerationJobData>,
  jobRecordId: string,
  progress: number,
  step: string,
  message: string
): Promise<void> {
  const progressData: JobProgressData = {
    assignmentId: job.data.assignmentId,
    jobId:        jobRecordId,
    step,
    message,
    progress,
  };
  await job.updateProgress(progressData as unknown as number);
  await jobService.updateStatus(jobRecordId, 'processing', { progress });
}

async function processGenerationJob(job: Job<GenerationJobData>): Promise<void> {
  const { assignmentId, jobRecordId } = job.data;
  console.log('[Worker] Job started:', job.id, '| assignment:', assignmentId);

  // Step 1 — Mark processing
  await jobService.updateStatus(jobRecordId, 'processing', {
    startedAt: new Date(),
    progress:  5,
  });
  await emitProgress(job, jobRecordId, 5, 'started', 'Processing your assignment...');

  // Step 2 — Fetch assignment
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    await jobService.updateStatus(jobRecordId, 'failed', {
      errorMessage: 'Assignment not found',
      completedAt:  new Date(),
    });
    throw new Error('Assignment not found: ' + assignmentId);
  }

  await emitProgress(job, jobRecordId, 15, 'fetched', 'Assignment details loaded');

  // Step 3 — Building prompt
  await emitProgress(job, jobRecordId, 25, 'building_prompt', 'Structuring AI prompt...');
  assignment.status = 'generating';
  await assignment.save();

  // Step 4 — Calling AI
  await emitProgress(job, jobRecordId, 40, 'calling_ai', 'Calling AI model...');

  // Step 5 — AI generation
  let generationResult;
  try {
    generationResult = await generatePaperWithAi(assignment);
  } catch (err) {
    await emitProgress(job, jobRecordId, 40, 'ai_error', 'AI failed, using fallback...');
    throw err;
  }

  await emitProgress(job, jobRecordId, 65, 'validating', 'Validating AI output...');

  // Step 6 — Remove old paper
  await GeneratedPaper.deleteOne({
    assignmentId: new Types.ObjectId(assignmentId),
  });

  await emitProgress(job, jobRecordId, 75, 'saving', 'Saving question paper...');

  // Step 7 — Save paper
  const { paper, source, model } = generationResult;
  const saved = await GeneratedPaper.create({
    assignmentId:     new Types.ObjectId(assignmentId),
    title:            paper.title,
    subject:          paper.subject,
    grade:            paper.grade,
    totalMarks:       paper.totalMarks,
    sections:         paper.sections,
    generationSource: source,
    modelName:        model,
    generatedAt:      new Date(),
  });

  await emitProgress(job, jobRecordId, 90, 'finalizing', 'Finalizing output...');

  // Step 8 — Mark complete
  assignment.status = 'completed';
  await assignment.save();

  await jobService.updateStatus(jobRecordId, 'completed', {
    progress:    100,
    completedAt: new Date(),
  });

  await emitProgress(job, jobRecordId, 100, 'completed', 'Question paper ready!');

  console.log('[Worker] Job completed:', job.id, '| source:', source, '| paper:', String(saved._id));
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
    console.error('[Worker] Error:', err.message);
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

startWorker().catch(err => {
  console.error('[Worker] Failed to start:', err.message);
  process.exit(1);
});