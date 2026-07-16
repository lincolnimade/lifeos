import type { DashboardData } from "@/lib/defaultState";

type MetricRow = { source: string; type: string; date: Date; value: unknown };
type MemoryNote = { text: string; createdAt: Date };

const TASKS_SYSTEM_PROMPT = `You generate a short, specific daily task list for one person based on
their stated goals, their actual recent activity/finance data over the last 30 days, and notes you
(the same AI) have written about them in past sessions. Rules:
- 4 to 6 tasks maximum, ordered by priority.
- Each task must be concrete and actionable, not a generic reminder.
- Weigh in patterns from the memory notes — if a past note says something is a recurring issue,
  address it rather than repeating advice that hasn't worked.
- Where recent data suggests a change (bad sleep, missed training, overspending, a stalled deal),
  let it override the default plan for that day.
- For each task, give a one-sentence reason that cites the specific data or goal behind it.
- Assign a category: Career, Ventures, Body, or Finance.
- After the task array, on a new line, write one new short observation (under 25 words) worth
  remembering for future sessions — a pattern, a recurring blocker, or something that changed.
  Prefix it with "MEMORY:". If there's nothing new worth noting, write "MEMORY: none".
Respond with the JSON array first, then the MEMORY line. No other prose, no markdown fences.`;

const ASK_SYSTEM_PROMPT = `You are a direct, honest advisor answering a question about someone's own
life dashboard. You have their goals, recent activity data, and notes from past sessions with them.
Answer in under 100 words, reference specific numbers or patterns, don't hedge unnecessarily.
After your answer, on a new line, write "MEMORY: " followed by one short observation worth
remembering for next time (under 25 words), or "MEMORY: none" if nothing new.`;

function buildContext(
  state: DashboardData,
  recentMetrics: MetricRow[],
  memoryNotes: MemoryNote[]
) {
  const goalsSummary = {
    career: state.career,
    quarterGoals: state.quarterGoals,
    netWorth: state.netWorth,
    incomeSources: state.incomeSources,
    deals: state.deals,
    bodyTargets: "92-95kg at 10% body fat, 3x weekly full body training, combat sports",
    fiveYearFocus: state.fiveYearPlan[0],
  };
  return (
    `Goals:\n${JSON.stringify(goalsSummary, null, 2)}\n\n` +
    `Activity/finance data, last 30 days:\n${JSON.stringify(recentMetrics, null, 2)}\n\n` +
    `Notes from past sessions (most recent first):\n${memoryNotes.map((m) => `- ${m.text}`).join("\n") || "none yet"}`
  );
}

async function callClaude(system: string, userMessage: string, maxTokens: number) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${body}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
  if (!textBlock) throw new Error("No text content in Anthropic response");
  return textBlock.text as string;
}

function splitMemory(raw: string) {
  const memoryIdx = raw.lastIndexOf("MEMORY:");
  if (memoryIdx === -1) return { body: raw.trim(), memory: "" };
  const body = raw.slice(0, memoryIdx).trim();
  const memory = raw.slice(memoryIdx + "MEMORY:".length).trim();
  return { body, memory: memory === "none" ? "" : memory };
}

export async function generateDailyTasks(
  state: DashboardData,
  recentMetrics: MetricRow[],
  memoryNotes: MemoryNote[]
) {
  const raw = await callClaude(
    TASKS_SYSTEM_PROMPT,
    buildContext(state, recentMetrics, memoryNotes),
    1200
  );
  const { body, memory } = splitMemory(raw.replace(/```json|```/g, ""));
  const tasks = JSON.parse(body) as Array<{ text: string; reason: string; category: string }>;
  return { tasks, memory };
}

export async function askMentor(
  state: DashboardData,
  recentMetrics: MetricRow[],
  memoryNotes: MemoryNote[],
  question: string
) {
  const raw = await callClaude(
    ASK_SYSTEM_PROMPT,
    buildContext(state, recentMetrics, memoryNotes) + `\n\nQuestion: ${question}`,
    600
  );
  const { body, memory } = splitMemory(raw);
  return { answer: body, memory };
}
