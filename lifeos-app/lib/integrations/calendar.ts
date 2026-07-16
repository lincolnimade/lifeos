import { prisma } from "@/lib/prisma";
import { fetchCalendarEvents, refreshGoogleToken } from "@/lib/integrations/googleCalendar";

export async function getCalendarEvents(userId: string, fromIso: string, toIso: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "google_calendar" } },
  });
  if (!integration?.accessToken || !integration.refreshToken) return { connected: false, events: [] };

  try {
    const expiresSoon =
      !integration.expiresAt || integration.expiresAt.getTime() < Date.now() + 5 * 60 * 1000;
    let token = integration.accessToken;

    if (expiresSoon) {
      const refreshed = await refreshGoogleToken(integration.refreshToken);
      token = refreshed.access_token;
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: refreshed.access_token,
          expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
    }

    const events = await fetchCalendarEvents(token, fromIso, toIso);
    return { connected: true, events };
  } catch (e) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastError: e instanceof Error ? e.message : "unknown error" },
    });
    return { connected: true, events: [], error: true };
  }
}
