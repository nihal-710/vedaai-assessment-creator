import type { IAssignmentDoc } from '../../models/Assignment';

export function buildGenerationPrompt(assignment: IAssignmentDoc): string {
  const qtLines = assignment.questionTypes
    .map(
      (qt, i) =>
        'Section ' +
        String.fromCharCode(65 + i) +
        ': ' +
        qt.type +
        ' — ' +
        qt.count +
        ' questions × ' +
        qt.marks +
        ' marks each'
    )
    .join('\n');

  const totalMarks = assignment.questionTypes.reduce(
    (sum, qt) => sum + qt.count * qt.marks,
    0
  );

  const extraContext = assignment.additionalInstructions
    ? 'Additional instructions: ' + assignment.additionalInstructions
    : '';

  const fileContext = assignment.uploadedFileName
    ? 'Reference material filename: ' + assignment.uploadedFileName
    : '';

  return [
    'You are an expert teacher and question paper creator.',
    'Generate a structured question paper with the following specifications:',
    '',
    'Title: ' + assignment.title,
    'Subject: ' + assignment.subject,
    'Grade/Class: ' + assignment.grade,
    'Total Marks: ' + totalMarks,
    '',
    'Question Sections:',
    qtLines,
    '',
    extraContext,
    fileContext,
    '',
    'STRICT RULES:',
    '1. Return ONLY valid JSON. No markdown. No explanation. No code fences.',
    '2. Every question must have: questionText, type, difficulty (easy/medium/hard), marks.',
    '3. Difficulty must be distributed: roughly 40% easy, 40% medium, 20% hard.',
    '4. Questions must be relevant to the subject and grade level.',
    '5. Each section must match the exact question count specified.',
    '',
    'Return JSON in this EXACT structure:',
    '{',
    '  "title": "' + assignment.title + '",',
    '  "subject": "' + assignment.subject + '",',
    '  "grade": "' + assignment.grade + '",',
    '  "totalMarks": ' + totalMarks + ',',
    '  "sections": [',
    '    {',
    '      "title": "Section A",',
    '      "instruction": "Short Answer Questions. Attempt all questions.",',
    '      "questions": [',
    '        {',
    '          "questionText": "Your question here",',
    '          "type": "Short Questions",',
    '          "difficulty": "easy",',
    '          "marks": 2',
    '        }',
    '      ]',
    '    }',
    '  ]',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildRetryPrompt(originalPrompt: string, errorDetail: string): string {
  return (
    originalPrompt +
    '\n\nYour previous response was invalid. Error: ' +
    errorDetail +
    '\nReturn ONLY the JSON object. No markdown fences. No explanation. Just the raw JSON.'
  );
}