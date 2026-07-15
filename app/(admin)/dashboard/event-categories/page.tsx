'use client';

import { useState } from 'react';
import { useEventCategories, useCreateEventCategory, useUpdateEventCategory, useDeleteEventCategory } from './query';
import { DataTable } from '@/components/admin/ui/DataTable';
import { DataTableSkeleton } from '@/components/admin/ui/DataTableSkeleton';
import { ColumnDef } from '@tanstack/react-table';
import { X, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function CreateCategoryModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('');
  const { mutate: create, isPending } = useCreateEventCategory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Category name is required');
    create({ name: name.trim(), iconName: iconName.trim() || undefined }, {
      onSuccess: () => { toast.success('Category added'); onClose(); },
      onError: (err: any) => toast.error(err.message || 'Failed to add category'),
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Add Event Category</h2>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={formGroup}>
            <label style={labelStyle}>Category Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sports & Entertainment" required />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Icon Name (Material Icons)</label>
            <input style={inputStyle} value={iconName} onChange={e => setIconName(e.target.value)} placeholder="e.g. sports, school, work (optional)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isPending} style={submitBtnStyle}>
              {isPending && <Loader2 size={14} style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />}
              {isPending ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCategoryModal({ category, onClose }: { category: any; onClose: () => void }) {
  const [name, setName] = useState(category.name);
  const [iconName, setIconName] = useState(category.iconName || '');
  const { mutate: update, isPending } = useUpdateEventCategory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Category name is required');
    update({ id: category.id, data: { name: name.trim(), iconName: iconName.trim() || undefined } }, {
      onSuccess: () => { toast.success('Category updated'); onClose(); },
      onError: (err: any) => toast.error(err.message || 'Failed to update category'),
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Edit Category</h2>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={formGroup}>
            <label style={labelStyle}>Category Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Icon Name</label>
            <input style={inputStyle} value={iconName} onChange={e => setIconName(e.target.value)} />
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

export default function EventCategoriesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { data, isLoading } = useEventCategories();
  const { mutate: deleteCategory } = useDeleteEventCategory();

  const handleDelete = (category: any) => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    deleteCategory(category.id, {
      onSuccess: () => toast.success('Category deleted'),
      onError: (err: any) => toast.error(err.message || 'Failed to delete category'),
    });
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Category Name',
      cell: ({ row }) => <span style={{ fontWeight: 500 }}>{row.original.name}</span>,
    },
    { accessorKey: 'slug', header: 'Slug' },
    {
      accessorKey: 'iconName',
      header: 'Icon',
      cell: ({ row }) => row.original.iconName || <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => setEditingCategory(row.original)} style={iconBtnStyle} title="Edit">
            <Pencil size={15} />
          </button>
          <button onClick={() => handleDelete(row.original)} style={{ ...iconBtnStyle, color: 'var(--danger, #e00)' }} title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text)' }}>Event Categories</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage categories used to group events (Sports, Career, Religious, etc.).</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} style={createBtnStyle}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Add Category
        </button>
      </div>

      {isLoading ? <DataTableSkeleton columns={4} rows={5} /> : (
        <DataTable columns={columns} data={data?.data || []} />
      )}

      {isCreateOpen && <CreateCategoryModal onClose={() => setIsCreateOpen(false)} />}
      {editingCategory && <EditCategoryModal category={editingCategory} onClose={() => setEditingCategory(null)} />}
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
const iconBtnStyle: React.CSSProperties = { padding: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)' };
