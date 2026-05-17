import { NextRequest, NextResponse } from "next/server";

/** Origins explicitly allowed plus app URL (Swagger / SPA on prod must match here for preflight to succeed). */
function allowedOriginSet(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS || "http://localhost:3000";
  const set = new Set<string>();
  for (const piece of raw.split(",")) {
    const o = piece.trim();
    if (o) set.add(o);
  }
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (app) {
    try {
      const u = new URL(app);
      set.add(`${u.protocol}//${u.host}`);
    } catch {
      /* ignore malformed URL */
    }
  }
  return set;
}

const CORS_HEADERS = "Authorization, Content-Type, Accept";
const ALLOW_METHODS = "GET, POST, PUT, DELETE, PATCH, OPTIONS";

/** In development, allow Flutter web / tools on any localhost port. */
function isLocalDevOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const u = new URL(origin);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Never send `credentials: true` with `*` — browsers reject it; Swagger may use credential mode. */
function resolveCors(request: NextRequest): string | null {
  const configured = allowedOriginSet();
  const wildcard = configured.has("*");
  const origin = request.headers.get("origin");

  if (!origin) {
    return wildcard ? "*" : null;
  }
  if (wildcard || configured.has(origin) || isLocalDevOrigin(origin)) {
    return origin;
  }
  return null;
}

function applyApiCors(headers: Headers, allowOrigin: string | null): void {
  if (!allowOrigin) return;

  headers.set("Access-Control-Allow-Origin", allowOrigin);
  if (allowOrigin !== "*") {
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  headers.set("Vary", "Origin");
}

export function middleware(request: NextRequest) {
  const allowOrigin = resolveCors(request);

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    applyApiCors(response.headers, allowOrigin);
    if (allowOrigin) {
      response.headers.set("Access-Control-Allow-Methods", ALLOW_METHODS);
      response.headers.set("Access-Control-Allow-Headers", CORS_HEADERS);
      response.headers.set("Access-Control-Max-Age", "86400");
    }
    return response;
  }

  const response = NextResponse.next();
  applyApiCors(response.headers, allowOrigin);

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
