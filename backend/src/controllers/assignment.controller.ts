import { Request, Response }  from 'express';
import { asyncHandler }       from '../utils/asyncHandler';
import { assignmentService }  from '../services/assignment.service';
import { jobService }         from '../services/job.service';
import { addGenerationJob }   from '../queues/generation.queue';
import { isRedisAvailable }   from '../config/env';
import { resultService }      from '../services/result.service';

export const assignmentController = {

  create: asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentService.create(req.body);
    res.status(201).json({
      success: true,
      data:    assignment,
      message: 'Assignment created successfully',
    });
  }),

  getAll: asyncHandler(async (_req: Request, res: Response) => {
    const assignments = await assignmentService.getAll();
    res.json({
      success: true,
      count:   assignments.length,
      data:    assignments,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentService.getById(req.params.id);
    res.json({ success: true, data: assignment });
  }),

  generate: asyncHandler(async (req: Request, res: Response) => {
    await assignmentService.getById(req.params.id);

    if (isRedisAvailable()) {
      const jobRecord   = await jobService.create(req.params.id, 'pending');
      const jobRecordId = (jobRecord._id as { toString(): string }).toString();
      const bullJobId   = await addGenerationJob(req.params.id, jobRecordId);

      await assignmentService.updateStatus(req.params.id, 'generating');

      res.json({
        success: true,
        message: 'Generation job queued',
        data: {
          assignmentId: req.params.id,
          jobId:        jobRecordId,
          bullJobId,
          status:       'queued',
        },
      });
      return;
    }

    console.warn('[Generate] Redis unavailable — running direct generation');
    const paper = await resultService.generate(req.params.id);
    res.json({
      success: true,
      message: 'Paper generated directly (Redis unavailable)',
      data:    paper,
    });
  }),
};