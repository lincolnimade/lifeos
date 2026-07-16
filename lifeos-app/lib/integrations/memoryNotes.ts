import { prisma } from "@/lib/prisma";

export async function saveMemoryNote(userId: string, text: string) {
  if (!text.trim()) return;
  await prisma.aiMemoryNote.create({ data: { userId, text: text.trim() } });

  // Keep this from growing unbounded — trim to the most recent 200 notes per user.
  const count = await prisma.aiMemoryNote.count({ where: { userId } });
  if (count > 200) {
    const excess = await prisma.aiMemoryNote.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: count - 200,
      select: { id: true },
    });
    await prisma.aiMemoryNote.deleteMany({
      where: { id: { in: excess.map((e: { id: string }) => e.id) } },
    });
  }
}

export async function getRecentMemoryNotes(userId: string, limit = 15) {
  return prisma.aiMemoryNote.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
