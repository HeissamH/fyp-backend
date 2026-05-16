import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OPENAPI = path.join(ROOT, "openapi.yaml");

const UID = {
  user: "a1111111-1111-4111-8111-111111111111",
  college: "a2222222-2222-4222-8222-222222222222",
  programme: "a3333333-3333-4333-8333-333333333333",
  category: "a4444444-4444-4444-8444-444444444444",
  role: "a5555555-5555-4555-8555-555555555555",
  perm: "a6666666-6666-4666-8666-666666666666",
  ay: "a7777777-7777-4777-8777-777777777777",
  ann: "a8888888-8888-4888-8888-888888888888",
  event: "a9999999-9999-4999-8999-999999999999",
  media: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  lost: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  feedbackCat: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  dept: "d1111111-1111-4111-8111-111111111111",
  group: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
};

const REQUEST_EXAMPLES = {
  "POST /auth/register": {
    fullName: "Jane Student",
    registrationNumber: "2021-04-12345",
    course: "BSc Computer Science",
    sex: "FEMALE",
    email: "jane@student.udsm.ac.tz",
    password: "SecurePass1!",
  },
  "POST /auth/login": {
    email: "jane@student.udsm.ac.tz",
    password: "SecurePass1!",
  },
  "POST /auth/generate-otp": { email: "jane@student.udsm.ac.tz" },
  "POST /auth/verify-otp": { email: "jane@student.udsm.ac.tz", otpCode: "123456" },
  "POST /auth/reset-password": {
    resetToken: "short-lived-reset-token-from-verify-otp",
    newPassword: "NewSecurePass1!",
  },
  "POST /auth/change-password": {
    currentPassword: "SecurePass1!",
    newPassword: "NewSecurePass1!",
  },
  "POST /auth/change-email-request": { newEmail: "new.email@student.udsm.ac.tz" },
  "POST /auth/change-email-verify": {
    newEmail: "new.email@student.udsm.ac.tz",
    otpCode: "654321",
  },
  "PUT /users/{id}": {
    fullName: "Jane Student Updated",
    isActive: true,
  },
  "POST /users/{id}/roles": {
    roleId: UID.role,
  },
  "DELETE /users/{id}/roles": {
    roleId: UID.role,
  },
  "POST /roles": {
    name: "custom_analyst",
    description: "Read-only analytics",
    permissions: [UID.perm],
  },
  "PUT /roles/{id}": {
    name: "custom_analyst",
    description: "Updated description",
    permissions: [UID.perm],
  },
  "POST /colleges": { name: "College of Engineering and Technology", shortName: "COET" },
  "POST /departments": {
    collegeId: UID.college,
    name: "Computer Science and Information Technology",
    shortName: "CoICT-CSIT",
  },
  "POST /programmes": {
    departmentId: UID.dept,
    name: "Computer Science and Engineering",
    code: "CSE-BSC",
    durationYears: 4,
  },
  "POST /academic-years": {
    label: "2025/2026",
    startDate: "2025-10-01",
    endDate: "2026-07-31",
  },
  "POST /categories": { name: "Exams", module: "ANNOUNCEMENT" },
  "POST /event-categories": { name: "Workshop", iconName: "calendar" },
  "POST /announcements": {
    title: "End of semester exams",
    content: "<p>Please check the timetable on the notice board.</p>",
    excerpt: "Exam timetable published",
    type: "ANNOUNCEMENT",
    status: "PUBLISHED",
    categoryId: UID.category,
    audiences: [
      { targetType: "PROGRAMME_YEAR", programmeId: UID.programme, yearOfStudy: 2 },
    ],
    mediaIds: [],
  },
  "POST /stories": {
    collegeId: UID.college,
    mediaId: UID.media,
    caption: "Welcome week highlights",
    backgroundColor: "#1e40af",
  },
  "POST /events": {
    title: "Tech talk: cloud basics",
    description: "Introduction to cloud computing for undergraduates.",
    categoryId: UID.category,
    location: "LT1",
    startDateTime: "2026-06-15T14:00:00.000Z",
    endDateTime: "2026-06-15T16:00:00.000Z",
    maxAttendees: 50,
    status: "PUBLISHED",
  },
  "POST /events/{id}/rsvp": { status: "GOING" },
  "POST /announcements/{id}/comments": { content: "Thanks for sharing!" },
  "POST /events/{id}/comments": { content: "Looking forward to it." },
  "POST /lost-found": {
    type: "LOST",
    title: "Lost student ID card",
    description: "Black lanyard, name Jane Student",
    categoryId: UID.category,
    locationSeen: "Library ground floor",
    dateLostOrFound: "2026-05-01",
    isAnonymous: false,
    contactInfo: "+255700000000",
    mediaIds: [],
  },
  "POST /lost-found/{id}/comments": { content: "I saw it at the help desk." },
  "POST /feedback": {
    categoryId: UID.feedbackCat,
    subject: "App suggestion",
    description: "Dark mode would be helpful on the mobile app.",
  },
  "PUT /admin/feedback/{id}": {
    status: "REVIEWED",
    adminNotes: "Logged for product backlog.",
  },
  "POST /posts": {
    title: "First XI toolkit pickup",
    content: "<p>CS first team: collect new kits at the sports office Monday 9am.</p>",
    type: "POST",
    status: "PUBLISHED",
    audiences: [{ targetType: "PROGRAMME", programmeId: UID.programme }],
  },
  "POST /groups": {
    name: "Chess Club",
    type: "CLUB",
    description: "UDSM chess society",
  },
  "POST /groups/{id}/members": {
    userIds: [UID.user],
  },
};

