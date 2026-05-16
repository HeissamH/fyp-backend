import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/admin/ui/Badge';
import { Power, PowerOff, Trash2 } from 'lucide-react';
import Link from 'next/link';

export const usersColumns = ({
  onToggleStatus,
  onDelete,
}: {
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDelete?: (user: any) => void;
}): ColumnDef<any>[] => [
  {
    accessorKey: 'fullName',
    header: 'Name',
    cell: ({ row }) => (
      <Link href={`/dashboard/users/${row.original.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div>
          <div style={{ fontWeight: 500, color: 'var(--info)' }}>{row.original.fullName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.original.email}</div>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: 'registrationNumber',
    header: 'Reg Number',
  },
  {
    accessorKey: 'roles',
    header: 'Roles',
    cell: ({ row }) => {
      const raw = row.original.roles;
      const names: string[] = Array.isArray(raw)
        ? raw.map((r: { name: string }) => r.name).filter(Boolean)
        : typeof row.original.roleName === 'string'
          ? [row.original.roleName]
          : [];
      const display =
        names.length === 0
          ? [{ key: '_unk', label: 'Unknown', variant: 'default' as const }]
          : names.map((n: string) => ({
              key: n,
              label: (n.charAt(0)?.toUpperCase() ?? '') + n.slice(1),
              variant: n === 'admin' ? ('info' as const) : ('default' as const),
            }));
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '220px' }}>
          {display.map((item) => (
            <Badge key={item.key} variant={item.variant}>
              {item.label}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge variant={isActive ? 'success' : 'danger'}>
          {isActive ? 'Active' : 'Deactivated'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            style={{ ...actionBtn, color: user.isActive ? 'var(--warning)' : '#3fb950' }}
            onClick={() => onToggleStatus(user.id, user.isActive)}
            title={user.isActive ? 'Deactivate User' : 'Activate User'}
          >
            {user.isActive ? <PowerOff size={16} /> : <Power size={16} />}
          </button>

          {onDelete && (
            <button
              style={{ ...actionBtn, color: 'var(--danger)' }}
              onClick={() => onDelete(user)}
              title="Delete User"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      );
    },
  },
];

const actionBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.15s, color 0.15s',
};
