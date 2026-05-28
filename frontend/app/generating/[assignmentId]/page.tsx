'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams }                      from 'next/navigation';
import { CheckCircle2, Circle, AlertCircle, RefreshCw } from 'lucide-react';
import { AppShell }                from '@/src/components/layout/AppShell';
import { getJobByAssignmentId }    from '@/src/lib/api';
import {
  getSocket,
  joinAssignmentRoom,
  leaveAssignmentRoom,
} from '@/src/lib/socket';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TimelineStep {
  id:       string;
  label:    string;
  status:   'pending' | 'active' | 'done' | 'error';
  progress: number;
}

const INITIAL_STEPS: TimelineStep[] = [
  { id: 'queued',          label: 'Assignment Received',    status: 'pending', progress: 0   },
  { id: 'building_prompt', label: 'Structuring AI Prompt',  status: 'pending', progress: 25  },
  { id: 'calling_ai',      label: 'Calling AI Model',       status: 'pending', progress: 40  },
  { id: 'validating',      label: 'Validating Output',      status: 'pending', progress: 65  },
  { id: 'saving',          label: 'Saving Question Paper',  status: 'pending', progress: 75  },
  { id: 'completed',       label: 'Generation Complete',    status: 'pending', progress: 100 },
];

function getStepIndexForProgress(progress: number): number {
  if (progress >= 100) return 5;
  if (progress >= 75)  return 4;
  if (progress >= 65)  return 3;
  if (progress >= 40)  return 2;
  if (progress >= 25)  return 1;
  return 0;
}

