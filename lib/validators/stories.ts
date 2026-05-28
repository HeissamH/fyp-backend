import { z } from "zod";

export const createStorySchema = z.object({
  collegeId: z.string().uuid().optional(),
  mediaId: z.string().uuid(),
  caption: z.string().max(500).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color").optional(),
  linkUrl: z.string().url().max(500).optional(),
  linkText: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});
