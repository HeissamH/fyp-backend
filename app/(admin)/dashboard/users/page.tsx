'use client';

import { useState } from 'react';
import { useUsers, useUpdateUser, useCreateUser, useDeleteUser } from './query';
import { useRoles } from '@/app/(admin)/dashboard/roles/query';
import { useColleges, useProgrammes } from '@/app/(admin)/dashboard/platform/query';
import { DataTable } from '@/components/admin/ui/DataTable';
import { DataTableSkeleton } from '@/components/admin/ui/DataTableSkeleton';
import { usersColumns } from '@/components/admin/users/UsersColumns';
import { ConfirmModal } from '@/components/admin/ui/ConfirmModal';
import { X, Plus, Loader2, Users, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

// ── Add User Modal ─────────────────────────────────────────────────────────────
function AddUserModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [collegeId, setCollegeId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');

  const { mutate: createUser, isPending } = useCreateUser();
  const { data: rolesData } = useRoles();
  const { data: collegesData } = useColleges();
  const { data: programmesData } = useProgrammes();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return toast.error('Full name, email and password are required');
    createUser(
      {
        fullName,
        email,
        password,
        registrationNumber: registrationNumber || undefined,
        roleIds: roleIds.length > 0 ? roleIds : undefined,
        collegeId: collegeId || undefined,
        programmeId: programmeId || undefined,
        yearOfStudy: yearOfStudy ? Number(yearOfStudy) : undefined,
      },
      {
        onSuccess: () => { toast.success('User created successfully'); onClose(); },
        onError: (err: any) => toast.error(err.message || 'Failed to create user'),
      }
    );
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Add New User</h2>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={fGroup}>
              <label style={lStyle}>Full Name *</label>
              <input style={iStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
            </div>
            <div style={fGroup}>
              <label style={lStyle}>Email *</label>
              <input type="email" style={iStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="john@udsminfo.com" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={fGroup}>
              <label style={lStyle}>Password *</label>
              <input type="password" style={iStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required />
            </div>
            <div style={fGroup}>
              <label style={lStyle}>Reg. Number</label>
              <input style={iStyle} value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="T21-CS-001" />
            </div>
          </div>

          <div style={fGroup}>
            <label style={lStyle}>Roles</label>
            <select
              style={sStyle}
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val && !roleIds.includes(val)) {
                  setRoleIds([...roleIds, val]);
                }
              }}
            >
              <option value="">— Add Role (optional) —</option>
              {rolesData?.data
                ?.filter((r: any) => !roleIds.includes(r.id))
                .map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
            {roleIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {roleIds.map((id) => {
                  const r = rolesData?.data?.find((x: any) => x.id === id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--surface)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {r?.name || id}
                      <button
                        type="button"
                        onClick={() => setRoleIds(roleIds.filter((x) => x !== id))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={fGroup}>
              <label style={lStyle}>College</label>
              <select style={sStyle} value={collegeId} onChange={e => setCollegeId(e.target.value)}>
                <option value="">— Select College —</option>
                {collegesData?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
              </select>
            </div>
            <div style={fGroup}>
              <label style={lStyle}>Programme</label>
              <select style={sStyle} value={programmeId} onChange={e => setProgrammeId(e.target.value)}>
                <option value="">— Select Programme —</option>
                {programmesData?.data?.map((p: any) => <option key={p.id} value={p.id}>{p.shortName}</option>)}
              </select>
            </div>
          </div>

          <div style={fGroup}>
            <label style={lStyle}>Year of Study</label>
            <select style={sStyle} value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}>
              <option value="">— Not Applicable —</option>
              {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isPending} style={submitBtnStyle}>
              {isPending ? <Loader2 size={14} style={{ marginRight: '6px' }} /> : <Plus size={14} style={{ marginRight: '6px' }} />}
              {isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Users Page ──────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, isLoading, isError } = useUsers({ page, pageSize: 20, search });
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const total = data?.meta?.total || 0;
  const users: any[] = data?.data || [];
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    updateUser(
      { id: userId, data: { isActive: !currentStatus } },
      {
        onSuccess: () => toast.success(`User set to ${!currentStatus ? 'Active' : 'Inactive'}`),
        onError: () => toast.error('Failed to change user status'),
      }
    );
  };

  return (
    <div>
      {/* Search + Add User */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '10px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', width: '240px', outline: 'none' }}
        />
        <button onClick={() => setIsAddModalOpen(true)} style={addBtnStyle}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Add User
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={<Users size={20} color="#388bfd" />} label="Total Users" value={total} color="#388bfd" />
        <StatCard icon={<UserCheck size={20} color="#3fb950" />} label="Active Users" value={isLoading ? '...' : activeCount} color="#3fb950" />
        <StatCard icon={<UserX size={20} color="#ff7b72" />} label="Inactive Users" value={isLoading ? '...' : inactiveCount} color="#ff7b72" />
      </div>

      {/* Title — below stat cards */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'var(--text)' }}>Users</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage platform users, roles, and access.</p>
      </div>

      {/* Table */}
      {isLoading ? (
        <DataTableSkeleton columns={6} rows={10} />
      ) : isError ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--danger)' }}>Failed to load users.</div>
      ) : (
        <DataTable
          columns={usersColumns({ onToggleStatus: handleToggleStatus, onDelete: setDeleteTarget })}
          data={users}
          pagination={{ page, total, pageSize: 20, onPageChange: setPage }}
        />
      )}

      {isAddModalOpen && <AddUserModal onClose={() => setIsAddModalOpen(false)} />}

      {deleteTarget && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete ${deleteTarget.fullName}? This action cannot be undone.`}
          confirmLabel="Delete"
          isPending={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteUser(deleteTarget.id, {
              onSuccess: () => { toast.success('User deleted'); setDeleteTarget(null); },
              onError: (err: any) => toast.error(err.message || 'Failed to delete user'),
            });
          }}
        />
      )}
    </div>
  );
}

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

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modalStyle: React.CSSProperties = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '560px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
const modalHeaderStyle: React.CSSProperties = { padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const fGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' };
const lStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: 'var(--text)' };
const iStyle: React.CSSProperties = { padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const sStyle: React.CSSProperties = { ...iStyle, cursor: 'pointer' };
const cancelBtnStyle: React.CSSProperties = { padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 };
const submitBtnStyle: React.CSSProperties = { padding: '10px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' };
const addBtnStyle: React.CSSProperties = { padding: '10px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' };
