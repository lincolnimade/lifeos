import { prisma } from "@/lib/prisma";
import { fetchStravaActivities, refreshStravaToken } from "@/lib/integrations/strava";
import { fetchHevyWorkouts } from "@/lib/integrations/hevy";
import { fetchWalletTransactions } from "@/lib/integrations/wallet";
import { upsertMetric } from "@/lib/integrations/metrics";

async function getValidStravaToken(integration: {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
}) {
  if (!integration.accessToken || !integration.refreshToken) return null;
  const expiresSoon = !integration.expiresAt || integration.expiresAt.getTime() < Date.now() + 5 * 60 * 1000;
  if (!expiresSoon) return integration.accessToken;

  const tokens = await refreshStravaToken(integration.refreshToken);
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expires_at * 1000),
    },
  });
  return tokens.access_token;
}

export async function syncStrava(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "strava" } },
  });
  if (!integration) return { synced: 0, skipped: true };

  try {
    const token = await getValidStravaToken(integration);
    if (!token) return { synced: 0, skipped: true };

    const since = integration.lastSyncedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activities = await fetchStravaActivities(token, Math.floor(since.getTime() / 1000));

    for (const a of activities) {
      await upsertMetric(
        userId,
        "strava",
        "workout",
        new Date(a.start_date),
        {
          name: a.name,
          sport: a.type,
          distance_m: a.distance,
          moving_time_s: a.moving_time,
          avg_heartrate: a.average_heartrate,
          elevation_gain_m: a.total_elevation_gain,
        },
        String(a.id)
      );
    }

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncedAt: new Date(), lastError: null },
    });
    return { synced: activities.length, skipped: false };
  } catch (e) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastError: e instanceof Error ? e.message : "unknown error" },
    });
    throw e;
  }
}

export async function syncHevy(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "hevy" } },
  });
  if (!integration?.apiKey) return { synced: 0, skipped: true };

  try {
    const { workouts } = await fetchHevyWorkouts(integration.apiKey, 1, 15);
    for (const w of workouts) {
      await upsertMetric(
        userId,
        "hevy",
        "workout",
        new Date(w.start_time),
        {
          title: w.title,
          duration_s:
            (new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 1000,
          exercises: w.exercises.map((ex) => ({
            title: ex.title,
            sets: ex.sets.length,
            volume_kg: ex.sets.reduce((s, set) => s + (set.weight_kg || 0) * (set.reps || 0), 0),
          })),
        },
        w.id
      );
    }
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncedAt: new Date(), lastError: null },
    });
    return { synced: workouts.length, skipped: false };
  } catch (e) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastError: e instanceof Error ? e.message : "unknown error" },
    });
    throw e;
  }
}

export async function syncWallet(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "wallet" } },
  });
  if (!integration?.apiKey) return { synced: 0, skipped: true };

  try {
    const since = integration.lastSyncedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { records } = await fetchWalletTransactions(integration.apiKey, since.toISOString());
    for (const r of records) {
      await upsertMetric(
        userId,
        "wallet",
        "transaction",
        new Date(r.date),
        {
          amount: r.amount,
          currency: r.currency,
          category: r.category,
          account: r.account,
          note: r.note,
        },
        r.id
      );
    }
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncedAt: new Date(), lastError: null },
    });
    return { synced: records.length, skipped: false };
  } catch (e) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastError: e instanceof Error ? e.message : "unknown error" },
    });
    throw e;
  }
}

export async function syncAll(userId: string) {
  const results = await Promise.allSettled([
    syncStrava(userId),
    syncHevy(userId),
    syncWallet(userId),
  ]);
  return {
    strava: results[0],
    hevy: results[1],
    wallet: results[2],
  };
}
