# VedaAI Assessment Creator

> **AI-powered question paper generator for teachers — built as a Full Stack Engineering assignment.**

---

## Overview

VedaAI Assessment Creator is a full-stack web application that allows teachers to create structured assignments and generate complete, well-formatted question papers using Google Gemini AI. Papers are organized by section and difficulty, rendered in a polished UI, and exportable as clean PDFs — all powered by real-time background job processing.

The system is built with a decoupled frontend (Next.js) and backend (Express + Node.js), with MongoDB Atlas for persistence, Redis + BullMQ for job queuing, and Socket.io for live generation progress.

---

## Features

| Feature | Details |
|---|---|
| 📝 Assignment Creation | Form-based assignment setup with subject, grade, topic, and section config |
| 🤖 AI Question Generation | Gemini AI generates structured, section-wise question papers |
| 📄 Structured Paper View | Clean question paper UI with student info, sections, marks, and difficulty badges |
| 🔄 Regenerate Full Paper | One-click full paper regeneration via background job |
| 🔁 Regenerate Section | Regenerate individual sections without affecting the rest |
| 📥 PDF Export | Download a clean, print-ready PDF (difficulty labels excluded from PDF) |
| ⚡ Real-time Progress | Socket.io streams live generation status to the frontend |
| 🟡 Difficulty Badges | Easy / Medium / Hard badges shown in the web UI |
| 🗂️ Assignment Listing | View all created assignments with status and metadata |
| 🚫 Empty State Handling | Friendly zero-state UI when no assignments exist |
| 🔁 Fallback / Demo Mode | Works without a Gemini API key using demo-generated content |
| ⚠️ Loading & Error States | Full coverage of loading spinners and error messaging |
| 💾 MongoDB Persistence | All assignments and generated results stored in MongoDB Atlas |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16 | React framework with App Router |
| TypeScript | Type-safe development |
| Tailwind CSS v4 | Utility-first styling |
| React Hook Form | Form state management |
| Zod | Schema validation |
| Zustand | Global state management |
| socket.io-client | Real-time generation updates |
| jsPDF + html2canvas | Client-side PDF export |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| TypeScript | Type-safe backend |
| MongoDB Atlas + Mongoose | Database and ODM |
| Redis (Upstash / Redis Cloud) | Job queue broker |
| BullMQ | Background job processing |
| Socket.io | Real-time event streaming |
| Google Gemini API | AI question paper generation |

---

## Architecture Overview

```
┌─────────────────────┐         HTTP / Socket.io        ┌──────────────────────────┐
│                     │ ──────────────────────────────▶  │                          │
│   Next.js Frontend  │                                  │   Express.js Backend     │
│   (localhost:3000)  │ ◀──────────────────────────────  │   (localhost:5000)       │
│                     │        REST API + Events         │                          │
└─────────────────────┘                                  └───────────┬──────────────┘
                                                                     │
                                              ┌──────────────────────┼─────────────────────┐
                                              │                       │                     │
                                    ┌─────────▼──────┐   ┌───────────▼───────┐   ┌────────▼───────┐
                                    │  MongoDB Atlas  │   │   Redis / BullMQ  │   │  Gemini AI API │
                                    │  (Persistence)  │   │   (Job Queues)    │   │  (Generation)  │
                                    └────────────────┘   └───────────────────┘   └────────────────┘
                                                                     │
                                                          ┌──────────▼──────────┐
                                                          │   BullMQ Worker     │
                                                          │   (worker.ts)       │
                                                          │   Processes AI jobs │
                                                          └─────────────────────┘
```

**Flow summary:**
1. Teacher submits an assignment → stored in MongoDB.
2. A generation job is queued in Redis via BullMQ.
3. The BullMQ worker picks up the job, calls Gemini AI, and saves the result.
4. Socket.io emits real-time progress events to the frontend.
5. The result page displays the structured paper; PDF export is available instantly.

---

## Project Structure

