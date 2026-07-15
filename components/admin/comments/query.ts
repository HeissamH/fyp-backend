'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getComments,
  getRecentComments,
  postComment,
  editComment,
  deleteComment,
  CommentTargetType,
} from '@/app/(admin)/actions/comments';

export function useComments(targetId: string, targetType: CommentTargetType) {
  return useQuery({
    queryKey: ['comments', targetId, targetType],
    queryFn: () => getComments(targetId, targetType),
    enabled: !!targetId,
  });
}

export function useRecentComments(targetType?: string) {
  return useQuery({
    queryKey: ['comments-recent', targetType ?? 'all'],
    queryFn: () => getRecentComments({ page: 1, pageSize: 40, targetType }),
  });
}

export function usePostComment(targetId: string, targetType: CommentTargetType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; parentId?: string }) =>
      postComment({ targetId, targetType, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', targetId, targetType] });
    },
  });
}

export function useEditComment(targetId: string, targetType: CommentTargetType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      editComment(id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', targetId, targetType] });
    },
  });
}

export function useDeleteComment(targetId: string, targetType: CommentTargetType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', targetId, targetType] });
      qc.invalidateQueries({ queryKey: ['comments-recent'] });
    },
  });
}
