'use client';

import React, { useState } from 'react';
import { X, CheckSquare, Clock, Eye, MessageSquarePlus, Tag, User, Mail, Calendar } from 'lucide-react';

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
  onSaveComment?: (id: string, adminNotes: string) => void;
  isPending?: boolean;
  isSavingComment?: boolean;
}

export function FeedbackDetailModal({
  item,
  onClose,
  onUpdateStatus,
  onSaveComment,
  isPending = false,
  isSavingComment = false,
}: FeedbackDetailModalProps) {
  const [notesState, setNotesState] = useState(item.adminNotes || '');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED': return { bg: 'rgba(46, 160, 67, 0.15)', text: '#3fb950', border: 'rgba(46, 160, 67, 0.4)' };
      case 'REVIEWED': return { bg: 'rgba(56, 139, 253, 0.15)', text: '#58a6ff', border: 'rgba(56, 139, 253, 0.4)' };
      default: return { bg: 'rgba(210, 153, 34, 0.15)', text: '#d29922', border: 'rgba(210, 153, 34, 0.4)' };
    }
  };
  
  const statusColors = getStatusColor(item.status);

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={headerWrapper}>
          <div style={{ flex: 1 }}>
            <p style={labelStyle}>FEEDBACK DETAILS</p>
            <div style={titleRow}>
              <h2 style={titleStyle}>{item.subject}</h2>
              <span style={{
                ...badgeStyle, 
                backgroundColor: statusColors.bg, 
                color: statusColors.text, 
                borderColor: statusColors.border 
              }}>
                {item.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={closeBtn} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Meta row */}
        <div style={metaRow}>
          {item.categoryName && (
            <span style={metaChip}><Tag size={14} /> {item.categoryName}</span>
          )}
          {item.userName && (
            <span style={metaChip}><User size={14} /> {item.userName}</span>
          )}
          {item.userEmail && (
            <span style={metaChip}><Mail size={14} /> {item.userEmail}</span>
          )}
          <span style={metaChip}><Calendar size={14} /> {formatDate(item.createdAt)}</span>
        </div>

        {/* Message Content */}
        <div style={messageContainer}>
          <p style={sectionLabel}>User Message</p>
          <div style={messageBox}>{item.description}</div>
        </div>

        {/* Admin actions / Notes */}
        <div style={notesContainer}>
          <p style={sectionLabel}>Admin Notes</p>
          {item.adminNotes && (
            <div style={existingNoteBox}>
              <p style={existingNoteLabel}>Current Note:</p>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{item.adminNotes}</p>
            </div>
          )}
          <textarea
            value={notesState}
            onChange={(e) => setNotesState(e.target.value)}
            placeholder="Add or update a note visible to the user..."
            style={textareaStyle}
            rows={3}
          />
        </div>

        {/* Actions Toolbar */}
        <div style={actionsToolbar}>
          <div style={{ flex: 1 }}>
            {onSaveComment && (
              <button
                style={primaryBtn}
                disabled={isPending || isSavingComment || !notesState.trim()}
                onClick={() => onSaveComment(item.id, notesState)}
              >
                <MessageSquarePlus size={15} /> {isSavingComment ? 'Saving...' : 'Save Draft'}
              </button>
            )}
          </div>
          
          <div style={rightActions}>
            {item.status !== 'PENDING' && (
              <button
                style={ghostBtnWarning}
                disabled={isPending || isSavingComment}
                onClick={() => onUpdateStatus(item.id, 'PENDING', notesState || undefined)}
              >
                <Clock size={15} /> Reopen
              </button>
            )}
            {item.status !== 'REVIEWED' && (
              <button
                style={ghostBtnInfo}
                disabled={isPending || isSavingComment}
                onClick={() => onUpdateStatus(item.id, 'REVIEWED', notesState || undefined)}
              >
                <Eye size={15} /> Mark Reviewed
              </button>
            )}
            {item.status !== 'RESOLVED' && (
              <button
                style={solidBtnSuccess}
                disabled={isPending || isSavingComment}
                onClick={() => onUpdateStatus(item.id, 'RESOLVED', notesState || undefined)}
              >
                <CheckSquare size={15} /> Resolve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  backgroundColor: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 300, padding: '16px',
};

const modal: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '24px',
  width: '100%', maxWidth: '640px',
  boxShadow: 'var(--shadow-lg)',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex', flexDirection: 'column', gap: '20px',
  color: 'var(--text)',
};

const headerWrapper: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
};

const titleRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
};

const titleStyle: React.CSSProperties = {
  fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3,
};

const badgeStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, padding: '4px 10px', 
  borderRadius: '20px', border: '1px solid', textTransform: 'uppercase', letterSpacing: '0.05em'
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
  color: 'var(--text-muted, #8b949e)', margin: '0 0 6px 0', textTransform: 'uppercase',
};

const closeBtn: React.CSSProperties = {
  background: 'transparent', border: 'none',
  width: '32px', height: '32px', borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, transition: 'background 0.2s'
};

const metaRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '12px',
  paddingBottom: '20px', borderBottom: '1px solid var(--border)',
};

const metaChip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  fontSize: '13px', color: 'var(--text-muted)',
  fontWeight: 500,
};

const messageContainer: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '8px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0,
};

const messageBox: React.CSSProperties = {
  backgroundColor: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '12px', padding: '16px',
  fontSize: '15px', color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap',
};

const notesContainer: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '8px',
  backgroundColor: 'var(--info-soft)',
  border: '1px solid var(--border)',
  borderRadius: '12px', padding: '16px'
};

const existingNoteBox: React.CSSProperties = {
  borderLeft: '3px solid var(--info)',
  paddingLeft: '12px', marginBottom: '12px',
  color: 'var(--text)', fontSize: '14px',
};

const existingNoteLabel: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'var(--info)', margin: '0 0 4px 0', textTransform: 'uppercase'
};

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px', padding: '12px 14px',
  fontSize: '14px', color: 'var(--text)', resize: 'vertical', 
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.2s', minHeight: '80px'
};

const actionsToolbar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: '12px', paddingTop: '16px', flexWrap: 'wrap',
};

const rightActions: React.CSSProperties = {
  display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 16px', borderRadius: '8px',
  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  transition: 'all 0.2s', border: 'none'
};

const primaryBtn = { ...btnBase, background: 'rgba(88, 166, 255, 0.15)', color: 'var(--info)', border: '1px solid rgba(88, 166, 255, 0.3)' };
const solidBtnSuccess = { ...btnBase, background: '#238636', color: '#ffffff' };
const ghostBtnInfo = { ...btnBase, background: 'transparent', color: 'var(--info)', border: '1px solid rgba(88,166,255,0.4)' };
const ghostBtnWarning = { ...btnBase, background: 'transparent', color: '#d29922', border: '1px solid rgba(210,153,34,0.4)' };
