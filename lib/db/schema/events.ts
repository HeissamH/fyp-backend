import { pgTable, uuid, varchar, text, boolean, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { eventCategories } from "./event-categories";
import { media } from "./media";
import { academicYears } from "./academic-years";
import { relations } from "drizzle-orm";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  categoryId: uuid("category_id").notNull().references(() => eventCategories.id),
  status: varchar("status", { length: 20 }).notNull().default("DRAFT"), // DRAFT | PUBLISHED | CANCELLED
  organizerId: uuid("organizer_id").notNull().references(() => users.id),
  coverImageId: uuid("cover_image_id").references(() => media.id),
  location: varchar("location", { length: 255 }),
  locationUrl: varchar("location_url", { length: 500 }),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time").notNull(),
  maxAttendees: integer("max_attendees"),
  isPinned: boolean("is_pinned").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  publishedAt: timestamp("published_at"),
  startNotifiedAt: timestamp("start_notified_at"),
  academicYearId: uuid("academic_year_id").references(() => academicYears.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull(), // "GOING" | "INTERESTED" | "NOT_GOING"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.eventId, t.userId),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
  category: one(eventCategories, { fields: [events.categoryId], references: [eventCategories.id] }),
  coverImage: one(media, { fields: [events.coverImageId], references: [media.id] }),
  academicYear: one(academicYears, { fields: [events.academicYearId], references: [academicYears.id] }),
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, { fields: [eventRsvps.eventId], references: [events.id] }),
  user: one(users, { fields: [eventRsvps.userId], references: [users.id] }),
}));
