// src/store/assignmentStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AssignmentFormData, GeneratedPaper, Assignment } from "@/src/types";

interface AssignmentStore {
  formData: Partial<AssignmentFormData>;
  updateFormData: (d: Partial<AssignmentFormData>) => void;
  resetForm: () => void;

  assignments: Assignment[];
  setAssignments: (a: Assignment[]) => void;

  generatedPaper: GeneratedPaper | null;
  setGeneratedPaper: (p: GeneratedPaper | null) => void;

  currentAssignmentId: string | null;
  setCurrentAssignmentId: (id: string | null) => void;
}

export const useAssignmentStore = create<AssignmentStore>()(
  devtools(
    (set) => ({
      formData: {},
      updateFormData: (d) => set((s) => ({ formData: { ...s.formData, ...d } })),
      resetForm: () => set({ formData: {} }),

      assignments: [],
      setAssignments: (assignments) => set({ assignments }),

      generatedPaper: null,
      setGeneratedPaper: (generatedPaper) => set({ generatedPaper }),

      currentAssignmentId: null,
      setCurrentAssignmentId: (currentAssignmentId) => set({ currentAssignmentId }),
    }),
    { name: "assignment-store" }
  )
);