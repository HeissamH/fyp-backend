'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, deletePost } from '@/app/(admin)/actions/posts';

export function usePosts(search?: string) {
  return useQuery({
    queryKey: ['admin-posts', search ?? ''],
    queryFn: () => getPosts({ page: 1, pageSize: 50, search: search || undefined }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-posts'] }),
  });
}
