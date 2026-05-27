import { Types } from 'mongoose';
import { GeneratedPaper, IGeneratedPaperDoc } from '../models/GeneratedPaper';
import { Assignment } from '../models/Assignment';
import { ApiError } from '../utils/ApiError';
import type { IQuestionTypeConfig, ISection, IQuestion, Difficulty } from '../types';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function mockQuestion(no: number, type: string, marks: number): IQuestion {
  const diff = DIFFICULTIES[no % 3];
  return {
    questionText: '[' + diff.toUpperCase() + '] Sample ' + type + ' question #' + no + ': Explain the concept with relevant examples.',
    type: type as IQuestion['type'],
    difficulty: diff,
    marks,
    answer: 'Model answer for question #' + no + '. Demonstrates the key concepts clearly.',
  };
}

function buildSections(questionTypes: IQuestionTypeConfig[]): ISection[] {
  const labels = ['A', 'B', 'C', 'D', 'E'];
  return questionTypes.map((qt, idx) => ({
    title: 'Section ' + (labels[idx] ?? String(idx + 1)),
    instruction: qt.type + '. Attempt all questions. Each question carries ' + qt.marks + (qt.marks > 1 ? ' marks' : ' mark') + '.',
    questions: Array.from({ length: qt.count }, (_, i) => mockQuestion(i + 1, qt.type, qt.marks)),
  }));
}

export const resultService = {

  async generate(assignmentId: string): Promise<IGeneratedPaperDoc> {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw ApiError.notFound('Assignment not found');
    assignment.status = 'generating';
    await assignment.save();
    try {
      await GeneratedPaper.deleteOne({ assignmentId: new Types.ObjectId(assignmentId) });
      const sections = buildSections(assignment.questionTypes);
      const totalMarks = assignment.questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);
      const paper = await GeneratedPaper.create({
        assignmentId: new Types.ObjectId(assignmentId),
        title: assignment.title,
        subject: assignment.subject,
        grade: assignment.grade,
        totalMarks,
        sections,
      });
      assignment.status = 'completed';
      await assignment.save();
      return paper;
    } catch (err) {
      assignment.status = 'failed';
      await assignment.save();
      throw err;
    }
  },

  async getByAssignmentId(assignmentId: string): Promise<IGeneratedPaperDoc> {
    const paper = await GeneratedPaper.findOne({
  assignmentId: new Types.ObjectId(assignmentId),
});
    if (!paper) throw ApiError.notFound('Generated paper not found');
    return paper;
  },

  async regenerateFull(assignmentId: string): Promise<IGeneratedPaperDoc> {
    return this.generate(assignmentId);
  },

  async regenerateSection(assignmentId: string, sectionTitle: string): Promise<IGeneratedPaperDoc> {
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
    paper.sections[idx] = {
      title: paper.sections[idx].title,
      instruction: paper.sections[idx].instruction,
      questions: Array.from({ length: qt.count }, (_, i) =>
        mockQuestion(i + 1, qt.type, qt.marks)
      ),
    };
    await paper.save();
    return paper;
  },
};