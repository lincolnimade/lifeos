import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeGoogleCode } from "@/lib/integrations/googleCalendar";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const errorParam = req.nextUrl.searchParams.get("error");
  const settingsUrl = new URL("/settings", req.url);

  if (errorParam || !code) {
    settingsUrl.searchParams.set("error", "google_calendar_denied");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const redirectUri = new URL("/api/integrations/google-calendar/callback", req.url).toString();
    const tokens = await exchangeGoogleCode(code, redirectUri);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.integration.upsert({
      where: { userId_provider: { userId, provider: "google_calendar" } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt,
        lastError: null,
      },
      create: {
        userId,
        provider: "google_calendar",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
    });
  } catch {
    settingsUrl.searchParams.set("error", "google_calendar_failed");
    return NextResponse.redirect(settingsUrl);
  }

  return NextResponse.redirect(settingsUrl);
}
