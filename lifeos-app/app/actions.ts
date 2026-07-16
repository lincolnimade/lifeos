"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultState, type DashboardData } from "@/lib/defaultState";
import { syncAll } from "@/lib/integrations/sync";
import { getRecentMetrics } from "@/lib/integrations/metrics";
import { getRecentMemoryNotes, saveMemoryNote } from "@/lib/integrations/memoryNotes";
import { getCalendarEvents } from "@/lib/integrations/calendar";
import { generateDailyTasks as callAnthropic, askMentor } from "@/lib/anthropic";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

// One-time setup: creates the only account this deployment will ever have.
// Refuses once a user already exists, so nobody else can create an account
// on your deployed app before (or after) you've set yours up.
export async function createFirstUser(email: string, password: string) {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    return { ok: false, error: "An account already exists on this deployment." };
  }
  if (!email || !password || password.length < 8) {
    return { ok: false, error: "Enter an email and a password of at least 8 characters." };
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, password: hashed } });
  return { ok: true };
}

export async function hasAnyUser() {
  const count = await prisma.user.count();
  return count > 0;
}

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function getState(): Promise<DashboardData> {
  const userId = await requireUserId();
  const row = await prisma.dashboardState.findUnique({ where: { userId } });
  if (!row) return defaultState;
  return { ...defaultState, ...(row.data as object) } as DashboardData;
}

export async function saveState(data: DashboardData): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await prisma.dashboardState.upsert({
    where: { userId },
    update: { data: data as object },
    create: { userId, data: data as object },
  });
  return { ok: true };
}

export async function getIntegrationsStatus() {
  const userId = await requireUserId();
  const rows = await prisma.integration.findMany({ where: { userId } });
  return rows.map((r: {
    provider: string;
    accessToken: string | null;
    apiKey: string | null;
    lastSyncedAt: Date | null;
    lastError: string | null;
    webhookSecret: string | null;
  }) => ({
    provider: r.provider,
    connected: r.provider === "health_auto_export" ? true : !!(r.accessToken || r.apiKey),
    lastSyncedAt: r.lastSyncedAt,
    lastError: r.lastError,
    webhookSecret: r.provider === "health_auto_export" ? r.webhookSecret : undefined,
  }));
}

export async function saveApiKeyIntegration(provider: "hevy" | "wallet", apiKey: string) {
  const userId = await requireUserId();
  await prisma.integration.upsert({
    where: { userId_provider: { userId, provider } },
    update: { apiKey, lastError: null },
    create: { userId, provider, apiKey },
  });
  return { ok: true };
}

export async function getOrCreateHealthAutoExportWebhook() {
  const userId = await requireUserId();
  const existing = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "health_auto_export" } },
  });
  if (existing?.webhookSecret) return existing.webhookSecret;

  const secret = randomBytes(20).toString("hex");
  await prisma.integration.upsert({
    where: { userId_provider: { userId, provider: "health_auto_export" } },
    update: { webhookSecret: secret },
    create: { userId, provider: "health_auto_export", webhookSecret: secret },
  });
  return secret;
}

export async function disconnectIntegration(provider: "strava" | "hevy" | "wallet" | "health_auto_export") {
  const userId = await requireUserId();
  await prisma.integration.deleteMany({ where: { userId, provider } });
  return { ok: true };
}

export async function triggerManualSync() {
  const userId = await requireUserId();
  return syncAll(userId);
}

export async function getTodaysTasks() {
  const userId = await requireUserId();
  const today = new Date().toISOString().slice(0, 10);
  return prisma.dailyTask.findMany({
    where: { userId, date: today },
    orderBy: { priority: "asc" },
  });
}

export async function toggleTask(taskId: string, done: boolean) {
  const userId = await requireUserId();
  await prisma.dailyTask.updateMany({ where: { id: taskId, userId }, data: { done } });
  return { ok: true };
}

