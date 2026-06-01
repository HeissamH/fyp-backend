'use client';

import React, { useState } from 'react';
import { X, CheckSquare, Clock, Eye } from 'lucide-react';
import { Badge } from './Badge';

interface FeedbackDetailModalProps {
  item: {
    id: string;
    subject: string;
    description: string;
    status: string;
    adminNotes?: string;
    categoryName?: string;
    userName?: string;
    userEmail?: string;
    createdAt: string;
  };
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'PENDING' | 'REVIEWED' | 'RESOLVED', adminNotes?: string) => void;
  isPending?: boolean;
}

export function FeedbackDetailModal({
  item,
  onClose,
  onUpdateStatus,
  isPending = false,
}: FeedbackDetailModalProps) {
  const [notes, setNotes] = useState(item.adminNotes || '');

  const statusVariant = (s: string) =>
    s === 'PENDING' ? 'warning' : s === 'REVIEWED' ? 'info' : 'success';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={header}>
          <div>
            <p style={labelStyle}>FEEDBACK DETAIL</p>
            <h2 style={titleStyle}>{item.subject}</h2>
          </div>
          <button onClick={onClose} style={closeBtn} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Meta row */}
        <div style={metaRow}>
          {item.categoryName && (
            <span style={metaChip}>📂 {item.categoryName}</span>
          )}
          {item.userName && (
            <span style={metaChip}>👤 {item.userName}</span>
          )}
          {item.userEmail && (
            <span style={metaChip}>✉️ {item.userEmail}</span>
          )}
          <span style={metaChip}>🕐 {formatDate(item.createdAt)}</span>
          <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
        </div>

        <hr style={divider} />

        {/* Description */}
        <div style={section}>
          <p style={sectionLabel}>Message</p>
          <div style={descriptionBox}>{item.description}</div>
        </div>

        {/* Admin notes */}
        <div style={section}>
          <p style={sectionLabel}>Admin Notes (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note visible to the user..."
            style={textareaStyle}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div style={actions}>
          {item.status !== 'REVIEWED' && (
            <button
              style={{ ...actionBtn, borderColor: 'var(--info, #79c0ff)', color: 'var(--info, #79c0ff)' }}
              disabled={isPending}
              onClick={() => onUpdateStatus(item.id, 'REVIEWED', notes || undefined)}
            >
              <Eye size={14} /> Mark Reviewed
            </button>
          )}
          {item.status !== 'RESOLVED' && (
            <button
              style={{ ...actionBtn, borderColor: 'var(--success)', color: 'var(--success)' }}
              disabled={isPending}
              onClick={() => onUpdateStatus(item.id, 'RESOLVED', notes || undefined)}
            >
              <CheckSquare size={14} /> Mark Resolved
            </button>
          )}
          {item.status !== 'PENDING' && (
            <button
              style={{ ...actionBtn, borderColor: 'var(--warning, #e3b341)', color: 'var(--warning, #e3b341)' }}
              disabled={isPending}
              onClick={() => onUpdateStatus(item.id, 'PENDING', notes || undefined)}
            >
              <Clock size={14} /> Reopen
            </button>
          )}
          <button onClick={onClose} style={cancelBtnStyle} disabled={isPending}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 300, padding: '16px',
};

const modal: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '28px',
  width: '100%', maxWidth: '580px',
  boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  marginBottom: '16px', gap: '12px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
  color: 'var(--primary)', margin: '0 0 4px 0', textTransform: 'uppercase',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px', fontWeight: 700, color: 'var(--text)',
  margin: 0, lineHeight: 1.3,
};

const closeBtn: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: '8px', width: '32px', height: '32px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
};

const metaRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '8px',
  alignItems: 'center', marginBottom: '16px',
};

const metaChip: React.CSSProperties = {
  fontSize: '12px', color: 'var(--text-muted)',
  backgroundColor: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '99px',
  padding: '2px 10px',
};

const divider: React.CSSProperties = {
  border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 20px',
};

const section: React.CSSProperties = {
  marginBottom: '20px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  margin: '0 0 8px 0',
};

const descriptionBox: React.CSSProperties = {
  backgroundColor: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '14px 16px',
  fontSize: '14px', color: 'var(--text)',
  lineHeight: 1.6, whiteSpace: 'pre-wrap',
  minHeight: '80px',
};

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  backgroundColor: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '10px 14px',
  fontSize: '14px', color: 'var(--text)',
  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
};

const actions: React.CSSProperties = {
  display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end',
  paddingTop: '4px',
};

const actionBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 16px', background: 'transparent',
  border: '1px solid', borderRadius: 'var(--radius)',
  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  transition: 'opacity 0.15s',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px', background: 'transparent',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
};