const TAG_DESCRIPTIONS = {
  Authentication: "Registration, login, JWT, password reset, and email change",
  Users: "Profiles and admin user directory",
  "RBAC & Audit": "Roles, permissions, and audit log",
  "Colleges & Programmes": "Colleges and degree programmes",
  "Academic years": "Academic year configuration",
  Media: "File uploads (images, PDF, video)",
  Categories: "Content categories for announcements, events, and feedback",
  Announcements: "Announcements, comments, and reactions",
  Stories: "24-hour stories",
  Events: "Events, RSVP, attendees, comments, and reactions",
  "Lost & Found": "Lost and found listings",
  Feedback: "User feedback submissions",
  Posts: "Targeted posts feed (college, department, programme, groups)",
  Groups: "Audience segments (clubs, hostels, financial, custom)",
  Admin: "Admin-only operations",
};

const TAG_ORDER = [
  "Authentication",
  "Users",
  "RBAC & Audit",
  "Colleges & Programmes",
  "Academic years",
  "Media",
  "Categories",
  "Announcements",
  "Stories",
  "Events",
  "Lost & Found",
  "Feedback",
  "Posts",
  "Groups",
  "Admin",
];

/** GET paths whose 200 response uses `paginatedResponse` (data array + meta). */
const PAGINATED_GET_PATHS = new Set([
  "/users",
  "/programmes",
  "/academic-years",
  "/audit-logs",
  "/announcements",
  "/events",
  "/lost-found",
  "/admin/feedback",
  "/posts",
]);

/** GET paths where `data` is a plain array (no `meta`). */
const ARRAY_DATA_GET_PATHS = new Set([
  "/colleges",
  "/roles",
  "/permissions",
  "/categories",
  "/event-categories",
  "/feedback",
  "/stories",
  "/departments",
  "/groups",
  "/posts/{id}/comments",
]);

const ARRAY_DATA_SAMPLE = {
  "/colleges": [{ id: UID.college, name: "College of Engineering and Technology", shortName: "COET" }],
  "/roles": [{ id: UID.role, name: "STUDENT", description: "Default student role" }],
  "/permissions": [{ id: UID.perm, name: "user.read", description: "List users" }],
  "/categories": [{ id: UID.category, name: "Exams", module: "ANNOUNCEMENT" }],
  "/event-categories": [{ id: UID.category, name: "Workshop", iconName: "calendar" }],
  "/feedback": [
    {
      id: UID.lost,
      subject: "App suggestion",
      status: "PENDING",
      description: "Dark mode would help.",
    },
  ],
  "/stories": [
    {
      id: UID.ann,
      caption: "Welcome week",
      hasViewed: false,
      expiresAt: "2026-05-11T12:00:00.000Z",
    },
  ],
  "/departments": [
    {
      id: UID.dept,
      collegeId: UID.college,
      name: "Computer Science and Information Technology",
      shortName: "CoICT-CSIT",
      collegeName: "College of Information and Communication Technologies",
      collegeShortName: "CoICT",
    },
  ],
  "/groups": [
    {
      id: UID.group,
      name: "Chess Club",
      type: "CLUB",
      parentId: null,
      description: "UDSM chess society",
      isActive: true,
    },
  ],
  "/posts/{id}/comments": [
    {
      id: UID.lost,
      content: "Thanks for the update!",
      createdAt: "2026-05-10T12:00:00.000Z",
      authorId: UID.user,
      authorName: "Jane Student",
    },
  ],
};

