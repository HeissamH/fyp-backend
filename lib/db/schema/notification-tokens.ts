import { pgTable, uuid, text, varchar, timestamp, unique, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const notificationTokens = pgTable(
  "notification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fcmToken: text("fcm_token").notNull(),
    deviceType: varchar("device_type", { length: 10 }).notNull(), // ANDROID | IOS
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    unique("notification_tokens_user_device_uniq").on(t.userId, t.deviceType),
    index("notification_tokens_user_id_idx").on(t.userId),
  ],
);

export const notificationTokensRelations = relations(notificationTokens, ({ one }) => ({
  user: one(users, { fields: [notificationTokens.userId], references: [users.id] }),
}));
