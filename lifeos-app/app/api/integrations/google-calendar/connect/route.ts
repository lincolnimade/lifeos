import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/integrations/googleCalendar";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const redirectUri = new URL("/api/integrations/google-calendar/callback", req.url).toString();
  const authUrl = getGoogleAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}
