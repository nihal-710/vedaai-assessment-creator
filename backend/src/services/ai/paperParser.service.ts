import { z } from 'zod';

// ─── Zod schema for AI output ────────────────────────────────────────────────
const QuestionSchema = z.object({
  questionText: z.string().min(1),
  type:         z.string().min(1),
  difficulty:   z.enum(['easy', 'medium', 'hard']),
  marks:        z.number().int().min(1),
  options:      z.array(z.string()).optional(),
  answer:       z.string().optional(),
});

const SectionSchema = z.object({
  title:       z.string().min(1),
  instruction: z.string().min(1),
  questions:   z.array(QuestionSchema).min(1),
});

export const AiPaperSchema = z.object({
  title:      z.string().min(1),
  subject:    z.string().min(1),
  grade:      z.string().min(1),
  totalMarks: z.number().int().min(1),
  sections:   z.array(SectionSchema).min(1),
});

export type AiPaperOutput = z.infer<typeof AiPaperSchema>;

// ─── Extract JSON from raw AI text ───────────────────────────────────────────
function extractJson(raw: string): string {
  // Strip markdown code fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find the first { and last } to extract raw JSON
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw.trim();
}

// ─── Recalculate totalMarks from sections ────────────────────────────────────
function recalculateTotalMarks(paper: AiPaperOutput): AiPaperOutput {
  const totalMarks = paper.sections.reduce(
    (sum, s) => sum + s.questions.reduce((qSum, q) => qSum + q.marks, 0),
    0
  );
  return { ...paper, totalMarks };
}

// ─── Main parser ─────────────────────────────────────────────────────────────
export function parseAiResponse(raw: string): {
  success: boolean;
  data?: AiPaperOutput;
  error?: string;
} {
  try {
    const jsonStr  = extractJson(raw);
    const parsed   = JSON.parse(jsonStr);
    const validated = AiPaperSchema.parse(parsed);
    const withMarks = recalculateTotalMarks(validated);
    return { success: true, data: withMarks };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parse error';
    return { success: false, error: message };
  }
}