```
vedaai-assessment-creator/
│
├── frontend/
│   ├── app/
│   │   ├── assignments/          # Assignment listing page
│   │   ├── create/               # Assignment creation form
│   │   ├── generating/
│   │   │   └── [assignmentId]/   # Real-time generation progress page
│   │   └── result/
│   │       └── [assignmentId]/   # Structured question paper view
│   └── src/
│       ├── components/           # Reusable UI components
│       ├── hooks/                # Custom React hooks (socket, queries)
│       ├── lib/                  # API clients, PDF utilities, helpers
│       └── types/                # Shared TypeScript types
│
└── backend/
    └── src/
        ├── models/               # Mongoose models (Assignment, Result)
        ├── routes/               # Express route definitions
        ├── controllers/          # Request handlers
        ├── services/             # Business logic (AI, generation)
        ├── queues/               # BullMQ queue definitions
        ├── workers/              # BullMQ worker logic
        ├── socket/               # Socket.io event handlers
        ├── server.ts             # Express app + Socket.io server entry
        └── worker.ts             # Standalone worker process entry
```

---

## Local Setup

### Prerequisites

- Node.js v18+
- npm or yarn
- MongoDB Atlas account (free tier works)
- Redis instance — **Upstash Redis** or **Redis Cloud** (TCP URL required for BullMQ; REST-only URLs are not supported)
- Google Gemini API key *(optional — fallback/demo mode works without it)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/vedaai-assessment-creator.git
cd vedaai-assessment-creator
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/vedaai
REDIS_URL=rediss://<username>:<password>@<host>:<port>
GEMINI_API_KEY=your_gemini_api_key_here
DEMO_MODE=false
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **Redis note:** BullMQ requires a raw TCP Redis URL (e.g. `redis://` or `rediss://`). Upstash's REST-only endpoint will not work — use the **Upstash Redis TCP URL** or a Redis Cloud instance.

> 💡 **Demo mode:** Set `DEMO_MODE=true` to bypass Gemini and use locally generated sample content. Useful for testing without an API key.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Running the Application

The backend requires **two separate processes**: the API server and the BullMQ worker.

### Terminal 1 — Backend API Server

```bash
cd backend
npm run dev
```

Starts the Express server + Socket.io on `http://localhost:5000`.

### Terminal 2 — BullMQ Worker

```bash
cd backend
npm run worker
```

Starts the background worker that processes AI generation jobs from the Redis queue.

### Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

Starts the Next.js app on `http://localhost:3000`.

> All three processes must be running simultaneously for full functionality.

---

## API Routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/assignments` | Create a new assignment |
| `GET` | `/api/assignments` | List all assignments |
| `GET` | `/api/assignments/:id` | Get assignment by ID |
| `POST` | `/api/assignments/:id/generate` | Queue AI generation job |
| `GET` | `/api/results/:assignmentId` | Get generated question paper |
| `POST` | `/api/results/:assignmentId/regenerate` | Regenerate full paper |
| `POST` | `/api/results/:assignmentId/regenerate-section` | Regenerate a single section |
| `GET` | `/api/jobs/:jobId` | Get job status by job ID |
| `GET` | `/api/jobs/assignment/:assignmentId` | Get job status for an assignment |

---

## Main User Flow

```
1. Teacher visits the app → sees assignment listing (or empty state)
        │
        ▼
2. Clicks "Create Assignment" → fills in subject, grade, topic, sections, marks
        │
        ▼
3. Submits form → assignment saved to MongoDB, generation job queued
        │
        ▼
4. Redirected to /generating/[assignmentId] → real-time progress via Socket.io
        │
        ▼
5. Job completes → redirected to /result/[assignmentId]
        │
        ▼
6. Views structured question paper with sections, questions, marks, difficulty badges
        │
        ├──▶ Regenerate full paper → new job queued, real-time update
        ├──▶ Regenerate individual section → section replaced in-place
        └──▶ Download PDF → clean PDF without difficulty labels
```

---

## PDF Export

PDF export is handled entirely on the client side using **jsPDF** and **html2canvas**.

