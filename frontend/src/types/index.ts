// src/types/index.ts

export type QuestionType =
  | "Multiple Choice Questions"
  | "Short Questions"
  | "Long Questions"
  | "Diagram/Graph-Based Questions"
  | "Numerical Problems"
  | "True/False"
  | "Fill in the Blanks";

export type Difficulty = "Easy" | "Moderate" | "Challenging";

export type AssignmentStatus =
  | "idle" | "queued" | "processing" | "completed" | "failed";

export interface QuestionTypeConfig {
  id: string;
  type: QuestionType;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  uploadedFileName?: string;
}

export interface Question {
  questionNo: number;
  text: string;
  type: QuestionType;
  marks: number;
  difficulty: Difficulty;
  options?: string[];
  answer?: string;
}

export interface PaperSection {
  sectionId: string;
  title: string;
  instructions: string;
  totalMarks: number;
  questions: Question[];
}

export interface GeneratedPaper {
  id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  gradeLevel: string;
  timeAllowed: number;
  totalMarks: number;
  sections: PaperSection[];
  generatedAt: string;
  demoMode: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  assignedOn: string;
  dueDate: string;
  status: AssignmentStatus;
  totalMarks: number;
  paperId?: string;
}

export interface GenerationStep {
  id: string;
  label: string;
  description: string;
  status: "pending" | "active" | "done" | "error";
}