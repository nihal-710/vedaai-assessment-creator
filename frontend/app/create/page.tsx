// app/create/page.tsx
"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Upload, Minus } from "lucide-react";
import { AppShell } from "@/src/components/layout/AppShell";
import { useAssignmentStore } from "@/src/store/assignmentStore";
import { QUESTION_TYPE_OPTIONS } from "@/src/lib/mockData";
import { createAssignment, startGeneration } from '@/src/lib/api';

const schema = z.object({
  title:    z.string().min(1, "Title is required"),
  subject:  z.string().min(1, "Subject is required"),
  gradeLevel: z.string().min(1, "Grade is required"),
  dueDate:  z.string().min(1, "Due date is required"),
  questionTypes: z.array(z.object({
    id: z.string(),
    type: z.string().min(1),
    numberOfQuestions: z.number().min(1),
    marksPerQuestion:  z.number().min(1),
  })).min(1, "Add at least one question type"),
  additionalInstructions: z.string().optional(),
});
type FV = z.infer<typeof schema>;

function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="field-error">{msg}</p> : null;
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <button type="button" className="stepper-btn" onClick={() => onChange(Math.max(1, value - 1))}>
        <Minus size={12} />
      </button>
      <span className="stepper-val">{value}</span>
      <button type="button" className="stepper-btn" onClick={() => onChange(Math.min(99, value + 1))}>
        <Plus size={12} />
      </button>
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const { updateFormData, setCurrentAssignmentId } = useAssignmentStore();
  const [fileName, setFileName]   = useState<string>();
