import { NextRequest, NextResponse } from "next/server";
import { notifyEventsStarted } from "@/lib/notifications/notify-event-started";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const processed = await notifyEventsStarted();
  return NextResponse.json({ success: true, processed });
}
