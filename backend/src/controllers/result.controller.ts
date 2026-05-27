import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { resultService } from '../services/result.service';
import { ApiError } from '../utils/ApiError';

export const resultController = {

  getByAssignmentId: asyncHandler(async (req: Request, res: Response) => {
    const paper = await resultService.getByAssignmentId(req.params.assignmentId);
    res.json({ success: true, data: paper });
  }),

  regenerateFull: asyncHandler(async (req: Request, res: Response) => {
    const paper = await resultService.regenerateFull(req.params.assignmentId);
    res.json({ success: true, data: paper, message: 'Paper regenerated successfully' });
  }),

  regenerateSection: asyncHandler(async (req: Request, res: Response) => {
    const { sectionTitle } = req.body;
    if (!sectionTitle) throw ApiError.badRequest('sectionTitle is required in request body');
    const paper = await resultService.regenerateSection(req.params.assignmentId, sectionTitle);
    res.json({ success: true, data: paper, message: 'Section regenerated successfully' });
  }),
};