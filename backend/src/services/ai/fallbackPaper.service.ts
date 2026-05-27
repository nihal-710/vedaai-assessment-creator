import type { IQuestionTypeConfig, ISection, IQuestion, Difficulty } from '../../types';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const SECTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

function makeFallbackQuestion(
  no: number,
  type: string,
  marks: number,
  subject: string
): IQuestion {
  const diff = DIFFICULTIES[no % 3];
  const templates: Record<string, string[]> = {
    'Multiple Choice Questions': [
      'Which of the following best describes the concept studied in ' + subject + '?',
      'What is the correct term for the process described in ' + subject + '?',
      'Which option correctly explains the phenomenon in ' + subject + '?',
    ],
    'Short Questions': [
      'Define the key term discussed in ' + subject + ' with an example.',
      'Explain the significance of the concept in ' + subject + ' briefly.',
      'Describe the main principle of the topic in ' + subject + '.',
    ],
    'Long Questions': [
      'Explain in detail the major concepts covered in ' + subject + ' with relevant examples.',
      'Discuss the importance and applications of the topic studied in ' + subject + '.',
    ],
    'Diagram/Graph-Based Questions': [
      'Draw and label a diagram representing the key concept in ' + subject + '.',
      'Interpret the given graph and explain the trend observed in ' + subject + '.',
    ],
    'Numerical Problems': [
      'Solve the following problem based on the formula studied in ' + subject + '.',
      'Calculate the required value using the concept from ' + subject + '.',
    ],
    'True/False': [
      'State whether the following statement about ' + subject + ' is True or False: The primary concept directly affects the outcome.',
      'State whether the following statement about ' + subject + ' is True or False: The secondary principle is independent of the main theory.',
    ],
    'Fill in the Blanks': [
      'The process of _______ is fundamental to understanding ' + subject + '.',
      'In ' + subject + ', the term _______ refers to the main concept studied.',
    ],
  };

  const pool = templates[type] || templates['Short Questions'];
  const text = pool[no % pool.length];

  return {
    questionText: '[' + diff.charAt(0).toUpperCase() + diff.slice(1) + '] ' + text,
    type: type as IQuestion['type'],
    difficulty: diff,
    marks,
  };
}

export function buildFallbackPaper(
  title: string,
  subject: string,
  grade: string,
  questionTypes: IQuestionTypeConfig[]
): { sections: ISection[]; totalMarks: number } {
  const sections: ISection[] = questionTypes.map((qt, idx) => ({
    title: 'Section ' + (SECTION_LABELS[idx] ?? String(idx + 1)),
    instruction:
      qt.type +
      '. Attempt all questions. Each question carries ' +
      qt.marks +
      (qt.marks > 1 ? ' marks.' : ' mark.'),
    questions: Array.from({ length: qt.count }, (_, i) =>
      makeFallbackQuestion(i + 1, qt.type, qt.marks, subject)
    ),
  }));

  const totalMarks = questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);

  return { sections, totalMarks };
}