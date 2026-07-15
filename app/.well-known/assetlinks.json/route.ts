import { NextResponse } from "next/server";

/**
 * Android App Links verification file.
 * Served at: https://www.udsminfo.com/.well-known/assetlinks.json
 *
 * Fingerprint matches the current release signing config (debug keystore
 * used for release in android/app/build.gradle.kts). When a production
 * keystore is introduced, add its SHA-256 fingerprint here too.
 */
const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "tz.ac.udsm.udsm_connect",
      sha256_cert_fingerprints: [
        // Debug / current release (signingConfig = debug)
        "34:35:BE:73:AD:D8:29:64:CB:50:FE:5A:37:0B:54:19:EE:F2:ED:A2:D0:8A:EB:A2:CC:E8:A6:F2:08:A8:6E:69",
      ],
    },
  },
];

export async function GET() {
  return NextResponse.json(ASSET_LINKS, {
    headers: {
      "Content-Type": "application/json",
      // Google re-fetches periodically; allow short CDN cache
      "Cache-Control": "public, max-age=300",
    },
  });
}
