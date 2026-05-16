'use client';

import { use, useState } from 'react';
import { useUser, useUpdateUser, useAssignUserRole, useRevokeUserRole } from '../query';
import { useRoles } from '@/app/(admin)/dashboard/roles/query';
import { useAuditLogs } from '@/app/(admin)/dashboard/audit-logs/query';
import { DataTableSkeleton } from '@/components/admin/ui/DataTableSkeleton';
import { Badge } from '@/components/admin/ui/Badge';
import {
  ArrowLeft, Save, Loader2, User, ShieldCheck, Calendar,
  Activity, Megaphone, CalendarDays, LogIn, FilePen, Trash2,
  PlusCircle, Clock, Globe, FileText, Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ── Action icon & label helpers ──────────────────────────────────────────────
function getActionMeta(action: string) {
  if (action.includes('LOGIN'))  return { icon: <LogIn size={14} />, color: '#3fb950', label: 'Logged in' };
  if (action.includes('CREATE_ANNOUNCEMENT')) return { icon: <Megaphone size={14} />, color: '#388bfd', label: 'Created announcement' };
  if (action.includes('UPDATE_ANNOUNCEMENT')) return { icon: <FilePen size={14} />, color: '#d29922', label: 'Updated announcement' };
  if (action.includes('DELETE_ANNOUNCEMENT')) return { icon: <Trash2 size={14} />, color: '#ff7b72', label: 'Deleted announcement' };
  if (action.includes('CREATE_EVENT')) return { icon: <CalendarDays size={14} />, color: '#388bfd', label: 'Created event' };
  if (action.includes('UPDATE_EVENT')) return { icon: <FilePen size={14} />, color: '#d29922', label: 'Updated event' };
  if (action.includes('DELETE_EVENT')) return { icon: <Trash2 size={14} />, color: '#ff7b72', label: 'Deleted event' };
  if (action.includes('CREATE_STORY')) return { icon: <PlusCircle size={14} />, color: '#388bfd', label: 'Uploaded story' };
  if (action.includes('DELETE_STORY')) return { icon: <Trash2 size={14} />, color: '#ff7b72', label: 'Deleted story' };
  if (action.includes('CREATE')) return { icon: <PlusCircle size={14} />, color: '#388bfd', label: action.replace('CREATE_', '').toLowerCase().replace(/_/g, ' ') };
  if (action.includes('UPDATE')) return { icon: <FilePen size={14} />, color: '#d29922', label: action.replace('UPDATE_', '').toLowerCase().replace(/_/g, ' ') };
  if (action.includes('DELETE')) return { icon: <Trash2 size={14} />, color: '#ff7b72', label: action.replace('DELETE_', '').toLowerCase().replace(/_/g, ' ') };
  return { icon: <Activity size={14} />, color: 'var(--text-muted)', label: action.replace(/_/g, ' ').toLowerCase() };
}

// ── Activity Feed ────────────────────────────────────────────────────────────
function UserActivityFeed({ userId }: { userId: string }) {
  const [tab, setTab] = useState<'all' | 'created' | 'posts' | 'uploads' | 'logins'>('all');
  const [logPage, setLogPage] = useState(1);

  // Determine action/entity filter based on active tab
  const tabFilters: Record<string, { action?: string, entity?: string }> = { 
    all: {}, 
    created: { action: 'CREATE' },
    posts: { entity: 'POST' },
    uploads: { entity: 'MEDIA' },
    logins: { action: 'LOGIN' } 
  };

  const { data, isLoading } = useAuditLogs({
    userId,
    action: tabFilters[tab].action,
    entity: tabFilters[tab].entity,
    page: logPage,
    pageSize: 15,
  });

  const logs: any[] = data?.data || [];
  const total: number = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / 15);

  const tabs = [
    { id: 'all', label: 'All Activity', icon: <Activity size={14} /> },
    { id: 'posts', label: 'Posts', icon: <FileText size={14} /> },
    { id: 'uploads', label: 'Uploads', icon: <ImageIcon size={14} /> },
    { id: 'created', label: 'Created Content', icon: <PlusCircle size={14} /> },
    { id: 'logins', label: 'Login History', icon: <LogIn size={14} /> },
  ] as const;

  return (
    <div style={{ marginTop: '28px' }}>
      <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={17} /> User Activity
      </h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setLogPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === t.id ? 'var(--primary-h)' : 'var(--text-muted)',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center', paddingRight: '4px' }}>
          {total} record{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Feed */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {isLoading ? (
          <DataTableSkeleton columns={1} rows={6} />
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            No activity found for this filter.
          </div>
        ) : (
          <>
            {logs.map((log: any, idx: number) => {
              const meta = getActionMeta(log.action || '');
              const date = new Date(log.createdAt);
              const entity = log.entityType || log.entity;
              return (
                <div
                  key={log.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 20px',
                    borderBottom: idx < logs.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {/* Icon bubble */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: `${meta.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: meta.color, flexShrink: 0, marginTop: '2px'
                  }}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', textTransform: 'capitalize' }}>
                        {meta.label}
                      </span>
                      {entity && (
                        <Badge variant="default">{entity}</Badge>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                      </span>
                      {log.ipAddress && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={11} /> {log.ipAddress}
                        </span>
                      )}
                      {log.entityId && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          ID: {log.entityId.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--surface-2)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Page {logPage} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={logPage <= 1}
                    onClick={() => setLogPage(p => p - 1)}
                    style={{ padding: '6px 14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '13px', cursor: logPage <= 1 ? 'not-allowed' : 'pointer', opacity: logPage <= 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={logPage >= totalPages}
                    onClick={() => setLogPage(p => p + 1)}
                    style={{ padding: '6px 14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '13px', cursor: logPage >= totalPages ? 'not-allowed' : 'pointer', opacity: logPage >= totalPages ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useUser(id);
  const { data: rolesData } = useRoles();
  const { mutate: updateUser, isPending } = useUpdateUser();
  const { mutate: assignRole, isPending: assigning } = useAssignUserRole();
  const { mutate: revokeRole, isPending: revoking } = useRevokeUserRole();
  const [roleToAddId, setRoleToAddId] = useState('');

  const user = data?.data;
  const roles = rolesData?.data || [];
  const assignedRoles = (user?.roles || []) as { id: string; name: string }[];
  const availableRoles = roles.filter((r: { id: string }) => !assignedRoles.some((a) => a.id === r.id));
  const rolesBusy = assigning || revoking;

  const handleAddRole = () => {
    if (!roleToAddId) return toast.error('Choose a role to add');
    assignRole(
      { userId: id, roleId: roleToAddId },
      {
        onSuccess: () => {
          toast.success('Role assigned');
          setRoleToAddId('');
        },
        onError: (err: unknown) =>
          toast.error(err instanceof Error ? err.message : 'Failed to assign role'),
      },
    );
  };

  const handleRevokeRole = (roleId: string) => {
    revokeRole(
      { userId: id, roleId },
      {
        onSuccess: () => toast.success('Role removed'),
        onError: (err: unknown) =>
          toast.error(err instanceof Error ? err.message : 'Failed to revoke role'),
      },
    );
  };

  const handleToggleStatus = () => {
    updateUser({ id, data: { isActive: !user?.isActive } }, {
      onSuccess: () => toast.success(`User ${user?.isActive ? 'deactivated' : 'activated'}`),
      onError: (err: any) => toast.error(err.message || 'Failed to update status'),
    });
  };

  if (isLoading) return <DataTableSkeleton columns={1} rows={6} />;
  if (!user) return <div style={{ color: 'var(--danger)', padding: '24px' }}>User not found.</div>;

  return (
    <div style={{ width: '100%', maxWidth: '1400px' }}>
      {/* Back nav */}
      <Link href="/dashboard/users" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to Users
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #8957ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text)' }}>{user.fullName}</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{user.email}</div>
          </div>
        </div>
        <Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Deactivated'}</Badge>
      </div>

      {/* Profile & Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Info Card */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}><User size={16} style={{ marginRight: '8px' }} />Profile Details</h3>
          <div style={infoGrid}>
            <InfoRow label="Reg Number" value={user.registrationNumber || 'N/A'} />
            <InfoRow label="College" value={user.college?.name || 'N/A'} />
            <InfoRow label="Programme" value={user.programme?.name || 'N/A'} />
            <InfoRow label="Year of Study" value={user.yearOfStudy ? `Year ${user.yearOfStudy}` : 'N/A'} />
            <InfoRow label="Phone" value={user.phoneNumber || 'N/A'} />
            <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Role Management */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}><ShieldCheck size={16} style={{ marginRight: '8px' }} />Role Assignment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Assigned roles</label>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {assignedRoles.length === 0 ? (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No roles (unexpected)</span>
                  ) : (
                    assignedRoles.map((r) => (
                      <div
                        key={r.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                      >
                        <Badge variant={r.name === 'admin' ? 'info' : 'default'}>{r.name}</Badge>
                        <button
                          type="button"
                          onClick={() => handleRevokeRole(r.id)}
                          disabled={rolesBusy}
                          style={{
                            ...primaryBtnStyle,
                            width: 'auto',
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: 'rgba(218,54,51,0.12)',
                            color: '#ff7b72',
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Add role</label>
                <select
                  style={selectStyle}
                  value={roleToAddId}
                  onChange={(e) => setRoleToAddId(e.target.value)}
                >
                  <option value="">— Select role —</option>
                  {availableRoles.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddRole}
                disabled={isPending || rolesBusy || !roleToAddId || availableRoles.length === 0}
                style={{
                  ...primaryBtnStyle,
                  opacity: !roleToAddId || rolesBusy ? 0.5 : 1,
                }}
              >
                {rolesBusy ? <Loader2 size={14} style={{ marginRight: '6px' }} /> : <Save size={14} style={{ marginRight: '6px' }} />}
                Add role
              </button>
            </div>
          </div>

          {/* Status */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}><Calendar size={16} style={{ marginRight: '8px' }} />Account Status</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
              {user.isActive ? 'This user can log in and use the platform normally.' : 'This account is deactivated. The user cannot log in.'}
            </p>
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              style={{ ...primaryBtnStyle, backgroundColor: user.isActive ? 'rgba(218,54,51,0.15)' : 'rgba(46,160,67,0.15)', color: user.isActive ? '#ff7b72' : '#3fb950' }}
            >
              {user.isActive ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Activity Section ── */}
      <UserActivityFeed userId={id} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '14px', color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' };
const cardTitleStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 16px 0' };
const infoGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const labelStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 500, color: 'var(--text)' };
const selectStyle: React.CSSProperties = { padding: '10px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '14px', outline: 'none', width: '100%', marginTop: '6px', cursor: 'pointer' };
const primaryBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', width: '100%', fontSize: '14px' };
