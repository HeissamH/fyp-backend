import { z } from "zod";

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  email: z.string().email().optional(),
  programmeId: z.string().uuid().optional(),
  collegeId: z.string().uuid().optional(),
  yearOfStudy: z.number().int().min(1).max(7).optional(),
  currentSemester: z.number().int().min(1).max(3).optional(),
  isActive: z.boolean().optional(),
});