// ─── Step icon ────────────────────────────────────────────────────────────────
function StepIcon({ status }: { status: TimelineStep['status'] }) {
  if (status === 'done')
    return <CheckCircle2 size={22} color="#10B981" style={{ flexShrink: 0 }} />;
  if (status === 'error')
    return <AlertCircle  size={22} color="#EF4444" style={{ flexShrink: 0 }} />;
  if (status === 'active')
    return (
      <div style={{
        width: 22, height: 22, flexShrink: 0,
        border: '2.5px solid #E8602C',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
    );
  return <Circle size={22} color="#D1D5DB" style={{ flexShrink: 0 }} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GeneratingPage() {
  const router               = useRouter();
  const { assignmentId }     = useParams<{ assignmentId: string }>();
  const [steps, setSteps]    = useState<TimelineStep[]>(INITIAL_STEPS);
  const [progress, setProgress] = useState(0);
  const [status, setStatus]  = useState<'connecting' | 'queued' | 'processing' | 'completed' | 'failed'>('connecting');
  const [message, setMessage] = useState('Connecting to server...');
  const [error, setError]    = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const autoRedirectTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMock               = !assignmentId || assignmentId === 'mock-assignment-id';

  const updateStepsForProgress = useCallback((prog: number, hasError = false) => {
    const activeIdx = getStepIndexForProgress(prog);
    setSteps(prev => prev.map((step, i) => {
      if (hasError && i === activeIdx) return { ...step, status: 'error'   as const };
      if (i < activeIdx)              return { ...step, status: 'done'    as const };
      if (i === activeIdx)            return { ...step, status: prog >= 100 ? 'done' as const : 'active' as const };
      return { ...step, status: 'pending' as const };
    }));
  }, []);

  // ── Mock simulation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMock) return;

    const progressSteps = [5, 25, 40, 65, 75, 100];
    const messages = [
      'Assignment received...',
      'Structuring AI prompt...',
      'Calling AI model...',
      'Validating output...',
      'Saving paper...',
      'Generation complete!',
    ];

    const startMock = setTimeout(() => {
  setStatus('processing');
}, 0);
    let i = 0;
    let cancelled = false;

    const run = () => {
      if (cancelled || i >= progressSteps.length) {
        if (!cancelled) {
          setStatus('completed');
          setProgress(100);
          updateStepsForProgress(100);
          autoRedirectTimer.current = setTimeout(() => {
            router.push('/result/mock-assignment-id');
          }, 2000);
        }
        return;
      }
      setProgress(progressSteps[i]);
      setMessage(messages[i]);
      updateStepsForProgress(progressSteps[i]);
      i++;
      setTimeout(run, i === 3 ? 3000 : 1200);
    };

    const t = setTimeout(run, 500);

return () => {
  cancelled = true;
  clearTimeout(startMock);
  clearTimeout(t);
  if (autoRedirectTimer.current) clearTimeout(autoRedirectTimer.current);
};
  }, [isMock, router, updateStepsForProgress]);

  // ── Real socket + job fetch ────────────────────────────────────────────────
  useEffect(() => {
    if (isMock) return;

    // Fetch initial job status as page-load fallback
    getJobByAssignmentId(assignmentId).then(job => {
      if (!job) return;

      setProgress(job.progress ?? 0);
      updateStepsForProgress(job.progress ?? 0);

      if (job.status === 'completed') {
        setStatus('completed');
        setMessage('Your question paper is ready!');
        updateStepsForProgress(100);
        return;
      }
      if (job.status === 'failed') {
        setStatus('failed');
        setMessage('Generation failed.');
        setError(job.errorMessage || 'Unknown error');
        updateStepsForProgress(job.progress ?? 0, true);
        return;
      }
      if (job.status === 'processing' || job.status === 'queued') {
        setStatus('processing');
        setMessage('Generation in progress...');
      }
    }).catch(err => console.error('[Generating] Job fetch error:', err));

    // Socket setup
    const socket = getSocket();

    const onConnect = () => {
      setSocketConnected(true);
      setMessage('Connected. Joining room...');
      joinAssignmentRoom(assignmentId);
    };

    const onJoined = () => {
      setStatus('queued');
      setMessage('Waiting for generation to start...');
    };

    const onStarted = (data: { progress: number; message: string }) => {
      setStatus('queued');
      setProgress(data.progress);
      setMessage(data.message);
      updateStepsForProgress(data.progress);
    };

    const onProgress = (data: { progress: number; step: string; message: string }) => {
      setStatus('processing');
      setProgress(data.progress);
      setMessage(data.message);
      updateStepsForProgress(data.progress);
    };

    const onCompleted = (data: { progress: number; message: string }) => {
      setStatus('completed');
      setProgress(100);
      setMessage(data.message);
      updateStepsForProgress(100);
      autoRedirectTimer.current = setTimeout(() => {
        router.push('/result/' + assignmentId);
      }, 2000);
    };

    const onFailed = (data: { progress: number; message: string; error?: string }) => {
      setStatus('failed');
      setProgress(data.progress);
      setMessage(data.message);
      setError(data.error || 'Unknown error');
      updateStepsForProgress(data.progress, true);
    };

    socket.on('connect',              onConnect);
    socket.on('joined',               onJoined);
    socket.on('generation_started',   onStarted);
    socket.on('generation_progress',  onProgress);
    socket.on('generation_completed', onCompleted);
    socket.on('generation_failed',    onFailed);

    if (socket.connected) {
  const joinTimer = setTimeout(() => {
    setSocketConnected(true);
    joinAssignmentRoom(assignmentId);
  }, 0);

  return () => clearTimeout(joinTimer);
}

    return () => {
      leaveAssignmentRoom(assignmentId);
      socket.off('connect',              onConnect);
      socket.off('joined',               onJoined);
      socket.off('generation_started',   onStarted);
      socket.off('generation_progress',  onProgress);
      socket.off('generation_completed', onCompleted);
      socket.off('generation_failed',    onFailed);
      if (autoRedirectTimer.current) clearTimeout(autoRedirectTimer.current);
    };
  }, [isMock, assignmentId, router, updateStepsForProgress]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const r    = 34;
  const circ = 2 * Math.PI * r;

  return (
    <AppShell topBarProps={{ showBack: status === 'failed', backHref: '/assignments', breadcrumb: 'Assignment' }}>
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <div className="card" style={{ padding: '36px 32px' }}>

          {/* Progress ring */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px' }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r={r} fill="none" stroke="#F3F4F6" strokeWidth="7" />
                <circle
                  cx="40" cy="40" r={r} fill="none"
                  stroke={status === 'failed' ? '#EF4444' : status === 'completed' ? '#10B981' : '#E8602C'}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - progress / 100)}
                  style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.3s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {status === 'completed'
                  ? <CheckCircle2 size={28} color="#10B981" />
                  : status === 'failed'
                  ? <AlertCircle  size={28} color="#EF4444" />
                  : <span style={{ fontSize: 14, fontWeight: 900, color: '#111827' }}>{progress}%</span>
                }
              </div>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>
              {status === 'completed'  ? 'Question Paper Ready!'       :
               status === 'failed'     ? 'Generation Failed'           :
               status === 'connecting' ? 'Connecting...'               :
               'Generating Your Question Paper'}
            </h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, lineHeight: 1.6 }}>
              {message}
            </p>

            {!isMock && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: socketConnected ? '#10B981' : '#9CA3AF', display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {socketConnected ? 'Live updates active' : 'Connecting...'}
                </span>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
            {steps.map(step => (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '12px 14px', borderRadius: 12,
                background:
                  step.status === 'active'  ? '#FFF4F0' :
                  step.status === 'done'    ? '#F9FAFB' :
                  step.status === 'error'   ? '#FEF2F2' : 'transparent',
                border:
                  step.status === 'active'  ? '1px solid rgba(232,96,44,0.2)' :
                  step.status === 'error'   ? '1px solid #FECACA'             : '1px solid transparent',
                opacity:   step.status === 'pending' ? 0.4 : 1,
                transition: 'all 0.3s ease',
              }}>
                <StepIcon status={step.status} />
                <span style={{
                  fontSize: 13, fontWeight: step.status === 'active' ? 700 : 600,
                  color:
                    step.status === 'active'  ? '#E8602C' :
                    step.status === 'error'   ? '#EF4444' :
                    step.status === 'done'    ? '#111827' : '#9CA3AF',
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          {status === 'completed' && (
            <div>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => router.push('/result/' + assignmentId)}
              >
                View Question Paper →
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>
                Redirecting automatically in 2 seconds...
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#DC2626' }}>
                  Error: {error}
                </div>
              )}
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => router.push('/assignments')}
              >
                <RefreshCw size={15} /> Back to Assignments
              </button>
            </div>
          )}

          {status !== 'completed' && status !== 'failed' && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#C4C4C4' }}>
              This usually takes 10–30 seconds
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}