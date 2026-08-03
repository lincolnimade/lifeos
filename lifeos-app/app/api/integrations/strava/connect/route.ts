import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStravaAuthUrl } from "@/lib/integrations/strava";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const redirectUri = new URL("/api/integrations/strava/callback", req.url).toString();
  const authUrl = getStravaAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}