export async function regenerateTodaysTasks() {
  const userId = await requireUserId();
  const row = await prisma.dashboardState.findUnique({ where: { userId } });
  const state = { ...defaultState, ...((row?.data as object) || {}) } as DashboardData;
  const recentMetrics = await getRecentMetrics(userId, 30);
  const memoryNotes = await getRecentMemoryNotes(userId, 15);
  const { tasks, memory } = await callAnthropic(state, recentMetrics, memoryNotes);

  const today = new Date().toISOString().slice(0, 10);
  await prisma.dailyTask.deleteMany({ where: { userId, date: today } });
  await prisma.dailyTask.createMany({
    data: tasks.map((t, i) => ({
      userId,
      date: today,
      text: t.text,
      reason: t.reason,
      category: t.category,
      priority: i,
    })),
  });
  if (memory) await saveMemoryNote(userId, memory);
  return getTodaysTasks();
}

export async function askMentorAction(question: string) {
  const userId = await requireUserId();
  const row = await prisma.dashboardState.findUnique({ where: { userId } });
  const state = { ...defaultState, ...((row?.data as object) || {}) } as DashboardData;
  const recentMetrics = await getRecentMetrics(userId, 30);
  const memoryNotes = await getRecentMemoryNotes(userId, 15);
  const { answer, memory } = await askMentor(state, recentMetrics, memoryNotes, question);
  if (memory) await saveMemoryNote(userId, memory);
  return { answer };
}

export async function getMemoryNotes() {
  const userId = await requireUserId();
  return getRecentMemoryNotes(userId, 30);
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function getWeekData(weekOffset = 0) {
  const userId = await requireUserId();
  const monday = startOfWeek(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const [metrics, calendar, row] = await Promise.all([
    prisma.metricSnapshot.findMany({
      where: { userId, date: { gte: monday, lte: sunday } },
      orderBy: { date: "asc" },
    }),
    getCalendarEvents(userId, monday.toISOString(), sunday.toISOString()),
    prisma.dashboardState.findUnique({ where: { userId } }),
  ]);

  const state = { ...defaultState, ...((row?.data as object) || {}) } as DashboardData;
  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
    metrics,
    calendar,
    weeklyFocus: state.weeklyFocus || "",
    weeklyWins: state.weeklyWins || [],
  };
}

export async function saveWeeklyFocus(text: string) {
  const userId = await requireUserId();
  const row = await prisma.dashboardState.findUnique({ where: { userId } });
  const state = { ...defaultState, ...((row?.data as object) || {}) } as DashboardData;
  state.weeklyFocus = text;
  await prisma.dashboardState.upsert({
    where: { userId },
    update: { data: state as object },
    create: { userId, data: state as object },
  });
}

export async function saveWeeklyWins(wins: string[]) {
  const userId = await requireUserId();
  const row = await prisma.dashboardState.findUnique({ where: { userId } });
  const state = { ...defaultState, ...((row?.data as object) || {}) } as DashboardData;
  state.weeklyWins = wins;
  await prisma.dashboardState.upsert({
    where: { userId },
    update: { data: state as object },
    create: { userId, data: state as object },
  });
}

export async function getMonthData(monthOffset = 0) {
  const userId = await requireUserId();
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59, 999);
  const monthKey = first.toISOString().slice(0, 7);

  const [metrics, row] = await Promise.all([
    prisma.metricSnapshot.findMany({
      where: { userId, date: { gte: first, lte: last } },
      orderBy: { date: "asc" },
    }),
    prisma.dashboardState.findUnique({ where: { userId } }),
  ]);

  const state = { ...defaultState, ...((row?.data as object) || {}) } as DashboardData;
  const reflections = state.monthlyReflections || {};
  return {
    monthKey,
    metrics,
    reflection: reflections[monthKey] || { right: "", change: "" },
  };
}

export async function saveMonthlyReflection(monthKey: string, right: string, change: string) {
  const userId = await requireUserId();
  const row = await prisma.dashboardState.findUnique({ where: { userId } });
  const state = { ...defaultState, ...((row?.data as object) || {}) } as DashboardData;
  state.monthlyReflections = { ...(state.monthlyReflections || {}), [monthKey]: { right, change } };
  await prisma.dashboardState.upsert({
    where: { userId },
    update: { data: state as object },
    create: { userId, data: state as object },
  });
}
