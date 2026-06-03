'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAdminFeedback,
  updateFeedbackStatus,
  saveAdminComment,
  GetFeedbackParams
} from '@/app/(admin)/actions/feedback';

export function useFeedback(params: GetFeedbackParams = {}) {
  return useQuery({
    queryKey: ['feedback', params],
    queryFn: () => getAdminFeedback(params),
  });
}

export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: 'PENDING' | 'REVIEWED' | 'RESOLVED'; adminNotes?: string }) => 
      updateFeedbackStatus(id, status, adminNotes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

export function useSaveAdminComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNotes }: { id: string; adminNotes: string }) => 
      saveAdminComment(id, adminNotes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}
