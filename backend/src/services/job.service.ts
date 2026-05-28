import { Types } from 'mongoose';
import { GenerationJob, IGenerationJobDoc, JobStatus } from '../models/GenerationJob';
import { ApiError } from '../utils/ApiError';

export const jobService = {

  async create(assignmentId: string, bullJobId: string): Promise<IGenerationJobDoc> {
    return GenerationJob.create({
      assignmentId: new Types.ObjectId(assignmentId),
      bullJobId,
      status:   'queued',
      progress: 0,
    });
  },

  async getById(jobId: string): Promise<IGenerationJobDoc> {
    const job = await GenerationJob.findById(jobId);
    if (!job) throw ApiError.notFound('Job not found');
    return job;
  },

  async getLatestForAssignment(assignmentId: string): Promise<IGenerationJobDoc> {
    const job = await GenerationJob.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
    }).sort({ createdAt: -1 });
    if (!job) throw ApiError.notFound('No job found for this assignment');
    return job;
  },

  async updateStatus(
    jobId:        string,
    status:       JobStatus,
    extra?: {
      progress?:     number;
      errorMessage?: string;
      startedAt?:    Date;
      completedAt?:  Date;
    }
  ): Promise<void> {
    await GenerationJob.findByIdAndUpdate(jobId, {
      status,
      ...extra,
    });
  },
};