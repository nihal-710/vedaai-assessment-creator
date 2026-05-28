'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter }             from 'next/navigation';
import { Download, RefreshCw, Share2, Printer, AlertCircle } from 'lucide-react';
import { AppShell }           from '@/src/components/layout/AppShell';
import { getResultByAssignmentId, regeneratePaper, regenerateSection } from '@/src/lib/api';
import type { GeneratedPaper, PaperSection, Question } from '@/src/types/api';

// ── Difficulty badge ───────────────────────────────────────────────────────────
function DiffBadge({ d }: { d: string }) {
  const map: Record<string, string> = {
    easy:   'badge-easy',
    medium: 'badge-moderate',
    hard:   'badge-challenging',
  };
  const label = d.charAt(0).toUpperCase() + d.slice(1);
  return <span className={'badge no-pdf ' + (map[d] || 'badge-easy')}>{label}</span>;
}

// ── Question row ───────────────────────────────────────────────────────────────
function QuestionRow({ q, no }: { q: Question; no: number }) {
  return (
    <div className="paper-question">
      <span style={{ fontWeight: 700, minWidth: 22, color: '#111' }}>{no}.</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <p style={{ flex: 1, lineHeight: 1.7 }}>
            <DiffBadge d={q.difficulty} />
            {q.questionText.replace(/\[(Easy|Medium|Hard|easy|medium|hard)\]\s*/g, '')}
          </p>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#555', whiteSpace: 'nowrap', background: '#F9FAFB', padding: '2px 8px', borderRadius: 5, border: '1px solid #E5E7EB' }}>
            [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
          </span>
        </div>
        {q.options && q.options.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginTop: 6 }}>
            {q.options.map((o, i) => (
              <p key={i} style={{ fontSize: 13 }}>
                <strong>{String.fromCharCode(65 + i)}.</strong> {o}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section block ──────────────────────────────────────────────────────────────
function SectionBlock({ s, onRegenerate, regenSection, disabled }: {
  s: PaperSection;
  onRegenerate: (title: string) => void;
  regenSection: string | null;
  disabled?: boolean;
}) {
  const [title, ...rest] = s.instruction.split('.');
  let qNo = 0;
  return (
    <div style={{ marginBottom: 32 }}>
      <p className="paper-section-title">{s.title}</p>
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{title}.</p>
      {rest.length > 0 && <p style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>{rest.join('.').trim()}</p>}
      {s.questions.map((q) => {
        qNo++;
        return <QuestionRow key={qNo} q={q} no={qNo} />;
      })}
      <button
        onClick={() => onRegenerate(s.title)}
        disabled={disabled || regenSection === s.title}
        style={{ marginTop: 8, fontSize: 11, color: regenSection === s.title ? '#E8602C' : '#9CA3AF', background: 'none', border: '1px solid ' + (regenSection === s.title ? '#E8602C' : '#E5E7EB'), borderRadius: 8, padding: '4px 12px', cursor: disabled || regenSection === s.title ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled || regenSection === s.title ? 0.7 : 1 }}
        onMouseEnter={e => { if (regenSection !== s.title) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8602C'; (e.currentTarget as HTMLButtonElement).style.color = '#E8602C'; }}}
        onMouseLeave={e => { if (regenSection !== s.title) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; }}}
      >
        {regenSection === s.title ? '⏳ Regenerating…' : `↺ Regenerate ${s.title}`}
      </button>
    </div>
  );
}

// ── Answer key ─────────────────────────────────────────────────────────────────
function AnswerKey({ sections }: { sections: PaperSection[] }) {
  const answered = sections.flatMap(s => s.questions.filter(q => q.answer));
  if (!answered.length) return null;
  let no = 0;
  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px dashed #E5E7EB' }}>
      <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151' }}>Answer Key:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {answered.map((q) => {
          no++;
          return (
            <div key={no} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
              <span style={{ fontWeight: 700, minWidth: 20, color: '#374151' }}>{no}.</span>
              <p style={{ color: '#555', lineHeight: 1.6 }}>{q.answer}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ResultPage() {
  const { assignmentId }      = useParams<{ assignmentId: string }>();
  const router                = useRouter();
  const [paper, setPaper]     = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [regen,        setRegen]       = useState(false);
  const [regenSection, setRegenSection] = useState<string | null>(null);
  const [pdfLoading,   setPdfLoading]  = useState(false);

  const fetchPaper = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getResultByAssignmentId(assignmentId);
      if (!data) {
        setError('No paper found for this assignment.');
      } else {
        setPaper(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
  const loadPaper = async () => {
    await fetchPaper();
  };

  void loadPaper();
}, [fetchPaper]);

  const handleRegenerate = async () => {
  if (!assignmentId || regen || regenSection || pdfLoading) return;

  setRegen(true);
  try {
    const updated = await regeneratePaper(assignmentId);
    setPaper(updated);
  } catch (err) {
    alert('Regenerate failed: ' + (err as Error).message);
  } finally {
    setRegen(false);
  }
};

  const handleRegenerateSection = async (sectionTitle: string) => {
  if (!assignmentId || regen || regenSection || pdfLoading) return;
    setRegenSection(sectionTitle);
    try {
      const updated = await regenerateSection(assignmentId, sectionTitle);
      setPaper(updated);
    } catch (err) {
      alert('Section regenerate failed: ' + (err as Error).message);
    } finally {
      setRegenSection(null);
    }
  };


  const handleDownloadPdf = async () => {
    if (!paper || pdfLoading) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF }     = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const el = document.getElementById('paper-content');
      if (!el) throw new Error('Paper content not found');

      // Temporarily hide the per-section regenerate buttons from PDF
      // Temporarily hide UI-only elements from PDF
const hiddenEls = el.querySelectorAll<HTMLElement>('button, .no-pdf');
hiddenEls.forEach((node) => {
  node.dataset.originalDisplay = node.style.display;
  node.style.display = 'none';
});

const canvas = await html2canvas(el, {
  scale:           2,
  useCORS:         true,
  backgroundColor: '#ffffff',
  logging:         false,
});

hiddenEls.forEach((node) => {
  node.style.display = node.dataset.originalDisplay || '';
  delete node.dataset.originalDisplay;
});

      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW    = pdf.internal.pageSize.getWidth();
      const pageH    = pdf.internal.pageSize.getHeight();
      const margin   = 10;
      const imgW     = pageW - margin * 2;
      const imgH     = (canvas.height * imgW) / canvas.width;
      const totalPages = Math.ceil(imgH / (pageH - margin * 2));

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, margin - i * (pageH - margin * 2), imgW, imgH);
      }

      const safeName = (paper.title || 'question-paper')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      pdf.save(`vedaai-question-paper-${safeName}.pdf`);
    } catch (err) {
      alert('PDF generation failed: ' + (err as Error).message);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell topBarProps={{ showBack: true, backHref: '/assignments', breadcrumb: 'Result' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #E8602C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} className="animate-spin" />
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Loading question paper...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !paper) {
    return (
      <AppShell topBarProps={{ showBack: true, backHref: '/assignments', breadcrumb: 'Result' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
          <AlertCircle size={40} color="#EF4444" />
          <p style={{ fontSize: 14, color: '#EF4444', textAlign: 'center' }}>{error || 'Paper not found'}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-md" onClick={fetchPaper}>Retry</button>
            <button className="btn btn-primary btn-md" onClick={handleRegenerate}>Generate Paper</button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Paper ────────────────────────────────────────────────────────────────────
  return (
    <AppShell topBarProps={{ showBack: true, backHref: '/assignments', breadcrumb: 'Create New' }}>
      {/* AI banner */}
      <div style={{ background: '#111827', color: 'white', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.6, flex: 1 }}>
          ✅ Question paper generated successfully using <strong style={{ color: 'white' }}>{paper.generationSource === 'ai' ? paper.modelName : 'demo fallback'}</strong>.
          {paper.totalMarks} total marks · {paper.sections.length} section{paper.sections.length !== 1 ? 's' : ''}.
        </p>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', flexShrink: 0 }}
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
        >
          <Download size={13} /> {pdfLoading ? 'Preparing PDF…' : 'Download as PDF'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Paper content */}
        <div className="card" style={{ flex: 1, overflow: 'hidden', borderLeft: '4px solid #4F46E5' }}>
          <div className="paper-container" style={{ padding: '36px 40px' }} id="paper-content">
            {/* School header */}
            <div className="paper-header">
              <h1 style={{ fontSize: 18, fontWeight: 900 }}>Delhi Public School, Sector-4, Bokaro</h1>
              <p style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Subject: {paper.subject}</p>
              <p style={{ fontSize: 13 }}>{paper.grade}</p>
            </div>

            <div className="paper-meta-row">
              <span>Time Allowed: <strong>45 minutes</strong></span>
              <span>Maximum Marks: <strong>{paper.totalMarks}</strong></span>
            </div>

            <p style={{ fontSize: 13, fontStyle: 'italic', color: '#555', marginBottom: 20 }}>
              All questions are compulsory unless stated otherwise.
            </p>

            {/* Student info */}
            <div className="paper-student-row">
              {[{ label: 'Name', w: 120 }, { label: 'Roll Number', w: 100 }, { label: 'Class & Section', w: 70 }].map(({ label, w }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <span>{label}:</span>
                  <span className="paper-underline" style={{ minWidth: w }} />
                </div>
              ))}
            </div>

            {/* Sections */}
            {paper.sections.map(s => (
              <SectionBlock
  key={s.title}
  s={s}
  onRegenerate={handleRegenerateSection}
  regenSection={regenSection}
  disabled={regen || pdfLoading}
/>
            ))}

            <p style={{ textAlign: 'center', fontWeight: 900, fontSize: 13, marginTop: 24 }}>
              *** End of Question Paper ***
            </p>

            <AnswerKey sections={paper.sections} />
          </div>
        </div>

        {/* Action sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 160, flexShrink: 0, position: 'sticky', top: 78 }}>
          <button className="btn btn-primary btn-md" style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={handleDownloadPdf}
            disabled={pdfLoading}>
            <Download size={14} /> {pdfLoading ? 'Preparing…' : 'Download PDF'}
          </button>
          <button className="btn btn-secondary btn-md" style={{ width: '100%', justifyContent: 'flex-start' }}
            disabled={regen} onClick={handleRegenerate}>
            <RefreshCw size={14} className={regen ? 'animate-spin' : ''} />
            {regen ? 'Regenerating…' : 'Regenerate'}
          </button>
          <button className="btn btn-secondary btn-md" style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}>
            <Share2 size={14} /> Copy Link
          </button>
          <button className="btn btn-ghost btn-md" style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => window.print()}>
            <Printer size={14} /> Print
          </button>

          {/* Source badge */}
          <div style={{ marginTop: 8, padding: '8px 10px', background: paper.generationSource === 'ai' ? '#ECFDF5' : '#F9FAFB', borderRadius: 10, border: '1px solid ' + (paper.generationSource === 'ai' ? '#A7F3D0' : '#E5E7EB') }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: paper.generationSource === 'ai' ? '#10B981' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {paper.generationSource === 'ai' ? '🤖 AI Generated' : '📋 Demo Paper'}
            </p>
            <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{paper.modelName}</p>
          </div>
        </div>
      </div>

      {/* Mobile action bar */}
      <div style={{ display: 'none' }} className="mobile-action-bar">
        <style>{`@media(max-width:1023px){.mobile-action-bar{display:flex!important;position:fixed;bottom:60px;left:0;right:0;background:white;border-top:1px solid #E5E7EB;padding:10px 16px;gap:8px;z-index:20;}}`}</style>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleDownloadPdf} disabled={pdfLoading}>
          <Download size={13} /> {pdfLoading ? 'Preparing…' : 'Download'}
        </button>
       <button
  className="btn btn-secondary btn-sm"
  style={{ flex: 1 }}
  onClick={handleRegenerate}
  disabled={regen || !!regenSection || pdfLoading}
>
  <RefreshCw size={13} className={regen ? 'animate-spin' : ''} />
  {regen ? 'Regenerating…' : 'Regenerate'}
</button>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}><Share2 size={13} /> Share</button>
      </div>
    </AppShell>
  );
}