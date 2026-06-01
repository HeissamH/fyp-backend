'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAnnouncements, 
  getAnnouncement, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement, 
  pinAnnouncement,
  getCategories,
  getColleges,
  getProgrammes,
  uploadMedia,
  GetAnnouncementsParams,
  CreateAnnouncementData
} from '@/app/(admin)/actions/announcements';

export function useAnnouncements(params: GetAnnouncementsParams = {}) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: () => getAnnouncements(params),
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ['announcements', id],
    queryFn: () => getAnnouncement(id),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnnouncementData) => createAnnouncement(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAnnouncementData> }) => updateAnnouncement(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements', variables.id] });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function usePinAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pinAnnouncement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });
}

export function useColleges() {
  return useQuery({
    queryKey: ['colleges'],
    queryFn: () => getColleges(),
  });
}

export function useProgrammes() {
  return useQuery({
    queryKey: ['programmes'],
    queryFn: () => getProgrammes(),
  });
}

export function useMediaUpload() {
  return useMutation({
    mutationFn: (formData: FormData) => uploadMedia(formData),
  });
}
