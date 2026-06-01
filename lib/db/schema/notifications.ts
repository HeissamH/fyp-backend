import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    type: varchar("type", { length: 20 }).notNull(), // POST | EVENT | STORY | SYSTEM
    targetId: uuid("target_id"),
    targetType: varchar("target_type", { length: 20 }),
    isRead: boolean("is_read").default(false).notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_user_read_idx").on(t.userId, t.isRead),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
