import { Types } from 'mongoose';
import { GeneratedPaper, IGeneratedPaperDoc } from '../models/GeneratedPaper';
import { Assignment }                          from '../models/Assignment';
import { ApiError }                            from '../utils/ApiError';
import { generatePaperWithAi }                 from './ai/gemini.service';
import { buildFallbackPaper }                  from './ai/fallbackPaper.service';
import type { ISection }                       from '../types';

export const resultService = {

  // ── Generate full paper ────────────────────────────────────────────────────
  async generate(assignmentId: string): Promise<IGeneratedPaperDoc> {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  try {
    await GeneratedPaper.deleteOne({
      assignmentId: new Types.ObjectId(assignmentId),
    });

    const { paper, source, model } = await generatePaperWithAi(assignment);

    const saved = await GeneratedPaper.create({
      assignmentId:     new Types.ObjectId(assignmentId),
      title:            paper.title,
      subject:          paper.subject,
      grade:            paper.grade,
      totalMarks:       paper.totalMarks,
      sections:         paper.sections,
      generationSource: source,
      modelName:        model,
      generatedAt:      new Date(),
    });

    assignment.status = 'completed';
    await assignment.save();

    console.log('[Result] Paper saved. Source: ' + source + ', Model: ' + model);
    return saved;
  } catch (err) {
    assignment.status = 'failed';
    await assignment.save();
    throw err;
  }
},

  // ── Get paper by assignment ID ─────────────────────────────────────────────
  async getByAssignmentId(assignmentId: string): Promise<IGeneratedPaperDoc> {
    const paper = await GeneratedPaper.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
    });
    if (!paper) throw ApiError.notFound('Generated paper not found');
    return paper;
  },

  // ── Regenerate full paper ──────────────────────────────────────────────────
  async regenerateFull(assignmentId: string): Promise<IGeneratedPaperDoc> {
    return this.generate(assignmentId);
  },

  // ── Regenerate single section ──────────────────────────────────────────────
  async regenerateSection(
    assignmentId: string,
    sectionTitle: string
  ): Promise<IGeneratedPaperDoc> {
    const paper = await GeneratedPaper.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
    });
    if (!paper) throw ApiError.notFound('Generated paper not found');

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw ApiError.notFound('Assignment not found');

    const idx = paper.sections.findIndex(
      s => s.title.toLowerCase() === sectionTitle.toLowerCase()
    );
    if (idx === -1) throw ApiError.notFound('Section not found: ' + sectionTitle);

    const qt = assignment.questionTypes[idx];
    if (!qt) throw ApiError.badRequest('No matching question type for this section');

    // Build a fresh section via fallback (AI section-level generation in Phase 5)
    const { sections } = buildFallbackPaper(
      assignment.title,
      assignment.subject,
      assignment.grade,
      [qt]
    );

    const newSection: ISection = {
      title:       paper.sections[idx].title,
      instruction: paper.sections[idx].instruction,
      questions:   sections[0].questions,
    };

    paper.sections[idx] = newSection;
    await paper.save();

    return paper;
  },
};