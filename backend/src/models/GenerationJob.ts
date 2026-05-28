import { Schema, model, Document, Types } from 'mongoose';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface IGenerationJobDoc extends Document {
  assignmentId:  Types.ObjectId;
  bullJobId:     string;
  status:        JobStatus;
  progress:      number;
  errorMessage?: string;
  startedAt?:    Date;
  completedAt?:  Date;
  createdAt:     Date;
  updatedAt:     Date;
}

const GenerationJobSchema = new Schema<IGenerationJobDoc>(
  {
    assignmentId: {
      type:     Schema.Types.ObjectId,
      ref:      'Assignment',
      required: true,
      index:    true,
    },
    bullJobId:    { type: String, required: true },
    status:       {
      type:    String,
      enum:    ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    progress:     { type: Number, default: 0, min: 0, max: 100 },
    errorMessage: { type: String },
    startedAt:    { type: Date },
    completedAt:  { type: Date },
  },
  { timestamps: true }
);

export const GenerationJob = model<IGenerationJobDoc>(
  'GenerationJob',
  GenerationJobSchema
);