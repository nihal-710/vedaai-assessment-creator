import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { buildGenerationPrompt, buildRetryPrompt } from './promptBuilder.service';
import { parseAiResponse, AiPaperOutput }           from './paperParser.service';
import { buildFallbackPaper }                        from './fallbackPaper.service';
import type { IAssignmentDoc }                       from '../../models/Assignment';

const MODEL_NAME = 'gemini-1.5-flash';

// ─── Get Gemini client ────────────────────────────────────────────────────────
function getClient() {
  if (!env.GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

// ─── Call Gemini with a prompt ────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const client = getClient();
  if (!client) throw new Error('Gemini API key not configured');

  const model  = client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature:     0.7,
      topP:            0.9,
      maxOutputTokens: 4096,
    },
  });

  const result   = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

// ─── Main generation function ─────────────────────────────────────────────────
export async function generatePaperWithAi(assignment: IAssignmentDoc): Promise<{
  paper:  AiPaperOutput;
  source: 'ai' | 'fallback';
  model:  string;
}> {
  // If no API key or demo mode → return fallback immediately
  if (!env.GEMINI_API_KEY || env.DEMO_MODE) {
    console.log('[AI] No API key or demo mode — using fallback paper');
    const { sections, totalMarks } = buildFallbackPaper(
      assignment.title,
      assignment.subject,
      assignment.grade,
      assignment.questionTypes
    );
    return {
      paper: {
        title:      assignment.title,
        subject:    assignment.subject,
        grade:      assignment.grade,
        totalMarks,
        sections,
      },
      source: 'fallback',
      model:  'demo',
    };
  }

  const prompt = buildGenerationPrompt(assignment);

  // ── Attempt 1 ──────────────────────────────────────────────────────────────
  try {
    console.log('[AI] Calling Gemini ' + MODEL_NAME + '...');
    const raw    = await callGemini(prompt);
    const result = parseAiResponse(raw);

    if (result.success && result.data) {
      console.log('[AI] Generation successful on attempt 1');
      return { paper: result.data, source: 'ai', model: MODEL_NAME };
    }

    // ── Attempt 2 (retry with correction prompt) ───────────────────────────
    console.log('[AI] Attempt 1 parse failed (' + result.error + '), retrying...');
    const retryPrompt = buildRetryPrompt(prompt, result.error || 'Invalid JSON');
    const raw2        = await callGemini(retryPrompt);
    const result2     = parseAiResponse(raw2);

    if (result2.success && result2.data) {
      console.log('[AI] Generation successful on attempt 2');
      return { paper: result2.data, source: 'ai', model: MODEL_NAME };
    }

    // ── Both attempts failed → fallback ────────────────────────────────────
    console.warn('[AI] Both attempts failed, using fallback. Error: ' + result2.error);
  } catch (err) {
    console.error('[AI] Gemini call error:', (err as Error).message);
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  const { sections, totalMarks } = buildFallbackPaper(
    assignment.title,
    assignment.subject,
    assignment.grade,
    assignment.questionTypes
  );
  return {
    paper: {
      title:      assignment.title,
      subject:    assignment.subject,
      grade:      assignment.grade,
      totalMarks,
      sections,
    },
    source: 'fallback',
    model:  'demo-fallback',
  };
}