/** GET paths where `data` is a single object. */
const SINGLE_OBJECT_GET_PATHS = {
  "/academic-years/current": {
    id: UID.ay,
    label: "2025/2026",
    isCurrent: true,
    startDate: "2025-10-01",
    endDate: "2026-07-31",
  },
  "/posts/{id}": {
    id: UID.ann,
    title: "First XI toolkit pickup",
    content: "<p>Collect kits Monday 9am.</p>",
    type: "POST",
    status: "PUBLISHED",
    isPinned: false,
    viewCount: 12,
    publishedAt: "2026-05-09T08:00:00.000Z",
    createdAt: "2026-05-09T08:00:00.000Z",
    updatedAt: "2026-05-09T08:00:00.000Z",
    author: { id: UID.user, fullName: "Jane Student" },
    media: null,
  },
};

function tagForPath(p) {
  if (p.startsWith("/auth/")) return ["Authentication"];
  if (p.startsWith("/users")) return ["Users"];
  if (p.startsWith("/audit-logs") || p.startsWith("/roles") || p.startsWith("/permissions"))
    return ["RBAC & Audit"];
  if (p.startsWith("/colleges") || p.startsWith("/departments") || p.startsWith("/programmes"))
    return ["Colleges & Programmes"];
  if (p.startsWith("/academic-years")) return ["Academic years"];
  if (p.startsWith("/media/")) return ["Media"];
  if (p.startsWith("/categories") || p.startsWith("/event-categories")) return ["Categories"];
  if (p.startsWith("/announcements")) return ["Announcements"];
  if (p.startsWith("/stories")) return ["Stories"];
  if (p.startsWith("/events")) return ["Events"];
  if (p.startsWith("/lost-found")) return ["Lost & Found"];
  if (p.startsWith("/feedback")) return ["Feedback"];
  if (p.startsWith("/posts") || p.startsWith("/post")) return ["Posts"];
  if (p.startsWith("/groups")) return ["Groups"];
  if (p.startsWith("/admin/")) return ["Admin"];
  return ["Admin"];
}

const doc = yaml.load(fs.readFileSync(OPENAPI, "utf8"));

const tagMap = new Map(
  Object.entries(TAG_DESCRIPTIONS).map(([name, description]) => [name, { name, description }]),
);
doc.tags = TAG_ORDER.map((n) => tagMap.get(n)).filter(Boolean);

doc.components.schemas.SuccessResponse.properties.data = {
  description: "Response payload; shape varies (object, array, or nested fields per endpoint). See examples on each operation.",
};
doc.components.schemas.SuccessResponse.example = {
  success: true,
  message: "Success",
  data: {
    id: UID.user,
    fullName: "Jane Student",
  },
};

doc.components.schemas.ErrorResponse.example = {
  success: false,
  message: "Validation failed",
  errors: {
    email: "Invalid email format",
  },
};

doc.components.schemas.User.properties.roleName = { type: "string" };

