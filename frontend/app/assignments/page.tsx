'use client';
import { useState }        from 'react';
import Link                from 'next/link';
import { useRouter }       from 'next/navigation';
import { Search, Filter, Plus, MoreVertical, Eye, Trash2, RefreshCw } from 'lucide-react';
import { AppShell }        from '@/src/components/layout/AppShell';
import { useAssignments }  from '@/src/hooks/useAssignments';
import type { Assignment } from '@/src/types/api';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Assignment['status'] }) {
  const map = {
    draft:      { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
    generating: { bg: '#EFF6FF', color: '#3B82F6', label: 'Generating…' },
    completed:  { bg: '#ECFDF5', color: '#10B981', label: 'Completed' },
    failed:     { bg: '#FEF2F2', color: '#EF4444', label: 'Failed' },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 99, background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 168, height: 168, marginBottom: 28 }}>
        <div style={{ width: 168, height: 168, background: '#F0F0F5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 80, height: 90 }}>
            <div style={{ width: 64, height: 80, background: 'white', border: '2px solid #E2E2EA', borderRadius: 10, padding: '10px', display: 'flex', flexDirection: 'column', gap: 7, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', position: 'absolute', top: 0, left: 0 }}>
              <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, width: '80%' }} />
              <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2 }} />
              <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, width: '60%' }} />
            </div>
            <div style={{ position: 'absolute', bottom: -4, right: -10, width: 52, height: 52, background: '#EDEDF7', borderRadius: '50%', border: '2.5px solid #D5D5E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#EF4444', fontSize: 22, fontWeight: 900 }}>✕</span>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 18, width: 14, height: 14, background: '#E0DEFF', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 20, left: 8, width: 10, height: 10, background: '#DBEAFE', borderRadius: '50%' }} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 10 }}>No assignments yet</h2>
      <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 340, lineHeight: 1.75, marginBottom: 28 }}>
        Create your first assignment to start collecting and grading student submissions.
      </p>
      <Link href="/create" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111827', color: 'white', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 14, textDecoration: 'none' }}>
        <Plus size={16} strokeWidth={2.5} /> Create Your First Assignment
      </Link>
    </div>
  );
}

// ── Assignment card ───────────────────────────────────────────────────────────
function AssignmentCard({ a, onDeleted }: { a: Assignment; onDeleted: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleCardClick = () => {
  if (a.status === 'completed') {
    router.push('/result/' + a._id);
  } else if (a.status === 'generating' || a.status === 'draft' || a.status === 'failed') {
    router.push('/generating/' + a._id);
  }
};

  const formattedDue = a.dueDate
    ? new Date(a.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : '—';

  const formattedAssigned = new Date(a.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, '-');

  return (
    <div
      onClick={handleCardClick}
      style={{ background: 'white', border: '1px solid #EFEFEF', borderRadius: 16, padding: '18px 20px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.09)'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.3, paddingRight: 24 }}>{a.title}</h3>
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setOpen(!open)}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#C4C4C4' }}
          >
            <MoreVertical size={15} />
          </button>
          {open && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
              <div style={{ position: 'absolute', right: 0, top: 32, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 152, overflow: 'hidden' }}>
                {a.status === 'completed' && (
                  <Link href={'/result/' + a._id} className="kebab-menu-item" onClick={() => setOpen(false)}>
                    <Eye size={13} color="#9CA3AF" /> View Paper
                  </Link>
                )}
                {(a.status === 'draft' || a.status === 'failed') && (
                  <Link href={'/generating/' + a._id} className="kebab-menu-item" onClick={() => setOpen(false)}>
                    <RefreshCw size={13} color="#9CA3AF" /> Generate
                  </Link>
                )}
                <button className="kebab-menu-item danger" onClick={() => { setOpen(false); onDeleted(); }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <StatusBadge status={a.status} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF' }}>
        <span>Assigned on : <span style={{ color: '#6B7280', fontWeight: 500 }}>{formattedAssigned}</span></span>
        <span>Due <span style={{ color: '#111827', fontWeight: 700 }}>{formattedDue}</span></span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AssignmentsPage() {
  const [search, setSearch] = useState('');
  const { assignments, loading, error, refetch } = useAssignments();

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AppShell topBarProps={{ breadcrumb: 'Assignment' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #E8602C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} className="animate-spin" />
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Loading assignments...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell topBarProps={{ breadcrumb: 'Assignment' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
          <p style={{ fontSize: 14, color: '#EF4444' }}>Failed to load assignments: {error}</p>
          <button className="btn btn-secondary btn-md" onClick={refetch}>Try Again</button>
        </div>
      </AppShell>
    );
  }

  if (assignments.length === 0) {
    return <AppShell topBarProps={{ breadcrumb: 'Assignment' }}><EmptyState /></AppShell>;
  }

  return (
    <AppShell topBarProps={{ breadcrumb: 'Assignment' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', display: 'inline-block' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Assignments</h1>
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 16 }}>Manage and create assignments for your classes</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <Filter size={13} /> Filter By
        </button>
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 340 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Assignment..."
            className="search-input"
          />
        </div>
        <Link href="/create" className="btn btn-dark btn-sm" style={{ marginLeft: 'auto' }}>
          <Plus size={13} strokeWidth={2.5} /> Create Assignment
        </Link>
      </div>

      {filtered.length === 0 ? (
  <div style={{ background: 'white', border: '1px solid #EFEFEF', borderRadius: 16, padding: '40px 24px', textAlign: 'center', color: '#6B7280' }}>
    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No matching assignments</p>
    <p style={{ fontSize: 13 }}>Try a different search term.</p>
  </div>
) : (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
    {filtered.map(a => <AssignmentCard key={a._id} a={a} onDeleted={refetch} />)}
  </div>
)}

      <Link href="/create" style={{ position: 'fixed', bottom: 72, right: 18, width: 48, height: 48, background: '#E8602C', borderRadius: '50%', display: 'none', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(232,96,44,0.35)', color: 'white', zIndex: 20, textDecoration: 'none' }} className="mobile-fab">
        <Plus size={22} strokeWidth={2.5} />
      </Link>
      <style>{`@media(max-width:1023px){.mobile-fab{display:flex!important;}}`}</style>
    </AppShell>
  );
}