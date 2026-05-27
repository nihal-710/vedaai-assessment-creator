export type QuestionTypeName =
  | 'Multiple Choice Questions'
  | 'Short Questions'
  | 'Long Questions'
  | 'Diagram/Graph-Based Questions'
  | 'Numerical Problems'
  | 'True/False'
  | 'Fill in the Blanks';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type AssignmentStatus = 'draft' | 'generating' | 'completed' | 'failed';

export interface IQuestionTypeConfig {
  type: QuestionTypeName;
  count: number;
  marks: number;
}

export interface IQuestion {
  questionText: string;
  type: QuestionTypeName;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  answer?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface CreateAssignmentBody {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionTypes: IQuestionTypeConfig[];
  additionalInstructions?: string;
  uploadedFileName?: string;
}