for (const [pathKey, item] of Object.entries(doc.paths)) {
  for (const method of ["get", "post", "put", "delete", "patch"]) {
    const op = item[method];
    if (!op || typeof op !== "object") continue;

    op.tags = tagForPath(pathKey);

    const opKey = `${method.toUpperCase()} ${pathKey}`;
    const jsonBody = op.requestBody?.content?.["application/json"];
    if (jsonBody && REQUEST_EXAMPLES[opKey]) {
      jsonBody.example = REQUEST_EXAMPLES[opKey];
    }

    if (pathKey === "/auth/login" && method === "post") {
      const login200 = op.responses?.["200"]?.content?.["application/json"];
      if (login200) {
        login200.schema = {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: {
              type: "object",
              required: ["token", "user"],
              properties: {
                token: { type: "string" },
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
        };
        login200.example = {
          success: true,
          message: "Login successful",
          data: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            user: {
              id: UID.user,
              fullName: "Jane Student",
              email: "jane@student.udsm.ac.tz",
              roles: [{ id: UID.role, name: "student" }],
            },
          },
        };
      }
    }

    if (pathKey === "/auth/register" && method === "post" && op.responses?.["201"]?.content?.["application/json"]) {
      op.responses["201"].content["application/json"].example = {
        success: true,
        message: "User registered successfully",
        data: {
          id: UID.user,
          fullName: "Jane Student",
          email: "jane@student.udsm.ac.tz",
          roles: [{ id: UID.role, name: "student" }],
        },
      };
    }

    if (pathKey === "/media/upload" && method === "post" && op.responses?.["201"]?.content?.["application/json"]) {
      op.responses["201"].content["application/json"].example = {
        success: true,
        message: "File uploaded",
        data: {
          id: UID.media,
          url: "https://example.supabase.co/storage/v1/object/public/...",
          type: "IMAGE",
          mimeType: "image/jpeg",
          sizeBytes: 245760,
          filename: "photo.jpg",
        },
      };
    }

    if (pathKey === "/auth/verify-otp" && method === "post") {
      const aj = op.responses?.["200"]?.content?.["application/json"];
      if (aj) {
        aj.schema = {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: { resetToken: { type: "string" } },
            },
          },
        };
        aj.example = {
          success: true,
          message: "OTP verified",
          data: { resetToken: "short-lived-reset-token-abc123" },
        };
      }
    }

    for (const [code, resp] of Object.entries(op.responses || {})) {
      if (!resp || typeof resp !== "object") continue;
      const n = parseInt(code, 10);

      if (resp.content?.["application/json"]) {
        const aj = resp.content["application/json"];
        const ref = aj.schema?.$ref;
        if (!aj.example && ref?.endsWith("SuccessResponse")) {
          aj.example = { success: true, message: resp.description || "OK", data: {} };
        }
        if (!aj.example && ref?.endsWith("ErrorResponse")) {
          aj.example = {
            success: false,
            message: resp.description || "Error",
            errors: {},
          };
        }
        if (method === "get" && code === "200" && n === 200) {
          if (PAGINATED_GET_PATHS.has(pathKey)) {
            aj.example = {
              success: true,
              message: "Success",
              data: [
                {
                  id: UID.user,
                  fullName: "Jane Student",
                },
              ],
              meta: {
                total: 42,
                page: 1,
                pageSize: 20,
                totalPages: 3,
              },
            };
          } else if (ARRAY_DATA_GET_PATHS.has(pathKey)) {
            aj.example = {
              success: true,
              message: "Success",
              data: ARRAY_DATA_SAMPLE[pathKey] || [{ id: UID.user, note: "sample row" }],
            };
          } else if (SINGLE_OBJECT_GET_PATHS[pathKey]) {
            aj.example = {
              success: true,
              message: "Success",
              data: SINGLE_OBJECT_GET_PATHS[pathKey],
            };
          }
        }
        continue;
      }

      if (n >= 200 && n < 300) {
        let ex;
        if (method === "get" && code === "200" && PAGINATED_GET_PATHS.has(pathKey)) {
          ex = {
            success: true,
            message: "Success",
            data: [{ id: UID.user, summary: "Sample row" }],
            meta: { total: 42, page: 1, pageSize: 20, totalPages: 3 },
          };
        } else if (method === "get" && code === "200" && ARRAY_DATA_GET_PATHS.has(pathKey)) {
          ex = {
            success: true,
            message: "Success",
            data: ARRAY_DATA_SAMPLE[pathKey] || [{ id: UID.user }],
          };
        } else if (method === "get" && code === "200" && SINGLE_OBJECT_GET_PATHS[pathKey]) {
          ex = {
            success: true,
            message: "Success",
            data: SINGLE_OBJECT_GET_PATHS[pathKey],
          };
        } else {
          ex = {
            success: true,
            message: resp.description || "OK",
            data: {},
          };
        }
        resp.content = {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
            example: ex,
          },
        };
      } else if ([400, 401, 403, 404, 409, 422, 500].includes(n)) {
        resp.content = {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              message: resp.description || "Error",
              errors: {},
            },
          },
        };
      }
    }
  }
}

const ordered = {
  openapi: doc.openapi,
  info: doc.info,
  servers: doc.servers,
  tags: doc.tags,
  components: doc.components,
  security: doc.security,
  paths: doc.paths,
};

fs.writeFileSync(
  OPENAPI,
  yaml.dump(ordered, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  }),
);
console.log("openapi.yaml enriched");
