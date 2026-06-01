'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useCreateAnnouncement, 
  useUpdateAnnouncement, 
  useCategories,
  useColleges,
  useProgrammes,
  useMediaUpload
} from '@/app/(admin)/dashboard/announcements/query';
import { RichTextEditor } from '@/components/admin/ui/RichTextEditor';
import { Image as ImageIcon, X, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export interface AnnouncementFormProps {
  mode: 'create' | 'edit';
  announcementId?: string;
  initialData?: any;
}

export function AnnouncementForm({ mode, announcementId, initialData }: AnnouncementFormProps) {
  const router = useRouter();

  // Queries
  const { data: categories } = useCategories();
  const { data: colleges } = useColleges();
  const { data: programmes } = useProgrammes();
  
  // Mutations
  const { mutateAsync: createAnnouncement, isPending: isCreating } = useCreateAnnouncement();
  const { mutateAsync: updateAnnouncement, isPending: isUpdating } = useUpdateAnnouncement();
  const { mutateAsync: uploadMedia, isPending: isUploading } = useMediaUpload();

  const isSaving = isCreating || isUpdating || isUploading;

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('POST');
  const [categoryId, setCategoryId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Image State
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audience State
  const [targetType, setTargetType] = useState('ALL');
  const [targetCollegeId, setTargetCollegeId] = useState('');
  const [targetProgrammeId, setTargetProgrammeId] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [targetRole, setTargetRole] = useState('');

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setType(initialData.type || 'POST');
      setCategoryId(initialData.categoryId || '');
      
      if (initialData.expiresAt) {
        setExpiresAt(new Date(initialData.expiresAt).toISOString().slice(0, 16));
      }
      
      if (initialData.coverImage) {
        setCoverImageId(initialData.coverImage.id);
        setCoverImageUrl(initialData.coverImage.url);
      }

      if (initialData.audiences && initialData.audiences.length > 0) {
        const aud = initialData.audiences[0];
        setTargetType(aud.targetType || 'ALL');
        setTargetCollegeId(aud.collegeId || '');
        setTargetProgrammeId(aud.programmeId || '');
        setTargetYear(aud.yearOfStudy ? String(aud.yearOfStudy) : '');
        setTargetRole(aud.roleTarget || '');
      }
    } else if (mode === 'create') {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setExpiresAt(d.toISOString().slice(0, 16));
    }
  }, [mode, initialData]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadMedia(formData);
      
      setCoverImageId(res.data.id);
      setCoverImageUrl(res.data.url);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    }
  };

  const submitForm = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title || !content || content === '<p></p>') {
      return toast.error('Title and content are required.');
    }

    const audiences = [];
    if (targetType === 'ALL') audiences.push({ targetType: 'ALL' });
    else if (targetType === 'COLLEGE') audiences.push({ targetType: 'COLLEGE', collegeId: targetCollegeId || undefined });
    else if (targetType === 'PROGRAMME') audiences.push({ targetType: 'PROGRAMME', programmeId: targetProgrammeId || undefined });
    else if (targetType === 'PROGRAMME_YEAR') audiences.push({ targetType: 'PROGRAMME_YEAR', programmeId: targetProgrammeId || undefined, yearOfStudy: targetYear ? parseInt(targetYear) : undefined });
    else if (targetType === 'ROLE') audiences.push({ targetType: 'ROLE', roleTarget: targetRole || undefined });

    const payload = {
      title,
      content,
      type,
      status,
      categoryId: categoryId || undefined,
      coverImageId: coverImageId || undefined,
      audiences,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    };

    try {
      if (mode === 'create') {
        await createAnnouncement(payload);
        toast.success(`Announcement ${status === 'PUBLISHED' ? 'published' : 'saved as draft'}`);
      } else {
        await updateAnnouncement({ id: announcementId!, data: payload });
        toast.success(`Announcement updated (${status})`);
      }
      router.push('/dashboard/announcements');
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  return (
    <div style={styles.formContainer}>
      {/* Main Column */}
      <div style={styles.mainCol}>
        <div style={styles.card}>
          
          {/* Banner Upload */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Cover Image</label>
            <div style={styles.bannerDropzone}>
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={32} className="spin" />
                  <span style={{ marginTop: '8px' }}>Uploading...</span>
                </div>
              ) : coverImageUrl ? (
                <div style={styles.bannerPreviewWrapper}>
                  <img src={coverImageUrl} alt="Cover" style={styles.bannerPreview} />
                  <button type="button" style={styles.removeBannerBtn} onClick={() => { setCoverImageUrl(null); setCoverImageId(null); }}>
                    <X size={16} color="#fff" />
                  </button>
                </div>
              ) : (
                <div 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '32px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={32} color="var(--text-muted)" />
                  <span style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>Click to upload a cover image</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImagePick} accept="image/*" style={{ display: 'none' }} />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              placeholder="Important Notice..."
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Content</label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>
        </div>
      </div>

      {/* Sidebar Settings */}
      <div style={styles.sideCol}>
        <div style={{ ...styles.card, gap: '16px' }}>
          <h3 style={styles.cardTitle}>Settings</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Post Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={styles.select}>
              <option value="POST">General Post</option>
              <option value="NOTICE">Official Notice</option>
              <option value="ALERT">Alert / Emergency</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Target Audience</label>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} style={styles.select}>
              <option value="ALL">All Users (Global)</option>
              <option value="COLLEGE">Specific College</option>
              <option value="PROGRAMME">Specific Programme</option>
              <option value="PROGRAMME_YEAR">Programme & Year</option>
              <option value="ROLE">Specific Role</option>
            </select>
          </div>

          {targetType === 'COLLEGE' && (
            <div style={styles.formGroup}>
              <select value={targetCollegeId} onChange={(e) => setTargetCollegeId(e.target.value)} style={styles.select}>
                <option value="">Select College...</option>
                {colleges?.data?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {(targetType === 'PROGRAMME' || targetType === 'PROGRAMME_YEAR') && (
            <div style={styles.formGroup}>
              <select value={targetProgrammeId} onChange={(e) => setTargetProgrammeId(e.target.value)} style={styles.select}>
                <option value="">Select Programme...</option>
                {programmes?.data?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'PROGRAMME_YEAR' && (
            <div style={styles.formGroup}>
              <select value={targetYear} onChange={(e) => setTargetYear(e.target.value)} style={styles.select}>
                <option value="">Select Year...</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
              </select>
            </div>
          )}

          {targetType === 'ROLE' && (
            <div style={styles.formGroup}>
              <input 
                type="text" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                style={styles.input}
                placeholder="e.g. CR, DARUSO"
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={styles.select}>
              <option value="">None (General)</option>
              {categories?.data?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Expires At</label>
            <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} style={styles.input} />
          </div>

          <hr style={styles.hr} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              type="button" 
              disabled={isSaving} 
              onClick={() => submitForm('PUBLISHED')}
              style={styles.submitBtn}
            >
              {isSaving ? 'Saving...' : (mode === 'create' ? 'Publish Now' : 'Save Changes')}
            </button>
            <button 
              type="button" 
              disabled={isSaving} 
              onClick={() => submitForm('DRAFT')}
              style={styles.draftBtn}
            >
              Save as Draft
            </button>
            <button 
              type="button" 
              disabled={isSaving}
              onClick={() => router.back()} 
              style={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  formContainer: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  mainCol: {
    flex: 1,
    minWidth: '300px',
  },
  sideCol: {
    width: '320px',
    flexShrink: 0,
  },
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    color: 'var(--text)',
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
  select: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
  },
  bannerDropzone: {
    backgroundColor: 'var(--surface-2)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius)',
    minHeight: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerPreviewWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  bannerPreview: {
    width: '100%',
    height: '140px',
    objectFit: 'cover',
    display: 'block',
  },
  removeBannerBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    border: 'none',
    borderRadius: '50%',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid var(--border)',
    margin: '8px 0',
  },
  submitBtn: {
    padding: '12px',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  draftBtn: {
    padding: '12px',
    backgroundColor: 'var(--surface-2)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '12px',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  }
};
