import { z } from "zod";

export const createCommentSchema = z.object({
  targetId: z.string().uuid(),
  targetType: z.enum(["ANNOUNCEMENT", "EVENT", "LOST_FOUND", "POST"]),
  content: z.string().min(1, "Comment cannot be empty").max(2000),
  parentId: z.string().uuid().optional(),
  mediaId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});
