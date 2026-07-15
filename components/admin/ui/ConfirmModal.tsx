'use client';

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, isPending]);

  return (
    <div
      style={overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel();
      }}
      role="presentation"
    >
      <div style={modal} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div style={iconWrap}>
          <AlertTriangle size={28} color="var(--danger)" />
        </div>
        <h2 id="confirm-modal-title" style={titleStyle}>{title}</h2>
        <p style={msgStyle}>{message}</p>
        <div style={footer}>
          <button type="button" onClick={onCancel} style={cancelBtn} disabled={isPending}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} style={deleteBtn} disabled={isPending}>
            {isPending ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'var(--overlay)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200,
  padding: 16,
};
const modal: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '32px 28px',
  width: '100%', maxWidth: '400px',
  boxShadow: 'var(--shadow-lg)',
  textAlign: 'center',
};
const iconWrap: React.CSSProperties = {
  display: 'flex', justifyContent: 'center', marginBottom: '16px',
};
const titleStyle: React.CSSProperties = {
  fontSize: '18px', fontWeight: 600, color: 'var(--text)',
  margin: '0 0 10px 0',
};
const msgStyle: React.CSSProperties = {
  fontSize: '14px', color: 'var(--text-muted)',
  margin: '0 0 24px 0', lineHeight: 1.6,
};
const footer: React.CSSProperties = {
  display: 'flex', gap: '12px', justifyContent: 'center',
};
const cancelBtn: React.CSSProperties = {
  padding: '10px 20px', background: 'transparent',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  color: 'var(--text)', cursor: 'pointer', fontWeight: 500, fontSize: '14px',
};
const deleteBtn: React.CSSProperties = {
  padding: '10px 20px', backgroundColor: 'var(--danger)',
  border: 'none', borderRadius: 'var(--radius)',
  color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
};
