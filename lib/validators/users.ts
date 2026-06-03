import { z } from "zod";

export const updateUserSchema = z.object({
  avatarUrl: z.string().url().nullable().optional(),
  phoneNumber: z.string().max(20).optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  email: z.string().email().optional(),
  programmeId: z.string().uuid().optional(),
  collegeId: z.string().uuid().optional(),
  yearOfStudy: z.number().int().min(1).max(7).optional(),
  currentSemester: z.number().int().min(1).max(3).optional(),
  isActive: z.boolean().optional(),
});

export const adminCreateUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  registrationNumber: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  collegeId: z.string().uuid("Invalid College ID").optional(),
  programmeId: z.string().uuid("Invalid Programme ID").optional(),
  yearOfStudy: z.number().int().min(1).max(7).optional(),
  roleIds: z.array(z.string().uuid("Invalid Role ID")).optional(),
});
