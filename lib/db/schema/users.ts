import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { programmes } from "./programmes";
import { departments } from "./departments";
import { userRoles } from "./user-roles";
import { relations } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    registrationNumber: varchar("registration_number", { length: 50 }).notNull().unique(),
    sex: varchar("sex", { length: 10 }).notNull(), // 'MALE' | 'FEMALE'
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    collegeId: uuid("college_id").references(() => colleges.id),
    /** Direct department for lecturers / dept staff (students usually use programme→department). */
    departmentId: uuid("department_id").references(() => departments.id),
    programmeId: uuid("programme_id").references(() => programmes.id),
    yearOfStudy: integer("year_of_study"),
    currentSemester: integer("current_semester"),
    avatarUrl: text("avatar_url"),
    phoneNumber: varchar("phone_number", { length: 20 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("users_college_id_idx").on(t.collegeId),
    index("users_department_id_idx").on(t.departmentId),
    index("users_programme_id_idx").on(t.programmeId),
    index("users_deleted_at_idx").on(t.deletedAt),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  userRoles: many(userRoles),
  college: one(colleges, {
    fields: [users.collegeId],
    references: [colleges.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  programme: one(programmes, {
    fields: [users.programmeId],
    references: [programmes.id],
  }),
}));
