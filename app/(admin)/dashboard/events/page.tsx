'use client';

import { useState, useCallback } from 'react';
import { useEvents, useUpdateEvent, useDeleteEvent, useCreateEvent, useEventCategories } from './query';
import { uploadMedia } from '@/app/(admin)/actions/media';
import { DataTable } from '@/components/admin/ui/DataTable';
import { DataTableSkeleton } from '@/components/admin/ui/DataTableSkeleton';
import { ConfirmModal } from '@/components/admin/ui/ConfirmModal';
import { Badge } from '@/components/admin/ui/Badge';
import { Pencil, Trash2, Plus, Calendar as CalendarIcon, MapPin, UploadCloud, Loader2, CalendarDays, CheckCircle2, History } from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

// —————————————————————————————————————————————————————————————————————————————
// Event Modal (Create / Edit)
// —————————————————————————————————————————————————————————————————————————————

function EventModal({
  event,
  onClose,
}: {
  event?: any;
  onClose: () => void;
}) {
  const isEdit = !!event;
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();
  const { data: categoriesData } = useEventCategories();

  const isPending = isCreating || isUpdating;

  // Form State
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [categoryId, setCategoryId] = useState(event?.category?.id || '');
  const [startDateTime, setStartDateTime] = useState(
    event?.startDateTime ? new Date(event.startDateTime).toISOString().slice(0, 16) : ''
  );
  const [endDateTime, setEndDateTime] = useState(
    event?.endDateTime ? new Date(event.endDateTime).toISOString().slice(0, 16) : ''
  );
  const [location, setLocation] = useState(event?.location || '');
  const [locationUrl, setLocationUrl] = useState(event?.locationUrl || '');
  const [maxAttendees, setMaxAttendees] = useState(event?.maxAttendees?.toString() || '');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'CANCELLED'>(event?.status || 'PUBLISHED');

  // Image Upload State
  const [previewUrl, setPreviewUrl] = useState(event?.coverImage?.url || null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setCoverImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
      setCoverImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !categoryId || !startDateTime || !endDateTime || !location) {
      return toast.error('Please fill in all required fields');
    }

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      return toast.error('End date must be after start date');
    }

    let finalCoverImageId = event?.coverImage?.id;

    if (coverImageFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', coverImageFile);
        const res = await uploadMedia(formData);
        finalCoverImageId = res.data.id;
      } catch (err: any) {
        setIsUploading(false);
        return toast.error(err.message || 'Failed to upload cover image');
      }
      setIsUploading(false);
    }

    const payload = {
      title,
      description,
      categoryId,
      status,
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      location,
      locationUrl: locationUrl || undefined,
      maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
      coverImageId: finalCoverImageId,
    };

    if (isEdit) {
      updateEvent(
        { id: event.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Event updated successfully');
            onClose();
          },
          onError: (err: any) => toast.error(err.message || 'Failed to update event'),
        }
      );
    } else {
      createEvent(payload as any, {
        onSuccess: () => {
          toast.success('Event created successfully');
          onClose();
        },
        onError: (err: any) => toast.error(err.message || 'Failed to create event'),
      });
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 65px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '24px', alignItems: 'start' }}>
              
              {/* Main Content Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={fGroup}>
                  <label style={lStyle}>Event Title *</label>
                  <input style={iStyle} value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. UDSM Tech Summit" />
                </div>

                <div style={fGroup}>
                  <label style={lStyle}>Description *</label>
                  <textarea
                    style={{ ...iStyle, minHeight: '120px', resize: 'vertical' }}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    placeholder="Provide details about the event..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={fGroup}>
                    <label style={lStyle}>Start Time *</label>
                    <input type="datetime-local" style={iStyle} value={startDateTime} onChange={e => setStartDateTime(e.target.value)} required />
                  </div>
                  <div style={fGroup}>
                    <label style={lStyle}>End Time *</label>
                    <input type="datetime-local" style={iStyle} value={endDateTime} onChange={e => setEndDateTime(e.target.value)} required />
                  </div>
                </div>

                <div style={fGroup}>
                  <label style={lStyle}>Cover Image</label>
                  <label
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: previewUrl ? '4px' : '32px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'var(--surface)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; }}
                    onDrop={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      handleDrop(e);
                    }}
                  >
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'calc(var(--radius) - 4px)' }} />
                    ) : (
                      <>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
                          <UploadCloud size={24} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Click or drag image to upload</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG up to 2MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Sidebar Properties */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={fGroup}>
                  <label style={lStyle}>Category *</label>
                  <select style={sStyle} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                    <option value="">— Select Category —</option>
                    {categoriesData?.data?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={fGroup}>
                  <label style={lStyle}>Location *</label>
                  <input style={iStyle} value={location} onChange={e => setLocation(e.target.value)} required placeholder="e.g. Main Hall" />
                </div>

                <div style={fGroup}>
                  <label style={lStyle}>Location URL</label>
                  <input type="url" style={iStyle} value={locationUrl} onChange={e => setLocationUrl(e.target.value)} placeholder="https://maps.google.com/..." />
                </div>

                <div style={fGroup}>
                  <label style={lStyle}>Max Attendees</label>
                  <input type="number" min="1" style={iStyle} value={maxAttendees} onChange={e => setMaxAttendees(e.target.value)} placeholder="Unlimited" />
                </div>

                <div style={fGroup}>
                  <label style={lStyle}>Status</label>
                  <select style={sStyle} value={status} onChange={e => setStatus(e.target.value as any)}>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'var(--surface)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isPending || isUploading} style={submitBtnStyle}>
              {(isPending || isUploading) ? <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} /> : null}
              {isUploading ? 'Uploading...' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// Page / Table Component
// —————————————————————————————————————————————————————————————————————————————

export default function EventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, isLoading } = useEvents({ page, pageSize: 20 });
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  const events: any[] = data?.data || [];
  const total = data?.meta?.total || 0;

  // Compute stats
  const now = new Date();
  const upcomingCount = events.filter(e => new Date(e.startDateTime) > now).length;
  const pastCount = events.filter(e => new Date(e.endDateTime) < now).length;

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const filteredEvents = search
    ? events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase()))
    : events;

  const columns: ColumnDef<any>[] = [
    {
      id: 'cover',
      header: 'Cover',
      cell: ({ row }) => {
        const url = row.original.coverImage?.url;
        return (
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--surface-2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <CalendarIcon size={16} color="var(--text-muted)" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'title',
      header: 'Event',
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div>
            <div style={{ fontWeight: 500, color: 'var(--text)' }}>{e.title}</div>
            {e.category && (
              <div style={{ marginTop: '4px' }}>
                <Badge variant="default">{e.category.name}</Badge>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'datetime',
      header: 'Date & Time',
      cell: ({ row }) => {
        const start = new Date(row.original.startDateTime);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <span>{start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>{start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <MapPin size={14} />
            <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.original.location || 'TBA'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const e = row.original;
        
        if (e.status === 'CANCELLED') return <Badge variant="danger">Cancelled</Badge>;
        if (e.status === 'DRAFT') return <Badge variant="default">Draft</Badge>;

        const start = new Date(e.startDateTime);
        const end = new Date(e.endDateTime);
        const current = new Date();

        if (current < start) {
          return <Badge variant="info">Upcoming</Badge>;
        } else if (current >= start && current <= end) {
          return <Badge variant="success">Ongoing</Badge>;
        } else {
          return <Badge variant="default">Past</Badge>;
        }
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleEdit(event)}
              style={actionBtnStyle}
              title="Edit Event"
            >
              <Pencil size={16} color="var(--info)" />
            </button>
            <button
              onClick={() => setDeleteTarget(event)}
              style={actionBtnStyle}
              title="Delete Event"
            >
              <Trash2 size={16} color="var(--danger)" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={<CalendarDays size={20} color="#8957ff" />} label="Total Events" value={total} color="#8957ff" />
        <StatCard icon={<History size={20} color="#388bfd" />} label="Upcoming Events" value={isLoading ? '...' : upcomingCount} color="#388bfd" />
        <StatCard icon={<CheckCircle2 size={20} color="#3fb950" />} label="Past Events" value={isLoading ? '...' : pastCount} color="#3fb950" />
      </div>

      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'var(--text)' }}>Events</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage platform events, locations, and attendance bounds.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '10px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', width: '240px', outline: 'none' }}
          />
          <button onClick={handleCreate} style={{ padding: '10px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <DataTableSkeleton columns={6} rows={10} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredEvents}
          pagination={{ page, total, pageSize: 20, onPageChange: setPage }}
        />
      )}

      {/* Modals */}
      {isModalOpen && (
        <EventModal
          event={editingEvent}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Event"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          isPending={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteEvent(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Event deleted');
                setDeleteTarget(null);
              },
              onError: (err: any) => toast.error(err.message || 'Failed to delete event'),
            });
          }}
        />
      )}
    </div>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// Styles & Helpers
// —————————————————————————————————————————————————————————————————————————————

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
const modalStyle: React.CSSProperties = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '860px', height: '90vh', maxHeight: '800px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const modalHeaderStyle: React.CSSProperties = { padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', zIndex: 10 };
const closeBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '4px' };
const fGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const lStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: 'var(--text)' };
const iStyle: React.CSSProperties = { padding: '10px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const sStyle: React.CSSProperties = { ...iStyle, cursor: 'pointer' };
const submitBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' };
const cancelBtnStyle: React.CSSProperties = { padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, fontSize: '14px' };
const actionBtnStyle: React.CSSProperties = { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' };
