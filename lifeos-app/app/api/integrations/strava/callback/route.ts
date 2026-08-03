import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeStravaCode } from "@/lib/integrations/strava";

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
    settingsUrl.searchParams.set("error", "strava_denied");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const tokens = await exchangeStravaCode(code);
    const expiresAt = new Date(tokens.expires_at * 1000);

    await prisma.integration.upsert({
      where: { userId_provider: { userId, provider: "strava" } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        lastError: null,
      },
      create: {
        userId,
        provider: "strava",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
    });
  } catch {
    settingsUrl.searchParams.set("error", "strava_failed");
    return NextResponse.redirect(settingsUrl);
  }

  return NextResponse.redirect(settingsUrl);
}
