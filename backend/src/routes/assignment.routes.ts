import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller';
import { validate }              from '../middlewares/validate.middleware';
import { createAssignmentSchema } from '../validators/assignment.validator';

const router = Router();

// POST   /api/assignments          — create assignment
// GET    /api/assignments          — get all assignments
// GET    /api/assignments/:id      — get by id
// POST   /api/assignments/:id/generate — generate paper

router.post(  '/',              validate(createAssignmentSchema), assignmentController.create);
router.get(   '/',              assignmentController.getAll);
router.get(   '/:id',           assignmentController.getById);
router.post(  '/:id/generate',  assignmentController.generate);

export default router;
