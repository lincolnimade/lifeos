"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWeekData, saveWeeklyFocus, saveWeeklyWins } from "@/app/actions";

type Metric = { id: string; source: string; type: string; date: string; value: Record<string, unknown> };
type CalEvent = { id: string; summary?: string; start?: { dateTime?: string; date?: string } };

export default function WeekClient() {
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    weekStart: string;
    weekEnd: string;
    metrics: Metric[];
    calendar: { connected: boolean; events: CalEvent[] };
    weeklyFocus: string;
    weeklyWins: string[];
  } | null>(null);
  const [focus, setFocus] = useState("");
  const [wins, setWins] = useState<string[]>([]);
  const [newWin, setNewWin] = useState("");

  useEffect(() => {
    setLoading(true);
    getWeekData(offset).then((d) => {
      setData(d as never);
      setFocus((d as { weeklyFocus: string }).weeklyFocus);
      setWins((d as { weeklyWins: string[] }).weeklyWins);
      setLoading(false);
    });
  }, [offset]);

  async function handleFocusBlur() {
    await saveWeeklyFocus(focus);
  }

  async function handleAddWin() {
    if (!newWin.trim()) return;
    const updated = [...wins, newWin.trim()];
    setWins(updated);
    setNewWin("");
    await saveWeeklyWins(updated);
  }

  async function handleRemoveWin(i: number) {
    const updated = wins.filter((_, idx) => idx !== i);
    setWins(updated);
    await saveWeeklyWins(updated);
  }

  const runs = data?.metrics.filter((m) => m.source === "strava" && m.type === "workout") || [];
  const gymSessions = data?.metrics.filter((m) => m.source === "hevy" && m.type === "workout") || [];
  const steps = data?.metrics.filter((m) => m.type === "steps") || [];
  const totalSteps = steps.reduce((sum, s) => sum + (Number(s.value?.qty) || 0), 0);

  return (
    <div className="page">
      <div className="hdr">
        <div>
          <div className="eyebrow">LIFE OS</div>
          <h1>Week</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard" className="addbtn" style={{ width: "auto", textDecoration: "none" }}>
            ← dashboard
          </Link>
          <Link href="/dashboard/month" className="addbtn" style={{ width: "auto", textDecoration: "none" }}>
            month view →
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2>{data ? `${data.weekStart} – ${data.weekEnd}` : "…"}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="addbtn" style={{ width: "auto" }} onClick={() => setOffset((o) => o - 1)}>
              ‹ prev
            </button>
            <button className="addbtn" style={{ width: "auto" }} onClick={() => setOffset(0)}>
              this week
            </button>
            <button className="addbtn" style={{ width: "auto" }} onClick={() => setOffset((o) => Math.min(0, o + 1))}>
              next ›
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-mid)", fontSize: 13 }}>Loading…</p>
        ) : (
          <div className="stat-strip">
            <div className="stat">
              <div className="l">Runs / rides</div>
              <div className="n">{runs.length}</div>
            </div>
            <div className="stat">
              <div className="l">Gym sessions</div>
              <div className="n">{gymSessions.length}</div>
            </div>
            <div className="stat">
              <div className="l">Steps</div>
              <div className="n">{totalSteps ? totalSteps.toLocaleString() : "—"}</div>
            </div>
            <div className="stat">
              <div className="l">Calendar events</div>
              <div className="n">{data?.calendar.events?.length ?? "—"}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-hd">
            <h2>This week&apos;s focus</h2>
          </div>
          <textarea
            placeholder="One thing to actually focus on this week"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            onBlur={handleFocusBlur}
          />
        </div>
        <div className="card">
          <div className="card-hd">
            <h2>Wins</h2>
          </div>
          {wins.map((w, i) => (
            <div className="row-item" key={i}>
              <span style={{ flex: 1, fontSize: 13 }}>{w}</span>
              <button className="deal-del" onClick={() => handleRemoveWin(i)}>
                ✕
              </button>
            </div>
          ))}
          <div className="field-row" style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="Add a win"
              value={newWin}
              onChange={(e) => setNewWin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWin()}
            />
            <button className="addbtn" style={{ width: "auto" }} onClick={handleAddWin}>
              add
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2>Calendar this week</h2>
          <span className="tag">{data?.calendar.connected ? "connected" : "not connected"}</span>
        </div>
        {!data?.calendar.connected ? (
          <p style={{ fontSize: 13, color: "var(--text-mid)" }}>
            Connect Google Calendar from <Link href="/settings">settings</Link> to see events here.
          </p>
        ) : data.calendar.events.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-mid)" }}>Nothing on the calendar this week.</p>
        ) : (
          data.calendar.events.map((ev) => (
            <div className="row-item" key={ev.id}>
              <span style={{ fontSize: 13 }}>{ev.summary || "(no title)"}</span>
              <span className="eyebrow">
                {ev.start?.dateTime
                  ? new Date(ev.start.dateTime).toLocaleString("en-GB", {
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ev.start?.date}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
