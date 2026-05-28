// src/lib/mockData.ts
import type { GeneratedPaper, Assignment, GenerationStep } from "@/src/types";

export const QUESTION_TYPE_OPTIONS = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "True/False",
  "Fill in the Blanks",
] as const;

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: "a1", title: "Quiz on Electricity", subject: "Science", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "completed", totalMarks: 20, paperId: "p1" },
  { id: "a2", title: "Quiz on Electricity", subject: "Science", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "completed", totalMarks: 20, paperId: "p2" },
  { id: "a3", title: "Quiz on Electricity", subject: "Science", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "completed", totalMarks: 20 },
  { id: "a4", title: "Quiz on Electricity", subject: "Science", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "completed", totalMarks: 20 },
  { id: "a5", title: "Quiz on Electricity", subject: "Science", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "completed", totalMarks: 20 },
  { id: "a6", title: "Quiz on Electricity", subject: "Science", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "completed", totalMarks: 20 },
];

export const MOCK_GENERATION_STEPS: GenerationStep[] = [
  { id: "received",   label: "Assignment Received",        description: "Your assignment details have been received successfully.",      status: "pending" },
  { id: "prompt",     label: "Prompt Structured",          description: "Converting your inputs into an AI-ready structured prompt.",    status: "pending" },
  { id: "ai",         label: "AI Generation Started",      description: "Gemini AI is generating your question paper.",                  status: "pending" },
  { id: "formatting", label: "Formatting Question Paper",  description: "Structuring questions into sections with marks and difficulty.", status: "pending" },
  { id: "finalizing", label: "Finalizing Output",          description: "Validating and saving your question paper.",                    status: "pending" },
];

export const MOCK_PAPER: GeneratedPaper = {
  id: "paper-mock-1",
  assignmentId: "mock-assignment-id",
  schoolName: "Delhi Public School, Sector-4, Bokaro",
  subject: "Science",
  gradeLevel: "Class: 8th",
  timeAllowed: 45,
  totalMarks: 20,
  generatedAt: new Date().toISOString(),
  demoMode: false,
  sections: [
    {
      sectionId: "A",
      title: "Section A",
      instructions: "Short Answer Questions. Attempt all questions. Each question carries 2 marks.",
      totalMarks: 20,
      questions: [
        { questionNo: 1,  text: "Define electroplating. Explain its purpose.",                                                                                    type: "Short Questions", marks: 2, difficulty: "Easy",        answer: "Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness." },
        { questionNo: 2,  text: "What is the role of a conductor in the process of electrolysis?",                                                                type: "Short Questions", marks: 2, difficulty: "Moderate",    answer: "A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes." },
        { questionNo: 3,  text: "Why does a solution of copper sulfate conduct electricity?",                                                                     type: "Short Questions", marks: 2, difficulty: "Easy",        answer: "Copper sulfate solution contains free copper and sulfate ions which carry electric charge, thus conducting electricity." },
        { questionNo: 4,  text: "Describe one example of the chemical effect of electric current in daily life.",                                                 type: "Short Questions", marks: 2, difficulty: "Moderate",    answer: "Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects." },
        { questionNo: 5,  text: "Explain why electric current is said to have chemical effects.",                                                                 type: "Short Questions", marks: 2, difficulty: "Moderate",    answer: "Electric current causes the movement of ions leading to chemical changes at the electrodes." },
        { questionNo: 6,  text: "How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved.",                       type: "Short Questions", marks: 2, difficulty: "Challenging", answer: "2NaCl + 2H₂O → H₂ + Cl₂ + 2NaOH;  Na⁺ + OH⁻ → NaOH (in solution)" },
        { questionNo: 7,  text: "What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.",                               type: "Short Questions", marks: 2, difficulty: "Challenging", answer: "At the cathode: water is reduced to hydrogen gas and hydroxide ions. At the anode: water is oxidised to oxygen gas and hydrogen ions." },
        { questionNo: 8,  text: "Mention the type of current used in electroplating and justify why it is used.",                                                 type: "Short Questions", marks: 2, difficulty: "Easy",        answer: "Direct current (DC) is used because it flows in one direction, ensuring uniform deposition of metal." },
        { questionNo: 9,  text: "What is the importance of electric current in the field of metallurgy?",                                                        type: "Short Questions", marks: 2, difficulty: "Moderate",    answer: "Electric current helps in extraction and refining of metals through electrolysis." },
        { questionNo: 10, text: "Explain with a chemical equation how copper is deposited during the electroplating of an object.",                              type: "Short Questions", marks: 2, difficulty: "Challenging", answer: "Cu²⁺ + 2e⁻ → Cu (at cathode)" },
      ],
    },
  ],
};