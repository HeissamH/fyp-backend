import { pgTable, uuid, varchar, integer, timestamp, text } from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  url: text("url").notNull(),
  type: varchar("type", { length: 10 }).notNull(), // "IMAGE" | "VIDEO" | "FILE"
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaRelations = relations(media, ({ one }) => ({
  uploader: one(users, {
    fields: [media.uploadedBy],
    references: [users.id],
  }),
}));
