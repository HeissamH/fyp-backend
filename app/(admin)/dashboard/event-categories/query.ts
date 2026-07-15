'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEventCategories,
  createEventCategory,
  updateEventCategory,
  deleteEventCategory,
} from '@/app/(admin)/actions/events';

export function useEventCategories() {
  return useQuery({
    queryKey: ['event-categories'],
    queryFn: () => getEventCategories(),
  });
}

export function useCreateEventCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; iconName?: string }) => createEventCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event-categories'] }),
  });
}

export function useUpdateEventCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; iconName?: string } }) =>
      updateEventCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event-categories'] }),
  });
}

export function useDeleteEventCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEventCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event-categories'] }),
  });
}
