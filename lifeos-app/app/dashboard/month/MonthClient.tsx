"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMonthData, saveMonthlyReflection } from "@/app/actions";

type Metric = { id: string; source: string; type: string; date: string; value: Record<string, unknown> };

export default function MonthClient() {
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    monthKey: string;
    metrics: Metric[];
    reflection: { right: string; change: string };
  } | null>(null);
  const [right, setRight] = useState("");
  const [change, setChange] = useState("");

  useEffect(() => {
    setLoading(true);
    getMonthData(offset).then((d) => {
      setData(d as never);
      setRight((d as { reflection: { right: string } }).reflection.right);
      setChange((d as { reflection: { change: string } }).reflection.change);
      setLoading(false);
    });
  }, [offset]);

  async function handleSave() {
    if (!data) return;
    await saveMonthlyReflection(data.monthKey, right, change);
  }

  const runs = data?.metrics.filter((m) => m.source === "strava" && m.type === "workout") || [];
  const gymSessions = data?.metrics.filter((m) => m.source === "hevy" && m.type === "workout") || [];
  const transactions = data?.metrics.filter((m) => m.source === "wallet" && m.type === "transaction") || [];
  const spend = transactions.reduce((sum, t) => sum + Math.abs(Number(t.value?.amount) || 0), 0);

  return (
    <div className="page">
      <div className="hdr">
        <div>
          <div className="eyebrow">LIFE OS</div>
          <h1>Month</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard/week" className="addbtn" style={{ width: "auto", textDecoration: "none" }}>
            ← week
          </Link>
          <Link href="/dashboard" className="addbtn" style={{ width: "auto", textDecoration: "none" }}>
            dashboard →
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2>{data?.monthKey || "…"}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="addbtn" style={{ width: "auto" }} onClick={() => setOffset((o) => o - 1)}>
              ‹ prev
            </button>
            <button className="addbtn" style={{ width: "auto" }} onClick={() => setOffset(0)}>
              this month
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
              <div className="l">Transactions logged</div>
              <div className="n">{transactions.length}</div>
            </div>
            <div className="stat">
              <div className="l">Total spend seen</div>
              <div className="n">{spend ? spend.toFixed(0) : "—"}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-hd">
          <h2>Monthly reflection</h2>
        </div>
        <div className="field-row">
          <textarea
            placeholder="What went right this month"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            onBlur={handleSave}
          />
        </div>
        <div className="field-row">
          <textarea
            placeholder="What I want to change going into next month"
            value={change}
            onChange={(e) => setChange(e.target.value)}
            onBlur={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
