import { Schema, model, Document, Types } from 'mongoose';
import type { ISection } from '../types';

export interface IGeneratedPaperDoc extends Document {
  assignmentId:     Types.ObjectId;
  title:            string;
  subject:          string;
  grade:            string;
  totalMarks:       number;
  sections:         ISection[];
  generationSource: 'ai' | 'fallback';
  modelName:        string;
  generatedAt:      Date;
  createdAt:        Date;
  updatedAt:        Date;
}

const QuestionSchema = new Schema(
  {
    questionText: { type: String, required: true },
    type:         { type: String, required: true },
    difficulty:   { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    marks:        { type: Number, required: true, min: 1 },
    options:      [String],
    answer:       String,
  },
  { _id: false }
);

const SectionSchema = new Schema(
  {
    title:       { type: String, required: true },
    instruction: { type: String, required: true },
    questions:   { type: [QuestionSchema], required: true },
  },
  { _id: false }
);

const GeneratedPaperSchema = new Schema<IGeneratedPaperDoc>(
  {
    assignmentId:     { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    title:            { type: String, required: true },
    subject:          { type: String, required: true },
    grade:            { type: String, required: true },
    totalMarks:       { type: Number, required: true },
    sections:         { type: [SectionSchema], required: true },
    generationSource: { type: String, enum: ['ai', 'fallback'], default: 'fallback' },
    modelName:        { type: String, default: 'demo' },
    generatedAt:      { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const GeneratedPaper = model<IGeneratedPaperDoc>('GeneratedPaper', GeneratedPaperSchema);