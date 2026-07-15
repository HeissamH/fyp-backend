import { db } from "./index";
import { eq, or } from "drizzle-orm";
import { roles, permissions, permissionGroups, rolePermissions, users, colleges, categories, eventCategories, programmes, departments, userRoles } from "./schema";
import { hashPassword } from "../auth/password";
import { generateSlug } from "../utils/slug";

function seedSlug(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Seeding database...");
  
  // 0. Create Colleges
  await db.insert(colleges).values([
    { name: "College of Information and Communication Technologies", shortName: "CoICT" },
    { name: "University of Dar es Salaam Business School", shortName: "UDBS" },
    { name: "College of Social Sciences", shortName: "CoSS" },
    { name: "College of Natural and Applied Sciences", shortName: "CoNAS" },
    { name: "College of Humanities", shortName: "CoHU" },
    { name: "College of Agriculture and Food Sciences", shortName: "CoAF" },
    { name: "College of Engineering and Technology", shortName: "CoET" }
  ]).onConflictDoNothing({ target: colleges.shortName });

  console.log("✅ Colleges created/skipped");

  // 0.1 Create departments & programmes for CoICT & CoET
  const targetColleges = await db.select().from(colleges).where(
    or(eq(colleges.shortName, "CoICT"), eq(colleges.shortName, "CoET"))
  );
  
  const coict = targetColleges.find(c => c.shortName === "CoICT");
  const coet = targetColleges.find(c => c.shortName === "CoET");

  let coictCsitDeptId: string | undefined;
  let coictElectDeptId: string | undefined;
  let coetEngDeptId: string | undefined;

  if (coict) {
    await db
      .insert(departments)
      .values([
        {
          collegeId: coict.id,
          name: "Computer Science and Information Technology",
          shortName: "CoICT-CSIT",
        },
        {
          collegeId: coict.id,
          name: "Electronics and Telecommunications Engineering",
          shortName: "CoICT-ENGT",
        },
      ])
      .onConflictDoNothing({ target: [departments.collegeId, departments.shortName] });

    const coictDepts = await db
      .select()
      .from(departments)
      .where(eq(departments.collegeId, coict.id));
    coictCsitDeptId = coictDepts.find((d) => d.shortName === "CoICT-CSIT")?.id;
    coictElectDeptId = coictDepts.find((d) => d.shortName === "CoICT-ENGT")?.id;
  }

  if (coet) {
    await db
      .insert(departments)
      .values({
        collegeId: coet.id,
        name: "Engineering Sciences",
        shortName: "CoET-ENG",
      })
      .onConflictDoNothing({ target: [departments.collegeId, departments.shortName] });

    const coetDepts = await db
      .select()
      .from(departments)
      .where(eq(departments.collegeId, coet.id));
    coetEngDeptId = coetDepts.find((d) => d.shortName === "CoET-ENG")?.id;
  }

  if (coict && coictCsitDeptId && coictElectDeptId) {
    await db.insert(programmes).values([
      { name: "Computer Science", code: "CS", durationYears: 3, departmentId: coictCsitDeptId },
      { name: "Computer Engineering and Information Technology", code: "CEIT", durationYears: 4, departmentId: coictCsitDeptId },
      { name: "Business in IT", code: "BIT", durationYears: 3, departmentId: coictCsitDeptId },
      { name: "Electronics Engineering", code: "ELE", durationYears: 4, departmentId: coictElectDeptId },
      { name: "Electronic Science", code: "ES", durationYears: 3, departmentId: coictElectDeptId },
    ]).onConflictDoNothing({ target: programmes.code });
  }

  if (coet && coetEngDeptId) {
    await db.insert(programmes).values([
      { name: "Industrial Engineering", code: "IE", durationYears: 4, departmentId: coetEngDeptId },
      { name: "Chemical and Process Engineering", code: "CPE", durationYears: 4, departmentId: coetEngDeptId },
      { name: "Civil Engineering", code: "CE", durationYears: 4, departmentId: coetEngDeptId },
      { name: "Electrical Engineering", code: "EE", durationYears: 4, departmentId: coetEngDeptId },
      { name: "Mechanical Engineering", code: "ME", durationYears: 4, departmentId: coetEngDeptId },
      { name: "Textile Engineering", code: "TXE", durationYears: 4, departmentId: coetEngDeptId },
    ]).onConflictDoNothing({ target: programmes.code });
  }

  console.log("✅ Departments & programmes for CoICT and CoET created/skipped");

  // 1. Create Default Roles
  await db.insert(roles).values([
    { name: "admin", description: "System Administrator with full access" },
    { name: "student", description: "Student user" },
    { name: "staff", description: "University staff member" },
    { name: "lecturer", description: "University lecturer" },
    { name: "class_representative", description: "Class representative" },
    { name: "sports_leader", description: "Sports / activities coordinator" }
  ]).onConflictDoNothing({ target: roles.name });
  
  // Get admin role ID for later use
  const adminRoleResult = await db.select().from(roles).where(eq(roles.name, "admin")).limit(1);
  const adminRole = adminRoleResult[0];
  if (!adminRole) throw new Error("Admin role missing after insert — check DB roles table");

  console.log("✅ Roles created/skipped");

  // 2. Create Permission Groups
  await db.insert(permissionGroups).values([
    { name: "Users", description: "User management permissions" },
    { name: "Roles", description: "Role management permissions" },
    { name: "Permissions", description: "Permission management permissions" },
    { name: "Audit", description: "Audit log permissions" }
  ]).onConflictDoNothing({ target: permissionGroups.name });

  const userGroupResult = await db.select().from(permissionGroups).where(eq(permissionGroups.name, "Users")).limit(1);
  const userGroup = userGroupResult[0];

  console.log("✅ Permission groups created/skipped");

  // 3. Create Permissions
  await db.insert(permissions).values([
    // User permissions
    { name: "user.create", description: "Create users", groupId: userGroup.id, scope: "portal" },
    { name: "user.read", description: "Read users", groupId: userGroup.id, scope: "portal" },
    { name: "user.update", description: "Update users", groupId: userGroup.id, scope: "portal" },
    { name: "user.delete", description: "Delete users", groupId: userGroup.id, scope: "portal" },
    
    // Role permissions
    { name: "role.create", description: "Create roles", scope: "portal" },
    { name: "role.read", description: "Read roles", scope: "portal" },
    { name: "role.update", description: "Update roles", scope: "portal" },
    { name: "role.delete", description: "Delete roles", scope: "portal" },
    
    // System
    { name: "permission.read", description: "Read permissions", scope: "portal" },
    { name: "audit.read", description: "Read audit logs", scope: "portal" },

    // Colleges
    { name: "college.read", description: "Read colleges", scope: "portal" },
    { name: "college.manage", description: "Manage colleges", scope: "portal" },

    // Programmes
    { name: "programme.manage", description: "Manage programmes", scope: "portal" },

    // Academic Years
    { name: "academic_year.manage", description: "Manage academic years", scope: "portal" },

    // Assignments
    { name: "assignment.manage", description: "Manage lecturer and CR assignments", scope: "portal" },

    // Announcements
    { name: "announcement.create", description: "Create announcements", scope: "app" },
    { name: "announcement.update", description: "Update announcements", scope: "app" },
    { name: "announcement.delete", description: "Delete announcements", scope: "app" },
    { name: "announcement.pin", description: "Pin/unpin announcements", scope: "app" },

    // Stories
    { name: "story.create", description: "Create stories", scope: "app" },
    { name: "story.delete", description: "Delete stories", scope: "app" },

    // Events
    { name: "event.create", description: "Create events", scope: "app" },
    { name: "event.update", description: "Update events", scope: "app" },
    { name: "event.delete", description: "Delete events", scope: "app" },

    // Lost & Found
    { name: "lostfound.moderate", description: "Moderate lost & found items", scope: "app" },

    // Feedback
    { name: "feedback.submit", description: "Submit feedback", scope: "app" },
    { name: "feedback.manage", description: "Manage feedback submissions", scope: "app" },

    // Targeted posts & groups
    { name: "post.create", description: "Create targeted posts", scope: "app" },
    { name: "post.update", description: "Update targeted posts", scope: "app" },
    { name: "post.delete", description: "Delete targeted posts", scope: "app" },
    { name: "group.manage", description: "Manage groups and memberships", scope: "app" }
  ]).onConflictDoNothing({ target: permissions.name });

  const createdPermissions = await db.select().from(permissions);
  const permByName = new Map(createdPermissions.map((p) => [p.name, p.id]));

  console.log("✅ Permissions created/skipped");

  async function grantRolePermissions(roleName: string, names: readonly string[]) {
    const r = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, roleName)).limit(1);
    if (!r[0]) {
      console.warn(`⚠️  Role "${roleName}" not found — skipping permission grant`);
      return;
    }
    const rows: { roleId: string; permissionId: string }[] = [];
    for (const n of names) {
      const pid = permByName.get(n);
      if (!pid) console.warn(`⚠️  Unknown permission "${n}" — check seed vs API`);
      else rows.push({ roleId: r[0].id, permissionId: pid });
    }
    if (rows.length === 0) return;
    await db.insert(rolePermissions).values(rows).onConflictDoNothing({
      target: [rolePermissions.roleId, rolePermissions.permissionId],
    });
  }

  // 4. Admin: full access (every permission row)
  const adminAssignments = createdPermissions.map((p) => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }));
  await db.insert(rolePermissions).values(adminAssignments).onConflictDoNothing({
    target: [rolePermissions.roleId, rolePermissions.permissionId],
  });
  console.log("✅ Admin role permissions assigned/skipped");

  /**
   * Non-admin roles — aligned with `withPermission` / `checkPermission` in `app/api/**`.
   * Students rely on JWT-only routes (feed, lost-found, feedback, media); no permission rows required.
   */
  const staffPerms = [
    "user.read",
    "user.update",
    "role.read",
    "permission.read",
    "college.read",
    "college.manage",
    "programme.manage",
    "academic_year.manage",
    "assignment.manage",
    "announcement.create",
    "announcement.update",
    "announcement.delete",
    "announcement.pin",
    "story.create",
    "story.delete",
    "event.create",
    "event.update",
    "event.delete",
    "lostfound.moderate",
    "feedback.manage",
    "audit.read",
    "post.create",
    "post.update",
    "post.delete",
    "group.manage",
  ] as const;

  const lecturerPerms = [
    "user.read",
    "college.read",
    "role.read",
    "permission.read",
    "programme.manage",
    "assignment.manage",
    "announcement.create",
    "announcement.update",
    "announcement.delete",
    "event.create",
    "event.update",
    "event.delete",
    "story.create",
    "story.delete",
    "post.create",
    "post.update",
    "post.delete",
  ] as const;

  const crPerms = ["user.read", "college.read", "post.create", "announcement.create"] as const;

  const sportsLeaderPerms = [
    "user.read",
    "college.read",
    "post.create",
    "post.update",
    "post.delete",
    "event.create",
    "event.update",
    "event.delete",
    "story.create",
  ] as const;

  await grantRolePermissions("staff", staffPerms);
  await grantRolePermissions("lecturer", lecturerPerms);
  await grantRolePermissions("class_representative", crPerms);
  await grantRolePermissions("sports_leader", sportsLeaderPerms);
  await grantRolePermissions("student", ["feedback.submit", "college.read"]);

  console.log("✅ Staff, lecturer, CR, sports_leader, student permissions assigned/skipped");

  /**
   * One of ADMIN_PASSWORD, SEED_PASSWORD, or SEED_DEMO_PASSWORD is enough to hash and insert
   * the admin account plus demo users (same bcrypt hash for all inserts in this run).
   */
  const seedUserPassword =
    process.env.ADMIN_PASSWORD?.trim() ||
    process.env.SEED_PASSWORD?.trim() ||
    process.env.SEED_DEMO_PASSWORD?.trim();

  if (!seedUserPassword) {
    console.warn(
      "⚠️  Set ADMIN_PASSWORD, SEED_PASSWORD, or SEED_DEMO_PASSWORD to create admin + demo users (pnpm db:seed).",
    );
  } else {
    const hashedUserPassword = await hashPassword(seedUserPassword);
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@udsminfo.com";

    await db
      .insert(users)
      .values({
        fullName: "Super Admin",
        registrationNumber: "ADMIN001",
        sex: "MALE",
        email: adminEmail,
        password: hashedUserPassword,
        isActive: true,
        emailVerifiedAt: new Date(),
      })
      .onConflictDoNothing({ target: users.email });

    const [seededAdmin] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
    if (seededAdmin) {
      await db
        .insert(userRoles)
        .values({
          userId: seededAdmin.id,
          roleId: adminRole.id,
          assignedBy: null,
        })
        .onConflictDoNothing({ target: [userRoles.userId, userRoles.roleId] });
    }

    console.log("✅ Admin user created/skipped (%s)", adminEmail);

    const [coictCollege] = await db.select().from(colleges).where(eq(colleges.shortName, "CoICT")).limit(1);
    const [csProgramme] = await db.select().from(programmes).where(eq(programmes.code, "CS")).limit(1);

    const roleRows = await db.select({ id: roles.id, name: roles.name }).from(roles);
    const ridFor = (name: string) => roleRows.find((r) => r.name === name)?.id;

    type DemoRow = {
      fullName: string;
      registrationNumber: string;
      email: string;
      sex: "MALE" | "FEMALE";
      roleName: string;
      attachProgramme?: boolean;
      yearOfStudy?: number;
    };

    const demos: DemoRow[] = [
      {
        fullName: "Demo Staff",
        registrationNumber: "STAFF-DEMO-01",
        email: "staff.demo@udsm.local",
        sex: "MALE",
        roleName: "staff",
      },
      {
        fullName: "Demo Lecturer",
        registrationNumber: "LECT-DEMO-01",
        email: "lecturer.demo@udsm.local",
        sex: "FEMALE",
        roleName: "lecturer",
      },
      {
        fullName: "Demo Student",
        registrationNumber: "2021-04-DEMO01",
        email: "student.demo@udsm.local",
        sex: "MALE",
        roleName: "student",
        attachProgramme: true,
        yearOfStudy: 2,
      },
      {
        fullName: "Demo Class Rep",
        registrationNumber: "CR-DEMO-01",
        email: "cr.demo@udsm.local",
        sex: "FEMALE",
        roleName: "class_representative",
        attachProgramme: true,
        yearOfStudy: 3,
      },
      {
        fullName: "Demo Sports Leader",
        registrationNumber: "SPORT-DEMO-01",
        email: "sports.demo@udsm.local",
        sex: "MALE",
        roleName: "sports_leader",
      },
    ];

    for (const d of demos) {
      const roleId = ridFor(d.roleName);
      if (!roleId) continue;
      const useProg = Boolean(d.attachProgramme && coictCollege && csProgramme);
      await db
        .insert(users)
        .values({
          fullName: d.fullName,
          registrationNumber: d.registrationNumber,
          sex: d.sex,
          email: d.email,
          password: hashedUserPassword,
          collegeId: coictCollege?.id ?? null,
          programmeId: useProg && csProgramme ? csProgramme.id : null,
          yearOfStudy: d.yearOfStudy ?? null,
          isActive: true,
          emailVerifiedAt: new Date(),
        })
        .onConflictDoNothing({ target: users.email });

      const [insertedDemo] = await db.select({ id: users.id }).from(users).where(eq(users.email, d.email)).limit(1);
      if (insertedDemo) {
        await db
          .insert(userRoles)
          .values({ userId: insertedDemo.id, roleId: roleId!, assignedBy: null })
          .onConflictDoNothing({ target: [userRoles.userId, userRoles.roleId] });
      }
    }

    console.log("✅ Demo users created/skipped (*@udsm.local, same password as above env)");
  }

  // 6. Create Default Categories
  const announcementCategories = [
    { name: "Academic", module: "ANNOUNCEMENT" as const },
    { name: "Administrative", module: "ANNOUNCEMENT" as const },
    { name: "Health", module: "ANNOUNCEMENT" as const },
    { name: "Finance", module: "ANNOUNCEMENT" as const },
    { name: "General", module: "ANNOUNCEMENT" as const },
  ];

  const lostFoundCategories = [
    { name: "Electronics", module: "LOST_FOUND" as const },
    { name: "Documents", module: "LOST_FOUND" as const },
    { name: "Clothing", module: "LOST_FOUND" as const },
    { name: "Keys", module: "LOST_FOUND" as const },
    { name: "Books", module: "LOST_FOUND" as const },
    { name: "Other", module: "LOST_FOUND" as const },
  ];

  const feedbackCategories = [
    { name: "Academic Issues", module: "FEEDBACK" as const },
    { name: "Facilities", module: "FEEDBACK" as const },
    { name: "Administration", module: "FEEDBACK" as const },
    { name: "Student Welfare", module: "FEEDBACK" as const },
    { name: "Other", module: "FEEDBACK" as const },
  ];

  const allCategories = [...announcementCategories, ...lostFoundCategories, ...feedbackCategories];
  for (const cat of allCategories) {
    await db.insert(categories).values({
      name: cat.name,
      slug: seedSlug(cat.name + "-" + cat.module),
      module: cat.module,
    }).onConflictDoNothing({ target: categories.slug });
  }
  console.log("✅ Categories created/skipped");

  // 7. Create Default Event Categories
  const defaultEventCategories = [
    { name: "Academic", iconName: "school" },
    { name: "Sports", iconName: "sports" },
    { name: "Religious", iconName: "church" },
    { name: "Career", iconName: "work" },
    { name: "Cultural", iconName: "groups" },
    { name: "Social", iconName: "people" },
  ];

  for (const ec of defaultEventCategories) {
    await db.insert(eventCategories).values({
      name: ec.name,
      slug: seedSlug("event-" + ec.name),
      iconName: ec.iconName,
    }).onConflictDoNothing({ target: eventCategories.slug });
  }
  console.log("✅ Event categories created/skipped");

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
