import admin from "firebase-admin";

let initialized = false;
let initError: string | null = null;

/**
 * Vercel often corrupts multi-line PEM keys. Prefer, in order:
 * 1) FIREBASE_SERVICE_ACCOUNT_BASE64 — base64 of full service-account JSON
 * 2) FIREBASE_SERVICE_ACCOUNT_JSON — full JSON string
 * 3) FIREBASE_PRIVATE_KEY (+ PROJECT_ID + CLIENT_EMAIL), with PEM normalization
 * 4) FIREBASE_PRIVATE_KEY_BASE64 — base64 of PEM only
 */
function normalizePem(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Expand escaped newlines (once or twice for double-escaped Vercel values)
  for (let i = 0; i < 3; i++) {
    if (key.includes("\\n")) key = key.replace(/\\n/g, "\n");
    else break;
  }
  return key.trim();
}

function loadServiceAccount(): admin.ServiceAccount | null {
  const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (saB64) {
    try {
      const json = JSON.parse(Buffer.from(saB64, "base64").toString("utf8")) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (json.project_id && json.client_email && json.private_key) {
        return {
          projectId: json.project_id,
          clientEmail: json.client_email,
          privateKey: normalizePem(json.private_key),
        };
      }
    } catch (err) {
      console.error("FIREBASE_SERVICE_ACCOUNT_BASE64 parse failed:", err);
    }
  }

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (saJson) {
    try {
      const json = JSON.parse(saJson) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (json.project_id && json.client_email && json.private_key) {
        return {
          projectId: json.project_id,
          clientEmail: json.client_email,
          privateKey: normalizePem(json.private_key),
        };
      }
    } catch (err) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON parse failed:", err);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey =
    process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim()
      ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64.trim(), "base64").toString("utf8")
      : process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: normalizePem(privateKey),
    };
  }

  return null;
}

export function getFirebaseMessaging(): admin.messaging.Messaging {
  if (initError) {
    throw new Error(initError);
  }

  if (!initialized) {
    const sa = loadServiceAccount();
    if (!sa?.projectId || !sa.clientEmail || !sa.privateKey) {
      initError = "Firebase credentials are not configured";
      throw new Error(initError);
    }

    if (admin.apps.length === 0) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(sa),
        });
      } catch (err) {
        initError =
          err instanceof Error
            ? err.message
            : "Firebase Admin initialize failed";
        console.error(
          "Firebase Admin initialize failed — fix FIREBASE_SERVICE_ACCOUNT_BASE64 on Vercel:",
          err,
        );
        throw err;
      }
    }
    initialized = true;
  }

  return admin.messaging();
}

export function isFirebaseConfigured(): boolean {
  if (initError) return false;
  return loadServiceAccount() != null;
}

/** Non-secret diagnostics for /api health checks */
export function getFirebaseConfigStatus(): {
  configured: boolean;
  source: string | null;
  initError: string | null;
} {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim()) {
    return { configured: true, source: "SERVICE_ACCOUNT_BASE64", initError };
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    return { configured: true, source: "SERVICE_ACCOUNT_JSON", initError };
  }
  if (process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim()) {
    return { configured: true, source: "PRIVATE_KEY_BASE64", initError };
  }
  if (process.env.FIREBASE_PRIVATE_KEY?.trim()) {
    return { configured: true, source: "PRIVATE_KEY", initError };
  }
  return { configured: false, source: null, initError };
}
