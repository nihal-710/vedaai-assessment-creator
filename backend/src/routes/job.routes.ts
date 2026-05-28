import { Router } from 'express';
import { jobController } from '../controllers/job.controller';

const router = Router();

// IMPORTANT: specific routes must come before param routes
// GET /api/jobs/assignment/:assignmentId  ← must be first
// GET /api/jobs/:jobId                    ← must be second

router.get('/assignment/:assignmentId', jobController.getByAssignment);
router.get('/:jobId', jobController.getById);

export default router;