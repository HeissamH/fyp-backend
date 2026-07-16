import { z } from "zod";

/** Accept ISO strings with or without trailing Z (Flutter/local variants). */
const isoDateTime = z
  .string()
  .min(1, "Date is required")
  .refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "Invalid ISO datetime",
  });

const optionalUrl = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const createEventSchema = z.object({
  title: z.string().min(3).max(255),
  // Allow empty description from the app; store a short placeholder if blank
  description: z
    .string()
    .max(10000)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : "No description provided.")),
  categoryId: z.string().uuid(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).default("DRAFT"),
  coverImageId: z
    .union([z.string().uuid(), z.null(), z.literal("")])
    .optional()
    .transform((v) => (v && typeof v === "string" && v.length > 0 ? v : undefined)),
  location: z
    .string()
    .max(255)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  locationUrl: optionalUrl,
  startDateTime: isoDateTime,
  endDateTime: isoDateTime,
  maxAttendees: z
    .union([z.number().int().min(1), z.null()])
    .optional()
    .nullable(),
  academicYearId: z
    .union([z.string().uuid(), z.null(), z.literal("")])
    .optional()
    .transform((v) => (v && typeof v === "string" && v.length > 0 ? v : undefined)),
});

export const updateEventSchema = createEventSchema.partial();

export const rsvpSchema = z.object({
  status: z.enum(["GOING", "INTERESTED", "NOT_GOING"]),
});
