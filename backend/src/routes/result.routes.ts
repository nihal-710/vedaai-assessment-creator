import { Router } from 'express';
import { resultController } from '../controllers/result.controller';

const router = Router();

// GET  /api/results/:assignmentId                     — get paper
// POST /api/results/:assignmentId/regenerate          — regenerate full paper
// POST /api/results/:assignmentId/regenerate-section  — regenerate one section

router.get( '/:assignmentId',                     resultController.getByAssignmentId);
router.post('/:assignmentId/regenerate',          resultController.regenerateFull);
router.post('/:assignmentId/regenerate-section',  resultController.regenerateSection);

export default router;
