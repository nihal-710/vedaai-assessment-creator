import { Request, Response } from 'express';
import { asyncHandler }       from '../utils/asyncHandler';
import { assignmentService }  from '../services/assignment.service';

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
    const { resultService } = await import('../services/result.service');
    const paper = await resultService.generate(req.params.id);
    res.json({
      success: true,
      data:    paper,
      message: 'Paper generated successfully',
    });
  }),
};
