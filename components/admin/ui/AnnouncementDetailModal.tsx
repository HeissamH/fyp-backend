'use client';

import React from 'react';
import { X, Calendar, User, Eye, Link as LinkIcon, BookOpen, Clock, Pin } from 'lucide-react';
import { Badge } from './Badge';
import { useAnnouncement } from '@/app/(admin)/dashboard/announcements/query';

interface AnnouncementDetailModalProps {
  announcementId: string;
  onClose: () => void;
}

export function AnnouncementDetailModal({
  announcementId,
  onClose,
}: AnnouncementDetailModalProps) {
  const { data: response, isLoading, isError } = useAnnouncement(announcementId);

  const statusVariant = (s: string) =>
    s === 'PUBLISHED' ? 'success' : s === 'DRAFT' ? 'warning' : 'default';

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

  const item = response?.data;

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header Section */}
        <div style={header}>
          <div style={{ flex: 1, paddingRight: '12px' }}>
            <p style={labelStyle}>
              ANNOUNCEMENT DETAIL
              {item?.isPinned && <span style={pinnedBadge}><Pin size={10} /> PINNED</span>}
            </p>
            {isLoading ? (
              <div style={{ height: '24px', width: '60%', backgroundColor: 'var(--surface-2)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            ) : isError ? (
              <h2 style={titleStyle}>Error Loading Details</h2>
            ) : (
              <h2 style={titleStyle}>{item.title}</h2>
            )}
          </div>
          <button onClick={onClose} style={closeBtn} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
           <div style={{ padding: '20px 0' }}>Loading announcement details...</div>
        ) : isError || !item ? (
           <div style={{ padding: '20px 0', color: 'var(--danger)' }}>Could not load the announcement.</div>
        ) : (
          <>
            {/* Meta row */}
            <div style={metaRow}>
              {item.category && (
                <span style={metaChip}><BookOpen size={12} /> {item.category.name}</span>
              )}
              {item.author && (
                <span style={metaChip}><User size={12} /> {item.author.fullName}</span>
              )}
              <span style={metaChip}><Clock size={12} /> {formatDate(item.createdAt)}</span>
              <span style={metaChip}><Eye size={12} /> {item.viewCount} views</span>
              <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
            </div>

            <hr style={divider} />

            {/* Audiences */}
            {item.audiences && item.audiences.length > 0 && (
              <div style={audienceSection}>
                <p style={sectionLabel}>Targeted Audience</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {item.audiences.map((aud: any, idx: number) => (
                    <Badge key={idx} variant={aud.targetType === 'ALL' ? 'success' : 'info'}>
                      {aud.targetType.replace('_', ' ')}
                      {aud.roleTarget && `: ${aud.roleTarget}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Cover Image */}
            {item.coverImage && (
              <div style={coverImageWrapper}>
                <img src={item.coverImage.url} alt="Cover" style={coverImage} />
              </div>
            )}

            {/* Main Content */}
            <div style={section}>
              <div 
                style={contentBox} 
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: item.content || 'No content provided.' }} 
              />
            </div>

            {/* Attachments / Media */}
            {item.media && item.media.length > 0 && (
              <div style={section}>
                <p style={sectionLabel}>Attachments</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {item.media.map((m: any) => (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" style={attachmentPill}>
                      <LinkIcon size={14} /> Attachment
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  backgroundColor: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 300, padding: '16px',
  backdropFilter: 'blur(2px)',
};

const modal: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '28px',
  width: '100%', maxWidth: '640px',
  boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
  maxHeight: '85vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  marginBottom: '16px', gap: '12px',
};

const labelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
  color: 'var(--primary)', margin: '0 0 6px 0', textTransform: 'uppercase',
};

const pinnedBadge: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  backgroundColor: 'var(--warning)', color: '#000',
  padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800,
};

const titleStyle: React.CSSProperties = {
  fontSize: '22px', fontWeight: 700, color: 'var(--text)',
  margin: 0, lineHeight: 1.3,
};

const closeBtn: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: '8px', width: '32px', height: '32px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
};

const metaRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '10px',
  alignItems: 'center', marginBottom: '20px',
};

const metaChip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  fontSize: '12px', color: 'var(--text-muted)',
  backgroundColor: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '99px',
  padding: '4px 10px',
};

const divider: React.CSSProperties = {
  border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 20px',
};

const audienceSection: React.CSSProperties = {
  marginBottom: '20px',
  padding: '12px',
  backgroundColor: 'var(--surface-2)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
};

const section: React.CSSProperties = {
  marginBottom: '24px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  margin: '0 0 8px 0',
};

const coverImageWrapper: React.CSSProperties = {
  width: '100%',
  maxHeight: '240px',
  marginBottom: '20px',
  borderRadius: 'var(--radius)',
  overflow: 'hidden',
  backgroundColor: 'var(--surface-2)',
  border: '1px solid var(--border)',
};

const coverImage: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const contentBox: React.CSSProperties = {
  fontSize: '15px', color: 'var(--text)',
  lineHeight: 1.6,
};

const attachmentPill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '6px 12px', backgroundColor: 'var(--surface-2)',
  border: '1px solid var(--border)', borderRadius: '99px',
  color: 'var(--info)', fontSize: '13px', textDecoration: 'none',
};
