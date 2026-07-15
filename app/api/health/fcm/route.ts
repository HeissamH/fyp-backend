import { NextResponse } from "next/server";
import {
  getFirebaseConfigStatus,
  getFirebaseMessaging,
  isFirebaseConfigured,
} from "@/lib/firebase";

/**
 * GET /api/health/fcm
 * Reports whether Firebase Admin can initialize (no secrets returned).
 * Use after setting Vercel env vars to verify push will work.
 */
export async function GET() {
  const status = getFirebaseConfigStatus();
  if (!status.configured) {
    return NextResponse.json({
      ok: false,
      source: null,
      message:
        "No Firebase env vars found. Set FIREBASE_SERVICE_ACCOUNT_BASE64 on Vercel (Production).",
    });
  }

  try {
    // Force init — throws if private key is malformed
    getFirebaseMessaging();
    return NextResponse.json({
      ok: true,
      source: status.source,
      message: "Firebase Admin initialized successfully — FCM push should work.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        source: status.source,
        message: `Firebase configured but init failed: ${message}`,
        hint:
          "Set FIREBASE_SERVICE_ACCOUNT_BASE64 to base64 of the full service-account JSON from Firebase Console.",
      },
      { status: 500 },
    );
  }
}
