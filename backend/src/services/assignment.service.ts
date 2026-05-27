import { Assignment } from '../models/Assignment';
import { ApiError } from '../utils/ApiError';
import type { CreateAssignmentInput } from '../validators/assignment.validator';

export const assignmentService = {

  async create(data: CreateAssignmentInput) {
    const assignment = await Assignment.create({
      title:                  data.title,
      subject:                data.subject,
      grade:                  data.grade,
      dueDate:                new Date(data.dueDate),
      questionTypes:          data.questionTypes,
      additionalInstructions: data.additionalInstructions ?? '',
      uploadedFileName:       data.uploadedFileName,
      status:                 'draft',
    });
    return assignment;
  },

  async getAll() {
    return Assignment.find().sort({ createdAt: -1 });
  },

  async getById(id: string) {
    const assignment = await Assignment.findById(id);
    if (!assignment) throw ApiError.notFound('Assignment not found');
    return assignment;
  },

  async updateStatus(id: string, status: 'draft' | 'generating' | 'completed' | 'failed') {
    await Assignment.findByIdAndUpdate(id, { status });
  },
};