- The rendered question paper HTML is captured as a canvas image and embedded into a PDF.
- The PDF output is styled for clean, print-ready formatting.
- **Difficulty labels (`[Easy]`, `[Medium]`, `[Hard]`) are intentionally excluded from the PDF** — they appear only in the web UI as colored badges and are hidden before PDF capture.
- Student information (name, roll number, class) is included in the paper header.

---

## Section Regeneration

- **Regenerate Full Paper:** Queues a new BullMQ job for the entire assignment. The existing result is replaced once the job completes.
- **Regenerate Section:** Sends a targeted request to regenerate only a specific section (e.g., Section B). The rest of the paper is preserved. This is faster and does not require re-generating the full paper.

Both operations emit real-time Socket.io events so the UI stays in sync during processing.

---

## Demo / Fallback Mode

If the Gemini API key is not configured or the API call fails, the backend automatically falls back to **demo mode**:

- A structured sample question paper is generated locally.
- All sections, questions, marks, and difficulty levels are populated with placeholder content.
- The full application flow (generation progress, result view, PDF export, regeneration) works identically.
- Enable explicitly with `DEMO_MODE=true` in the backend `.env`.

This ensures the application is always demonstrable regardless of API availability.

---

## Testing Checklist

Use this checklist to verify the application end-to-end:

- [ ] Backend health check responds at `GET /api/health`
- [ ] Create an assignment via the form — confirm it appears in the listing
- [ ] Empty state displays correctly when no assignments exist
- [ ] Generation job is queued and progress updates appear in real time
- [ ] Result page loads with the correct sections, questions, marks, and difficulty badges
- [ ] Difficulty badges display correctly in the web UI
- [ ] Download PDF — confirm difficulty labels are absent in the exported file
- [ ] Regenerate full paper — confirm the paper is replaced after the job completes
- [ ] Regenerate a single section — confirm only that section changes
- [ ] Test with `DEMO_MODE=true` — confirm fallback content is generated
- [ ] Test with an invalid/missing Gemini key — confirm fallback activates gracefully
- [ ] Verify MongoDB documents are created and updated correctly
- [ ] Verify BullMQ jobs appear and complete in the Redis queue

---

## Known Limitations

- **No authentication** — the app does not have user accounts or access control; all assignments are visible to anyone with access to the URL.
- **No Docker setup** — manual local setup is required; services are not containerized.
- **BullMQ requires TCP Redis** — REST-only Redis providers (e.g., Upstash REST API) are not compatible; the TCP endpoint must be used.
- **PDF rendering** — relies on `html2canvas`, which may have minor rendering differences across browsers or with very long papers.
- **Gemini rate limits** — the free tier of the Gemini API has request limits; heavy usage may trigger fallback mode.
- **No pagination** — the assignment listing loads all records without pagination.

---

## Future Improvements

- 🔐 Teacher authentication and per-user assignment isolation
- 🐳 Docker Compose setup for one-command local development
- 📊 Analytics dashboard — track generation stats, section difficulty distribution
- 🖨️ Improved PDF templating with native PDF layout (e.g., PDFKit) instead of canvas capture
- 🌐 Multi-language question paper support
- 📤 Export to DOCX / Google Docs
- 🧠 Support for multiple AI providers (OpenAI, Anthropic Claude, etc.)
- ✏️ In-line question editing before PDF export
- 📬 Email delivery of generated papers

---

## Submission Notes

| Item | Detail |
|---|---|
| Assignment Type | Full Stack Engineering Take-Home |
| Project Name | VedaAI Assessment Creator |
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 |
| Backend | Node.js + Express + MongoDB Atlas + Redis + BullMQ |
| AI Integration | Google Gemini API with demo/fallback mode |
| Real-time | Socket.io for live generation progress |
| PDF Export | jsPDF + html2canvas (difficulty labels excluded) |
| Docker | Not required — manual setup via `.env` files |
| Demo Mode | Available via `DEMO_MODE=true` — no API key needed |

> All core features specified in the assignment brief have been implemented and tested. The application runs fully without Docker. Fallback/demo mode ensures the AI generation flow is always demonstrable.
