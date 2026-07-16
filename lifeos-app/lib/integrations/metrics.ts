import { prisma } from "@/lib/prisma";

export async function upsertMetric(
  userId: string,
  source: string,
  type: string,
  date: Date,
  value: object,
  externalId: string
) {
  await prisma.metricSnapshot.upsert({
    where: { userId_source_externalId: { userId, source, externalId } },
    update: { value, date, type },
    create: { userId, source, type, externalId, date, value },
  });
}

export async function getRecentMetrics(userId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.metricSnapshot.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "desc" },
  });
}