const [apiError, setApiError]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FV>({
    resolver: zodResolver(schema),
    defaultValues: {
      questionTypes: [
        { id: "1", type: "Multiple Choice Questions",    numberOfQuestions: 4, marksPerQuestion: 1 },
        { id: "2", type: "Short Questions",              numberOfQuestions: 3, marksPerQuestion: 2 },
        { id: "3", type: "Diagram/Graph-Based Questions",numberOfQuestions: 5, marksPerQuestion: 5 },
        { id: "4", type: "Numerical Problems",           numberOfQuestions: 5, marksPerQuestion: 5 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "questionTypes" });
  const totalQ = fields.reduce((s, q) => s + (q.numberOfQuestions || 0), 0);
const totalM = fields.reduce((s, q) => s + (q.numberOfQuestions || 0) * (q.marksPerQuestion || 0), 0);

  const onSubmit = async (data: FV) => {
  if (isSubmitting) return;
  setApiError(null);
  try {
    // 1. Create assignment in backend
    const assignment = await createAssignment({
      title:                  data.title,
      subject:                data.subject,
      grade:                  data.gradeLevel,
      dueDate:                data.dueDate,
      questionTypes:          data.questionTypes.map(qt => ({
        type:  qt.type,
        count: qt.numberOfQuestions,
        marks: qt.marksPerQuestion,
      })),
      additionalInstructions: data.additionalInstructions,
      uploadedFileName:       fileName,
    });

    const assignmentId = assignment._id;

    // 2. Start generation job
    await startGeneration(assignmentId);

    // 3. Store in Zustand
    updateFormData({
  title: data.title,
  subject: data.subject,
  grade: data.gradeLevel,
  dueDate: data.dueDate,
  questionTypes: data.questionTypes,
  additionalInstructions: data.additionalInstructions,
} as Parameters<typeof updateFormData>[0]);
    setCurrentAssignmentId(assignmentId);

    // 4. Navigate to generating page
    router.push('/generating/' + assignmentId);
  } catch (err) {
    console.error('[Create] Error:', err);
    setApiError((err as Error).message || 'Something went wrong. Please try again.');
  }
};

  return (
    <AppShell topBarProps={{ showBack: true, backHref: "/assignments", breadcrumb: "Assignment" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Page title */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Create Assignment</h1>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>Set up a new assignment for your students</p>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: "100%" }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card" style={{ padding: "24px 28px", marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Assignment Details</h2>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>Basic information about your assignment</p>

            {/* File upload */}
            <div className="upload-box" onClick={() => fileRef.current?.click()} style={{ marginBottom: 22 }}>
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.xml" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) setFileName(f.name); }} />
              <Upload size={24} color={fileName ? "var(--color-brand)" : "#C4C4C4"} style={{ margin: "0 auto 10px" }} />
              {fileName ? (
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-brand)" }}>{fileName}</p>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Choose a file or drag &amp; drop it here</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12 }}>PDF, PNG, JPEG, XML</p>
                  <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "#374151", border: "1px solid #E5E7EB", background: "white", padding: "6px 18px", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    Browse Files
                  </span>
                </>
              )}
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>Upload images of your preferred document/image</p>
            </div>

            {/* Due date */}
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Due Date <span style={{ color: "#EF4444" }}>*</span></label>
              <input {...register("dueDate")} type="date"
                className={`field-input${errors.dueDate ? " error" : ""}`}
                style={{ maxWidth: 240 }}
              />
              <FieldErr msg={errors.dueDate?.message} />
            </div>

            {/* Basic fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="field-label">Assignment Title <span style={{ color: "#EF4444" }}>*</span></label>
                <input {...register("title")} placeholder="e.g. Quiz on Electricity"
                  className={`field-input${errors.title ? " error" : ""}`} />
                <FieldErr msg={errors.title?.message} />
              </div>
              <div>
                <label className="field-label">Subject <span style={{ color: "#EF4444" }}>*</span></label>
                <input {...register("subject")} placeholder="e.g. Science"
                  className={`field-input${errors.subject ? " error" : ""}`} />
                <FieldErr msg={errors.subject?.message} />
              </div>
              <div>
                <label className="field-label">Grade / Class <span style={{ color: "#EF4444" }}>*</span></label>
                <input {...register("gradeLevel")} placeholder="e.g. Class 8"
                  className={`field-input${errors.gradeLevel ? " error" : ""}`} />
              </div>
            </div>

            {/* Question types table */}
            <div style={{ marginBottom: 20 }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 130px 36px", gap: 8, padding: "0 12px", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em" }}>Question Type</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>No. of Questions</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Marks</span>
                <span />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {fields.map((field, i) => (
                  <div key={field.id} className="qtype-row">
                    <Controller control={control} name={`questionTypes.${i}.type`} render={({ field: f }) => (
                      <select {...f} className="field-select">
                        {QUESTION_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )} />
                    <Controller control={control} name={`questionTypes.${i}.numberOfQuestions`} render={({ field: f }) => (
                      <Stepper value={f.value} onChange={f.onChange} />
                    )} />
                    <Controller control={control} name={`questionTypes.${i}.marksPerQuestion`} render={({ field: f }) => (
                      <Stepper value={f.value} onChange={f.onChange} />
                    )} />
                    <button type="button" onClick={() => remove(i)}
                      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#C4C4C4", borderRadius: 6, transition: "all 0.15s" }}
                      onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2"; }}
                      onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color = "#C4C4C4"; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {errors.questionTypes && <FieldErr msg={errors.questionTypes.message} />}

              {/* Add + totals */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <button type="button"
                  onClick={() => append({ id: Date.now().toString(), type: "Multiple Choice Questions", numberOfQuestions: 5, marksPerQuestion: 5 })}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--color-brand)", background: "none", border: "none", cursor: "pointer" }}>
                  <Plus size={14} strokeWidth={2.5} /> Add Question Type
                </button>
                <div style={{ fontSize: 13, color: "#6B7280", display: "flex", gap: 18 }}>
                  <span>Total Questions : <strong style={{ color: "#111827" }}>{totalQ}</strong></span>
                  <span>Total Marks : <strong style={{ color: "#111827" }}>{totalM}</strong></span>
                </div>
              </div>
            </div>

            {/* Additional instructions */}
            <div>
              <label className="field-label">
                Additional Information <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(For better output)</span>
              </label>
              <textarea {...register("additionalInstructions")} rows={3}
                placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                className="field-input" style={{ resize: "none", lineHeight: 1.6 }} />
            </div>
          </div>

          {apiError && (
  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginTop: 8 }}>
    {apiError}
  </div>
)}

          {/* Footer nav */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 40 }}>
            <button type="button" className="btn btn-secondary btn-md" onClick={() => router.back()} disabled={isSubmitting}>
              ← Previous
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-md">
              {isSubmitting ? "Generating…" : "Next →"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}