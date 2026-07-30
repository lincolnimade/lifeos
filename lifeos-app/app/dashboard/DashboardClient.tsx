"use client";

import { useEffect, useRef, useState } from "react";
import { saveState, getTodaysTasks, toggleTask, regenerateTodaysTasks, askMentorAction, getMemoryNotes } from "@/app/actions";
import NetWorthChart from "@/app/components/NetWorthChart";

function Ico({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
const IconTasks = () => (
  <Ico>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 12l3 3 7-7" />
  </Ico>
);
const IconSparkle = () => (
  <Ico>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
  </Ico>
);
const IconBriefcase = () => (
  <Ico>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Ico>
);
const IconCoins = () => (
  <Ico>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-.7.71" />
  </Ico>
);
const IconRocket = () => (
  <Ico>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </Ico>
);
const IconActivity = () => (
  <Ico>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Ico>
);
const IconFlag = () => (
  <Ico>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <path d="M4 22V15" />
  </Ico>
);
const IconRepeat = () => (
  <Ico>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </Ico>
);
const IconTarget = () => (
  <Ico>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </Ico>
);
const IconCalendar = () => (
  <Ico>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </Ico>
);
const IconTrendUp = () => (
  <Ico>
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </Ico>
);
const IconList = () => (
  <Ico>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </Ico>
);
const IconCompass = () => (
  <Ico>
    <circle cx="12" cy="12" r="10" />
    <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" />
  </Ico>
);
const IconMap = () => (
  <Ico>
    <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z" />
    <path d="M8 2v16M16 6v16" />
  </Ico>
);

import type { DashboardData } from "@/lib/defaultState";

const todayStr = () => new Date().toISOString().slice(0, 10);

function getWeekDates(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + offset * 7);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function fmtEuro(n: number) {
  return "€" + Number(n || 0).toLocaleString("en-IE");
}

function playPop() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.setValueAtTime(600, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.start();
    o.stop(ctx.currentTime + 0.15);
  } catch {
    // audio not available, skip silently
  }
}

function burstConfetti(x: number, y: number) {
  const colors = ["#7C6CF0", "#5B8DEF", "#2FBE7A", "#F0EFF6"];
  for (let i = 0; i < 10; i++) {
    const p = document.createElement("div");
    p.style.cssText = "position:fixed;width:5px;height:5px;pointer-events:none;z-index:9999;border-radius:1px;";
    p.style.background = colors[i % colors.length];
    p.style.left = x + "px";
    p.style.top = y + "px";
    document.body.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 20;
    p.animate(
      [
        { transform: "translate(0,0)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 60}px)`, opacity: 0 },
      ],
      { duration: 600 + Math.random() * 300, easing: "ease-out" }
    );
    setTimeout(() => p.remove(), 900);
  }
}

const stageWeight: Record<string, number> = { Concept: 15, Planning: 35, Building: 55, Live: 90, Paused: 20 };

export default function DashboardClient({ initialState }: { initialState: DashboardData }) {
  const [state, setState] = useState<DashboardData>(initialState);
  const firstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedLabel, setSavedLabel] = useState("saved");

  type Task = { id: string; text: string; reason: string | null; category: string | null; done: boolean };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getTodaysTasks()
      .then((rows) => setTasks(rows as unknown as Task[]))
      .finally(() => setTasksLoading(false));
  }, []);

  async function handleToggleTask(id: string, done: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    await toggleTask(id, done);
  }

  async function handleRegenerate() {
    setGenerating(true);
    try {
      const fresh = await regenerateTodaysTasks();
      setTasks(fresh as unknown as Task[]);
    } catch {
      // surfaced via the empty state below if it keeps failing
    }
    setGenerating(false);
  }

  type ChatTurn = { q: string; a: string };
  const [chatLog, setChatLog] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [memoryCount, setMemoryCount] = useState<number | null>(null);

  useEffect(() => {
    getMemoryNotes().then((notes) => setMemoryCount(notes.length));
  }, []);

  async function handleAsk() {
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setAsking(true);
    try {
      const { answer } = await askMentorAction(q);
      setChatLog((prev) => [...prev, { q, a: answer }]);
      getMemoryNotes().then((notes) => setMemoryCount(notes.length));
    } catch {
      setChatLog((prev) => [...prev, { q, a: "Couldn't reach the AI mentor — check ANTHROPIC_API_KEY is set." }]);
    }
    setAsking(false);
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSavedLabel("saving…");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState(state).then(() => setSavedLabel("saved"));
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function update(fn: (draft: DashboardData) => void) {
    setState((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }

  const weekDates = getWeekDates(state.weekOffset);
  const logSet = new Set(state.dailyLog.map((l) => l.habitId + "|" + l.date));
  const dailyTotal = state.dailyHabits.length * 7;
  const dailyDone = weekDates.reduce(
    (sum, d) => sum + state.dailyHabits.filter((h) => logSet.has(h.id + "|" + d)).length,
    0
  );
  const habitScore = dailyTotal ? Math.round((dailyDone / dailyTotal) * 100) : 0;

  const momentumVals = [state.career.pct, ...state.deals.map((d) => stageWeight[d.stage] ?? 20)];
  const momentum = Math.round(momentumVals.reduce((a, b) => a + b, 0) / momentumVals.length);

  const q = Math.floor(new Date().getMonth() / 3) + 1;
  const bucketPct = state.bucketList.length
    ? Math.round((state.bucketList.filter((b) => b.completed).length / state.bucketList.length) * 100)
    : 0;

  return (
    <div className="page">
      <div className="hdr">
        <div>
          <div className="eyebrow">
            LIFE OS —{" "}
            {new Date()
              .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
              .toUpperCase()}
          </div>
          <h1>Command deck</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="eyebrow">{savedLabel}</span>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat">
          <div className="l">Life rating</div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={state.rating}
            onChange={(e) => update((d) => (d.rating = Number(e.target.value)))}
            style={{
              background: `linear-gradient(to right, var(--accent) ${(state.rating / 10) * 100}%, var(--surface-2) ${(state.rating / 10) * 100}%)`,
            }}
          />
          <div className="n">{state.rating.toFixed(1)}</div>
        </div>
        <div className="stat">
          <div className="l">Net worth (€)</div>
          <input
            type="text"
            value={state.netWorth.current}
            onChange={(e) =>
              update((d) => (d.netWorth.current = Number(e.target.value.replace(/[^0-9.]/g, "")) || 0))
            }
          />
          <div className="n">{fmtEuro(state.netWorth.current)}</div>
        </div>
        <div className="stat">
          <div className="l">Momentum</div>
          <div className="n">{momentum}</div>
        </div>
        <div className="stat">
          <div className="l">Habits this week</div>
          <div className="n">{habitScore}%</div>
        </div>
      </div>

      <div className="pipeline">
        {[{ label: "Career", pct: state.career.pct }, ...state.deals.map((d) => ({ label: d.name, pct: stageWeight[d.stage] ?? 20 }))].map(
          (it, i, arr) => (
            <div
              key={i}
              className="seg"
              style={{
                width: Math.max(8, 100 / arr.length) + "%",
                background: it.pct > 70 ? "var(--up)" : it.pct > 35 ? "var(--accent)" : "var(--text-dim)",
              }}
            >
              {it.label}
            </div>
          )
        )}
      </div>

      <div className="card">
        <div className="card-hd">
          <h2 className="card-hd-title"><IconTasks />Today&apos;s tasks</h2>
          <button className="addbtn" style={{ width: "auto" }} onClick={handleRegenerate} disabled={generating}>
            {generating ? "generating…" : "regenerate"}
          </button>
        </div>
        {tasksLoading ? (
          <p style={{ fontSize: 13, color: "var(--text-mid)" }}>Loading…</p>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <IconTasks />
            <p>No task list yet for today — connect a source and hit regenerate, or wait for the morning run.</p>
          </div>
        ) : (
          tasks.map((t) => (
            <div className={"row-item" + (t.done ? " done" : "")} key={t.id}>
              <input type="checkbox" checked={t.done} onChange={(e) => handleToggleTask(t.id, e.target.checked)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{t.text}</div>
                {t.reason && <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.reason}</div>}
              </div>
              {t.category && <span className="tag">{t.category}</span>}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-hd">
          <h2 className="card-hd-title"><IconSparkle />AI Mentor</h2>
          {memoryCount !== null && <span className="tag sage">{memoryCount} memories</span>}
        </div>
        {chatLog.map((turn, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>{turn.q}</div>
            <div style={{ fontSize: 13, background: "var(--surface-2)", border: "1px solid var(--line-soft)", borderRadius: 8, padding: "10px 12px" }}>
              {turn.a}
            </div>
          </div>
        ))}
        <div className="field-row">
          <input
            type="text"
            placeholder="Ask about your progress — it remembers past sessions"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button className="addbtn" style={{ width: "auto" }} onClick={handleAsk} disabled={asking}>
            {asking ? "thinking…" : "ask"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div>
          <div className="card">
            <div className="card-hd">
              <h2 className="card-hd-title"><IconBriefcase />Career pipeline</h2>
              <span className="tag">Qstream → AE → CRO</span>
            </div>
            <div className="barlabel">
              <span>{state.career.stage || "Stage"}</span>
              <span>{state.career.pct}%</span>
            </div>
            <div
              className="barwrap"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                update((d) => (d.career.pct = Math.max(0, Math.min(100, pct))));
              }}
            >
              <div className="bar" style={{ width: state.career.pct + "%" }} />
            </div>
            <div className="field-row">
              <input
                type="text"
                placeholder="Target"
                value={state.career.target}
                onChange={(e) => update((d) => (d.career.target = e.target.value))}
              />
            </div>
            <div className="field-row">
              <input
                type="text"
                placeholder="Current stage"
                value={state.career.stage}
                onChange={(e) => update((d) => (d.career.stage = e.target.value))}
              />
            </div>
            <textarea
              placeholder="Next actions, interview notes..."
              value={state.career.notes}
              onChange={(e) => update((d) => (d.career.notes = e.target.value))}
            />
          </div>

          <div className="card">
            <div className="card-hd">
              <h2>Net worth trajectory</h2>
              <span className="tag sage">Coast FI: €280-300k by 31-32</span>
            </div>
            <NetWorthChart targets={state.netWorth.yearTargets} current={state.netWorth.current} />
            {state.netWorth.yearTargets.map((t, i) => {
              const pct = Math.min(100, Math.round((state.netWorth.current / t) * 100));
              return (
                <div className="nw-bar-row" key={i}>
                  <div className="yr">Yr {i + 1}</div>
                  <div className="track">
                    <div className="fill" style={{ width: pct + "%" }} />
                  </div>
                  <div className="target">{fmtEuro(t)}</div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-hd">
              <h2 className="card-hd-title"><IconCoins />Income sources</h2>
              <span className="tag">Target: 5 by year 5</span>
            </div>
            {state.incomeSources.map((src, i) => (
              <div className={"income-row" + (src.active ? " active" : "")} key={i}>
                <div
                  className="dot"
                  style={{ cursor: "pointer" }}
                  onClick={() => update((d) => (d.incomeSources[i].active = !d.incomeSources[i].active))}
                />
                <input
                  type="text"
                  value={src.name}
                  onChange={(e) => update((d) => (d.incomeSources[i].name = e.target.value))}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-hd">
              <h2 className="card-hd-title"><IconRocket />Ventures</h2>
              <span className="tag">Portfolio</span>
            </div>
            {state.deals.map((deal, i) => (
              <div className="deal" key={i}>
                <div className="deal-top">
                  <input
                    type="text"
                    value={deal.name}
                    onChange={(e) => update((d) => (d.deals[i].name = e.target.value))}
                  />
                  <button className="deal-del" onClick={() => update((d) => d.deals.splice(i, 1))}>
                    ✕
                  </button>
                </div>
                <div className="field-row">
                  <select
                    className="stage-select"
                    value={deal.stage}
                    onChange={(e) => update((d) => (d.deals[i].stage = e.target.value))}
                  >
                    {["Concept", "Planning", "Building", "Live", "Paused"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="next-action">
                  <input
                    type="text"
                    placeholder="Next action"
                    value={deal.next}
                    onChange={(e) => update((d) => (d.deals[i].next = e.target.value))}
                  />
                </div>
              </div>
            ))}
            <button
              className="addbtn"
              onClick={() => update((d) => d.deals.push({ name: "New venture", stage: "Concept", next: "" }))}
            >
              + add venture
            </button>
          </div>

          <div className="card">
            <div className="card-hd">
              <h2 className="card-hd-title"><IconActivity />Body</h2>
              <span className="tag">92-95kg @ 10% bf</span>
            </div>
            <div className="stat-strip" style={{ marginBottom: 12 }}>
              <div className="stat">
                <div className="l">Weight</div>
                <input
                  type="text"
                  value={state.body.weight}
                  onChange={(e) => update((d) => (d.body.weight = e.target.value))}
                />
              </div>
              <div className="stat">
                <div className="l">Body fat</div>
                <input
                  type="text"
                  value={state.body.bf}
                  onChange={(e) => update((d) => (d.body.bf = e.target.value))}
                />
              </div>
              <div className="stat">
                <div className="l">Streak</div>
                <div className="n">
                  {(() => {
                    let streak = 0;
                    const d = new Date();
                    const set = new Set(state.body.log);
                    while (true) {
                      const key = d.toISOString().slice(0, 10);
                      if (set.has(key)) {
                        streak++;
                        d.setDate(d.getDate() - 1);
                      } else break;
                    }
                    return streak;
                  })()}
                </div>
              </div>
            </div>
            <button
              className="addbtn"
              style={{ marginBottom: 10 }}
              onClick={() =>
                update((d) => {
                  const key = todayStr();
                  if (!d.body.log.includes(key)) d.body.log.push(key);
                })
              }
            >
              log training today
            </button>
            {state.combat.map((c, i) => (
              <div className={"row-item" + (c.done ? " done" : "")} key={i}>
                <input
                  type="checkbox"
                  checked={c.done}
                  onChange={(e) => update((d) => (d.combat[i].done = e.target.checked))}
                />
                <input
                  type="text"
                  value={c.text}
                  onChange={(e) => update((d) => (d.combat[i].text = e.target.value))}
                />
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-hd">
              <h2 className="card-hd-title"><IconFlag />Lifestyle milestones</h2>
            </div>
            {state.milestones.map((m, i) => (
              <div className="milestone" key={i}>
                <span className="status-dot">◆</span>
                <input
                  type="text"
                  placeholder="Milestone"
                  value={m.text}
                  onChange={(e) => update((d) => (d.milestones[i].text = e.target.value))}
                />
                <input
                  type="text"
                  placeholder="Target"
                  value={m.date}
                  onChange={(e) => update((d) => (d.milestones[i].date = e.target.value))}
                />
                <button className="deal-del" onClick={() => update((d) => d.milestones.splice(i, 1))}>
                  ✕
                </button>
              </div>
            ))}
            <button
              className="addbtn"
              onClick={() => update((d) => d.milestones.push({ text: "New milestone", date: "" }))}
            >
              + add milestone
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2 className="card-hd-title"><IconRepeat />Daily habits</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="addbtn" style={{ width: "auto", padding: "5px 9px" }} onClick={() => update((d) => (d.weekOffset -= 1))}>
              ‹
            </button>
            <span className="eyebrow">
              {state.weekOffset === 0 ? "this week" : weekDates[0].slice(5) + " – " + weekDates[6].slice(5)}
            </span>
            <button
              className="addbtn"
              style={{ width: "auto", padding: "5px 9px" }}
              onClick={() => update((d) => (d.weekOffset = Math.min(0, d.weekOffset + 1)))}
            >
              ›
            </button>
            <span className="streak">{habitScore}%</span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <td></td>
                {weekDates.map((wd) => (
                  <td
                    key={wd}
                    style={{ textAlign: "center", color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace", fontSize: 10, padding: 4 }}
                  >
                    {new Date(wd).toLocaleDateString("en-GB", { weekday: "short" })}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.dailyHabits.map((h, i) => (
                <tr key={h.id}>
                  <td style={{ padding: "5px 8px 5px 0", whiteSpace: "nowrap" }}>
                    <input
                      type="text"
                      value={h.text}
                      style={{ background: "transparent", border: "none", color: "var(--text)", fontSize: 12, width: 190 }}
                      onChange={(e) => update((d) => (d.dailyHabits[i].text = e.target.value))}
                    />
                  </td>
                  {weekDates.map((wd) => {
                    const checked = logSet.has(h.id + "|" + wd);
                    return (
                      <td key={wd} style={{ textAlign: "center", padding: 3 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const rect = e.target.getBoundingClientRect();
                              burstConfetti(rect.left, rect.top);
                              playPop();
                            }
                            update((d) => {
                              if (e.target.checked) {
                                d.dailyLog.push({ habitId: h.id, date: wd });
                              } else {
                                d.dailyLog = d.dailyLog.filter((l) => !(l.habitId === h.id && l.date === wd));
                              }
                            });
                          }}
                        />
                      </td>
                    );
                  })}
                  <td>
                    <button className="deal-del" onClick={() => update((d) => (d.dailyHabits = d.dailyHabits.filter((x) => x.id !== h.id)))}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className="addbtn"
          style={{ marginTop: 10 }}
          onClick={() => update((d) => d.dailyHabits.push({ id: "d" + Date.now(), text: "New habit" }))}
        >
          + add daily habit
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-hd">
            <h2 className="card-hd-title"><IconTarget />Weekly targets</h2>
            <span className="tag sage">
              {state.weeklyHabits.reduce((sum, h) => sum + Math.min(h.goal, state.weeklyLog.filter((l) => l.habitId === h.id && weekDates.includes(l.date)).length), 0)}
              /{state.weeklyHabits.reduce((sum, h) => sum + h.goal, 0)}
            </span>
          </div>
          {state.weeklyHabits.map((h, i) => {
            const count = state.weeklyLog.filter((l) => l.habitId === h.id && weekDates.includes(l.date)).length;
            const pct = Math.min(100, Math.round((count / h.goal) * 100));
            return (
              <div className="deal" key={h.id}>
                <div className="deal-top">
                  <input type="text" value={h.text} onChange={(e) => update((d) => (d.weeklyHabits[i].text = e.target.value))} />
                  <button className="deal-del" onClick={() => update((d) => d.weeklyHabits.splice(i, 1))}>
                    ✕
                  </button>
                </div>
                <div className="barlabel">
                  <span>{count} / {h.goal} this week</span>
                  <span>{pct}%</span>
                </div>
                <div className="barwrap">
                  <div className="bar" style={{ width: pct + "%", background: "var(--sage-dim)" }} />
                </div>
                <div className="field-row">
                  <input
                    type="text"
                    value={h.goal}
                    style={{ maxWidth: 50 }}
                    title="Weekly goal count"
                    onChange={(e) => update((d) => (d.weeklyHabits[i].goal = Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                  <button
                    className="addbtn"
                    style={{ width: "auto" }}
                    onClick={() => update((d) => d.weeklyLog.push({ habitId: h.id, date: todayStr() }))}
                  >
                    log one
                  </button>
                </div>
              </div>
            );
          })}
          <button className="addbtn" onClick={() => update((d) => d.weeklyHabits.push({ id: "w" + Date.now(), text: "New target", goal: 3 }))}>
            + add weekly target
          </button>
        </div>

        <div className="card">
          <div className="card-hd">
            <h2 className="card-hd-title"><IconCalendar />Monthly</h2>
          </div>
          {state.monthly.map((h, i) => (
            <div className={"row-item" + (h.done ? " done" : "")} key={i}>
              <input type="checkbox" checked={h.done} onChange={(e) => update((d) => (d.monthly[i].done = e.target.checked))} />
              <input type="text" value={h.text} onChange={(e) => update((d) => (d.monthly[i].text = e.target.value))} />
              <button className="deal-del" onClick={() => update((d) => d.monthly.splice(i, 1))}>
                ✕
              </button>
            </div>
          ))}
          <button className="addbtn" onClick={() => update((d) => d.monthly.push({ text: "New habit", done: false }))}>
            + add
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-hd">
            <h2 className="card-hd-title"><IconTrendUp />This quarter</h2>
            <span className="tag">Q{q} {new Date().getFullYear()}</span>
          </div>
          {state.quarterGoals.map((g, i) => (
            <div className={"row-item" + (g.completed ? " done" : "")} key={i}>
              <input type="checkbox" checked={g.completed} onChange={(e) => update((d) => (d.quarterGoals[i].completed = e.target.checked))} />
              <select
                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}
                value={g.category}
                onChange={(e) => update((d) => (d.quarterGoals[i].category = e.target.value))}
              >
                {["Career", "Ventures", "Body", "Finance"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Goal for this quarter"
                value={g.text}
                onChange={(e) => update((d) => (d.quarterGoals[i].text = e.target.value))}
              />
              <button className="deal-del" onClick={() => update((d) => d.quarterGoals.splice(i, 1))}>
                ✕
              </button>
            </div>
          ))}
          <button className="addbtn" onClick={() => update((d) => d.quarterGoals.push({ category: "Career", text: "", completed: false }))}>
            + add quarterly goal
          </button>
          <h3 style={{ fontSize: 13, color: "var(--text-mid)", margin: "16px 0 6px" }}>Training consistency — last 13 weeks</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
            {(() => {
              const set = new Set(state.body.log);
              const bars = [];
              for (let w = 12; w >= 0; w--) {
                const dates = getWeekDates(-w);
                const count = dates.filter((d) => set.has(d)).length;
                const h = Math.max(4, (count / 7) * 44);
                bars.push(
                  <div
                    key={w}
                    title={count + " sessions"}
                    style={{ width: 8, height: h, background: count >= 3 ? "var(--sage-dim)" : "var(--line)" }}
                  />
                );
              }
              return bars;
            })()}
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <h2 className="card-hd-title"><IconList />Bucket list</h2>
            <span className="tag sage">{bucketPct}%</span>
          </div>
          {state.bucketList.map((b, i) => (
            <div className={"row-item" + (b.completed ? " done" : "")} key={i}>
              <input type="checkbox" checked={b.completed} onChange={(e) => update((d) => (d.bucketList[i].completed = e.target.checked))} />
              <span className="tag" style={{ fontSize: 9 }}>
                {b.category}
              </span>
              <input type="text" value={b.text} onChange={(e) => update((d) => (d.bucketList[i].text = e.target.value))} />
              <button className="deal-del" onClick={() => update((d) => d.bucketList.splice(i, 1))}>
                ✕
              </button>
            </div>
          ))}
          <button className="addbtn" onClick={() => update((d) => d.bucketList.push({ text: "New item", category: "Experience", completed: false }))}>
            + add
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2 className="card-hd-title"><IconCompass />Year — grounding</h2>
        </div>
        <div className="field-row">
          <textarea
            placeholder="Vision — where this year is heading"
            value={state.yearReflections.vision}
            onChange={(e) => update((d) => (d.yearReflections.vision = e.target.value))}
          />
        </div>
        <div className="field-row">
          <textarea
            placeholder="Non-negotiables"
            value={state.yearReflections.nonNeg}
            onChange={(e) => update((d) => (d.yearReflections.nonNeg = e.target.value))}
          />
        </div>
        <div className="field-row">
          <textarea
            placeholder="Focus"
            value={state.yearReflections.focus}
            onChange={(e) => update((d) => (d.yearReflections.focus = e.target.value))}
          />
        </div>
        <div className="field-row">
          <textarea
            placeholder="What I want to change"
            value={state.yearReflections.change}
            onChange={(e) => update((d) => (d.yearReflections.change = e.target.value))}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2 className="card-hd-title"><IconMap />Five year plan</h2>
        </div>
        <div className="timeline">
          {state.fiveYearPlan.map((p, i) => (
            <div className="tl-item" key={i}>
              <div className="yr">{p.year}</div>
              <textarea value={p.text} onChange={(e) => update((d) => (d.fiveYearPlan[i].text = e.target.value))} />
            </div>
          ))}
        </div>
      </div>

      <div className="foot">SAVED TO YOUR ACCOUNT — WORKS FROM ANY DEVICE YOU LOG INTO</div>
    </div>
  );
}
