import { z } from 'zod';

const QuestionTypeSchema = z.object({
  type: z.enum([
    'Multiple Choice Questions',
    'Short Questions',
    'Long Questions',
    'Diagram/Graph-Based Questions',
    'Numerical Problems',
    'True/False',
    'Fill in the Blanks',
  ]),
  count: z.number().int().min(1, 'Count must be at least 1'),
  marks: z.number().int().min(1, 'Marks must be at least 1'),
});

export const createAssignmentSchema = z.object({
  title:                  z.string().min(1, 'Title is required').max(200),
  subject:                z.string().min(1, 'Subject is required').max(100),
  grade:                  z.string().min(1, 'Grade is required').max(50),
  dueDate:                z.string().min(1, 'Due date is required'),
  questionTypes:          z.array(QuestionTypeSchema).min(1, 'At least one question type required'),
  additionalInstructions: z.string().optional(),
  uploadedFileName:       z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
