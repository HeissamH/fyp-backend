'use client';

import { useState } from 'react';
import { useColleges, useCreateCollege, useUpdateCollege, useDeleteCollege, useProgrammes } from '../query';
import { DataTable } from '@/components/admin/ui/DataTable';
import { DataTableSkeleton } from '@/components/admin/ui/DataTableSkeleton';
import { ColumnDef } from '@tanstack/react-table';
import { ConfirmModal } from '@/components/admin/ui/ConfirmModal';
import { X, Plus, Loader2, Building2, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}

// ── Create College Modal ──────────────────────────────────────────────────────
function CreateCollegeModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { mutate: createCollege, isPending } = useCreateCollege();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !shortName) return toast.error('Both fields are required');
    setErrorMsg('');
    createCollege({ name, shortName }, {
      onSuccess: () => { toast.success('College added successfully'); onClose(); },
      onError: (err: any) => {
        if (err.message?.toLowerCase().includes('already exists') || err.message?.toLowerCase().includes('conflict') || err.message?.toLowerCase().includes('unique')) {
          setErrorMsg('A college with this name or code already exists. Please use a different name or abbreviation.');
        } else {
          setErrorMsg(err.message || 'Failed to add college');
        }
      },
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Add New College</h2>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>
        {errorMsg && (
          <div style={{ margin: '20px 20px 0', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: 'var(--danger)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.4 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={formGroup}>
            <label style={labelStyle}>Full College Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="College of Information and Communication Technology" required />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Abbreviation</label>
            <input style={inputStyle} value={shortName} onChange={e => setShortName(e.target.value)} placeholder="COICT" required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isPending} style={submitBtnStyle}>
              {isPending && <Loader2 size={14} style={{ marginRight: '6px' }} />}
              {isPending ? 'Adding...' : 'Add College'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit College Modal ────────────────────────────────────────────────────────
function EditCollegeModal({ college, onClose }: { college: any; onClose: () => void }) {
  const [name, setName] = useState(college.name);
  const [shortName, setShortName] = useState(college.shortName);
  const [errorMsg, setErrorMsg] = useState('');
  const { mutate: updateCollege, isPending } = useUpdateCollege();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !shortName) return toast.error('Both fields are required');
    setErrorMsg('');
    updateCollege({ id: college.id, data: { name, shortName } }, {
      onSuccess: () => { toast.success('College updated successfully'); onClose(); },
      onError: (err: any) => {
        if (err.message?.toLowerCase().includes('already exists') || err.message?.toLowerCase().includes('conflict') || err.message?.toLowerCase().includes('unique')) {
          setErrorMsg('A college with this abbreviation already exists.');
        } else {
          setErrorMsg(err.message || 'Failed to update college');
        }
      },
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Edit College</h2>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>
        {errorMsg && (
          <div style={{ margin: '20px 20px 0', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: 'var(--danger)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.4 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={formGroup}>
            <label style={labelStyle}>Full College Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Abbreviation</label>
            <input style={inputStyle} value={shortName} onChange={e => setShortName(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isPending} style={submitBtnStyle}>
              {isPending && <Loader2 size={14} style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />}
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Colleges Page ─────────────────────────────────────────────────────────────
export default function CollegesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { data, isLoading } = useColleges();
  const { data: programmesData, isLoading: programmesLoading } = useProgrammes();
  const { mutate: deleteCollege, isPending: isDeleting } = useDeleteCollege();

  const colleges: any[] = data?.data || [];
  // Colleges API has no nested programme counts — use programmes list total (or meta).
  const totalProgrammes =
    programmesData?.meta?.total ??
    (Array.isArray(programmesData?.data) ? programmesData.data.length : 0);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'College Name',
      cell: ({ row }) => <span style={{ fontWeight: 500 }}>{row.original.name}</span>,
    },
    { accessorKey: 'shortName', header: 'Abbreviation' },
    {
      accessorKey: 'createdAt',
      header: 'Added On',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={() => setEditTarget(row.original)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
            title="Edit College"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => setDeleteTarget(row.original)}
            style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
            title="Delete College"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={<Building2 size={20} color="var(--primary)" />} label="Total Colleges" value={isLoading ? '...' : colleges.length} color="var(--primary)" />
        <StatCard icon={<Building2 size={20} color="#3fb950" />} label="Total Programmes" value={isLoading || programmesLoading ? '...' : totalProgrammes} color="#3fb950" />
        <StatCard icon={<Building2 size={20} color="#d29922" />} label="Active Since" value={isLoading ? '...' : (colleges[0] ? new Date(colleges[0].createdAt).getFullYear() : '—')} color="#d29922" />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text)' }}>Colleges</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage university colleges and schools.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={createBtnStyle}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Add College
        </button>
      </div>

      {isLoading ? <DataTableSkeleton columns={4} rows={6} /> : (
        <DataTable columns={columns} data={colleges} />
      )}

      {isModalOpen && <CreateCollegeModal onClose={() => setIsModalOpen(false)} />}
      
      {editTarget && <EditCollegeModal college={editTarget} onClose={() => setEditTarget(null)} />}

      {deleteTarget && (
        <ConfirmModal
          title="Delete College"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          isPending={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteCollege(deleteTarget.id, {
              onSuccess: () => { toast.success('College deleted'); setDeleteTarget(null); },
              onError: (err: any) => toast.error(err.message || 'Failed to delete college'),
            });
          }}
        />
      )}
    </div>
  );
}

// Shared styles
const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modalStyle: React.CSSProperties = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
const modalHeader: React.CSSProperties = { padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const formGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 500, color: 'var(--text)' };
const inputStyle: React.CSSProperties = { padding: '10px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '14px', outline: 'none', width: '100%' };
const cancelBtnStyle: React.CSSProperties = { padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 };
const submitBtnStyle: React.CSSProperties = { padding: '10px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' };
const createBtnStyle: React.CSSProperties = { padding: '10px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' };
