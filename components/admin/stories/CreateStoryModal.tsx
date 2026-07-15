'use client';

import { useEffect, useState } from 'react';
import { useCreateStory } from '@/app/(admin)/dashboard/stories/query';
import { uploadMedia } from '@/app/(admin)/actions/media';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CreateStoryModal({ onClose }: { onClose: () => void }) {
  const { mutate: createStory, isPending: isCreating } = useCreateStory();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expiresAt, setExpiresAt] = useState(() => {
    // Default 24 hours
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return d.toISOString().slice(0, 16);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading && !isCreating) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, isUploading, isCreating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Please select an image file');

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await uploadMedia(formData);
      if (!uploadRes.success || !uploadRes.data?.url) {
        throw new Error(uploadRes.message || 'File upload failed');
      }

      createStory(
        { 
          mediaId: uploadRes.data?.mediaId || uploadRes.data?.id,
          expiresAt: new Date(expiresAt).toISOString(),
        },
        {
          onSuccess: () => {
            toast.success('Story published setup successfully!');
            onClose();
          },
          onError: (err: any) => {
            toast.error(err.message || 'Failed to create story record');
          }
        }
      );
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading && !isCreating) onClose();
      }}
      role="presentation"
    >
      <div style={styles.modal} role="dialog" aria-modal="true">
        <div style={styles.header}>
          <h2 style={styles.title}>Upload Story</h2>
          <button type="button" onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Image Media</label>
            <div style={styles.uploadArea}>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={styles.fileInput}
              />
              <UploadCloud size={32} color="var(--text-muted)" />
              <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text)' }}>
                {file ? file.name : 'Click to select an image'}
              </div>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Expires At</label>
            <input 
              type="datetime-local" 
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={styles.input}
              required
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Default is 24 hours from now.</span>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={isUploading || isCreating || !file} style={styles.submitBtn}>
              {isUploading || isCreating ? <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} /> : null}
              {isUploading ? 'Uploading...' : 'Publish Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: 'var(--text)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  form: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
  },
  input: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 20px',
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg)',
    position: 'relative',
    cursor: 'pointer',
    textAlign: 'center',
  },
  fileInput: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    border: 'none',
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 16px',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  }
};
