// Matches exact backend MongoDB + API response shapes

export type AssignmentStatus = 'draft' | 'generating' | 'completed' | 'failed';
export type JobStatus        = 'queued' | 'processing' | 'completed' | 'failed';
export type Difficulty       = 'easy' | 'medium' | 'hard';
export type GenerationSource = 'ai' | 'fallback';

export interface QuestionTypeConfig {
  type:  string;
  count: number;
  marks: number;
}

// ── Assignment ────────────────────────────────────────────────────────────────
export interface Assignment {
  _id:                    string;
  title:                  string;
  subject:                string;
  grade:                  string;
  dueDate:                string;
  questionTypes:          QuestionTypeConfig[];
  additionalInstructions?: string;
  uploadedFileName?:       string;
  status:                 AssignmentStatus;
  createdAt:              string;
  updatedAt:              string;
}

// ── Generation Job ────────────────────────────────────────────────────────────
export interface GenerationJob {
  _id:           string;
  assignmentId:  string;
  bullJobId:     string;
  status:        JobStatus;
  progress:      number;
  errorMessage?: string;
  startedAt?:    string;
  completedAt?:  string;
  createdAt:     string;
  updatedAt:     string;
}

// ── Question / Section / Paper ────────────────────────────────────────────────
export interface Question {
  questionText: string;
  type:         string;
  difficulty:   Difficulty;
  marks:        number;
  options?:     string[];
  answer?:      string;
}

export interface PaperSection {
  title:       string;
  instruction: string;
  questions:   Question[];
}

export interface GeneratedPaper {
  _id:              string;
  assignmentId:     string;
  title:            string;
  subject:          string;
  grade:            string;
  totalMarks:       number;
  sections:         PaperSection[];
  generationSource: GenerationSource;
  modelName:        string;
  generatedAt:      string;
  createdAt:        string;
  updatedAt:        string;
}

// ── API wrappers ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message?: string;
  count?:   number;
  error?:   string;
}

export interface CreateAssignmentPayload {
  title:                  string;
  subject:                string;
  grade:                  string;
  dueDate:                string;
  questionTypes:          QuestionTypeConfig[];
  additionalInstructions?: string;
  uploadedFileName?:       string;
}

export interface GenerateResponse {
  assignmentId: string;
  jobId:        string;
  bullJobId?:   string;
  status:       string;
}