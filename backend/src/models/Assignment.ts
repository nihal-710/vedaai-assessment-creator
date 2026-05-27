import { Schema, model, Document } from 'mongoose';
import type { IQuestionTypeConfig, AssignmentStatus } from '../types';

export interface IAssignmentDoc extends Document {
  title:                  string;
  subject:                string;
  grade:                  string;
  dueDate:                Date;
  questionTypes:          IQuestionTypeConfig[];
  additionalInstructions?: string;
  uploadedFileName?:      string;
  status:                 AssignmentStatus;
  createdAt:              Date;
  updatedAt:              Date;
}

const QuestionTypeConfigSchema = new Schema<IQuestionTypeConfig>(
  {
    type:  { type: String, required: true },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignmentDoc>(
  {
    title:                  { type: String, required: true, trim: true },
    subject:                { type: String, required: true, trim: true },
    grade:                  { type: String, required: true, trim: true },
    dueDate:                { type: Date,   required: true },
    questionTypes:          { type: [QuestionTypeConfigSchema], required: true },
    additionalInstructions: { type: String, default: '' },
    uploadedFileName:       { type: String },
    status:                 {
      type:    String,
      enum:    ['draft', 'generating', 'completed', 'failed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

export const Assignment = model<IAssignmentDoc>('Assignment', AssignmentSchema);
