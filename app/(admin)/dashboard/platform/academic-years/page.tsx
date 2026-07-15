'use client';

import { useState } from 'react';
import { useAcademicYears, useCreateAcademicYear, useSetCurrentAcademicYear } from '../query';
import { DataTable } from '@/components/admin/ui/DataTable';
import { DataTableSkeleton } from '@/components/admin/ui/DataTableSkeleton';
import { Badge } from '@/components/admin/ui/Badge';
import { ColumnDef } from '@tanstack/react-table';
import { X, Plus, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function CreateAcademicYearModal({ onClose }: { onClose: () => void }) {
  const [year, setYear] = useState('2025/2026');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const { mutate: createYear, isPending } = useCreateAcademicYear();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !startDate || !endDate) return toast.error('All fields are required');
    createYear({ year, startDate, endDate, isCurrent }, {
      onSuccess: () => { toast.success('Academic year added'); onClose(); },
      onError: (err: any) => toast.error(err.message || 'Failed to create academic year'),
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Add Academic Year</h2>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={formGroup}>
            <label style={labelStyle}>Academic Year Label</label>
            <input style={inputStyle} value={year} onChange={e => setYear(e.target.value)} placeholder="2025/2026" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={formGroup}>
              <label style={labelStyle}>Start Date</label>
              <input type="date" style={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div style={formGroup}>
              <label style={labelStyle}>End Date</label>
              <input type="date" style={inputStyle} value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text)' }}>
            <input type="checkbox" checked={isCurrent} onChange={e => setIsCurrent(e.target.checked)} />
            Set as Current Academic Year
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isPending} style={submitBtnStyle}>
              {isPending && <Loader2 size={14} style={{ marginRight: '6px' }} />}
              {isPending ? 'Adding...' : 'Add Year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AcademicYearsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading } = useAcademicYears();
  const { mutate: setCurrent, isPending: isSettingCurrent } = useSetCurrentAcademicYear();

  const handleSetCurrent = (id: string, year: string) => {
    setCurrent(id, {
      onSuccess: () => toast.success(`${year} is now the current academic year`),
      onError: (err: any) => toast.error(err.message || 'Failed to update'),
    });
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'label',
      header: 'Academic Year',
      cell: ({ row }) => (
        <span style={{ fontWeight: 500 }}>
          {row.original.label || row.original.year || '—'}
        </span>
      ),
    },
    { accessorKey: 'startDate', header: 'Start', cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString() },
    { accessorKey: 'endDate', header: 'End', cell: ({ row }) => new Date(row.original.endDate).toLocaleDateString() },
    {
      accessorKey: 'isCurrent',
      header: 'Status',
      cell: ({ row }) => row.original.isCurrent
        ? <Badge variant="success">Current Year</Badge>
        : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Inactive</span>
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const yr = row.original;
        if (yr.isCurrent) return null;
        const label = yr.label || yr.year || 'year';
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleSetCurrent(yr.id, label)}
              disabled={isSettingCurrent}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', cursor: 'pointer', fontSize: '13px' }}
              title="Set as Current Year"
            >
              <Star size={14} color="var(--warning)" />
              Set Current
            </button>
          </div>
        );
      }
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text)' }}>Academic Years</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage university academic calendars.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={createBtnStyle}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Add Academic Year
        </button>
      </div>

      {isLoading ? <DataTableSkeleton columns={5} rows={4} /> : (
        <DataTable columns={columns} data={data?.data || []} />
      )}

      {isModalOpen && <CreateAcademicYearModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modalStyle: React.CSSProperties = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
const modalHeader: React.CSSProperties = { padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const formGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 500, color: 'var(--text)' };
const inputStyle: React.CSSProperties = { padding: '10px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const cancelBtnStyle: React.CSSProperties = { padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 };
const submitBtnStyle: React.CSSProperties = { padding: '10px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' };
const createBtnStyle: React.CSSProperties = { padding: '10px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' };
