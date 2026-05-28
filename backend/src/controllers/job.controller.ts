import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { jobService }   from '../services/job.service';

export const jobController = {

  getById: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.getById(req.params.jobId);
    res.json({ success: true, data: job });
  }),

  getByAssignment: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.getLatestForAssignment(req.params.assignmentId);
    res.json({ success: true, data: job });
  }),
};