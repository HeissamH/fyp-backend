import admin from "firebase-admin";

let initialized = false;

/**
 * Vercel often stores PEM keys with:
 * - literal `\n` sequences
 * - surrounding double quotes
 * - accidental double-escaping (`\\n`)
 * Broken keys surface as: Failed to parse private key / DECODER routines::unsupported
 */
export function normalizeFirebasePrivateKey(raw: string | undefined): string | undefined {
  // Prefer base64 (single-line, Vercel-safe) when provided
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim();
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf8").trim();
    } catch (err) {
      console.error("FIREBASE_PRIVATE_KEY_BASE64 decode failed:", err);
    }
  }

  if (!raw) return undefined;

  let key = raw.trim();

  // Strip wrapping quotes from dashboard paste
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Normalize Windows newlines then expand escaped \n
  key = key.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Apply twice for double-escaped env values
  key = key.replace(/\\n/g, "\n").replace(/\\n/g, "\n");

  if (!key.includes("BEGIN PRIVATE KEY") && !key.includes("BEGIN RSA PRIVATE KEY")) {
    console.error(
      "Firebase private key missing PEM headers after normalize — set FIREBASE_PRIVATE_KEY_BASE64 on Vercel",
    );
  }

  return key;
}

export function getFirebaseMessaging(): admin.messaging.Messaging {
  if (!initialized) {
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = normalizeFirebasePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase credentials are not configured");
    }

    if (admin.apps.length === 0) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } catch (err) {
        console.error("Firebase Admin initialize failed:", err);
        throw err;
      }
    }
    initialized = true;
  }

  return admin.messaging();
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
      process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
      process.env.FIREBASE_PRIVATE_KEY?.trim(),
  );
}
