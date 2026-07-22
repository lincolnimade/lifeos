"use client";

import { useEffect, useState } from "react";
import AppShell from "@/app/components/AppShell";
import {
  getIntegrationsStatus,
  saveApiKeyIntegration,
  getOrCreateHealthAutoExportWebhook,
  triggerManualSync,
  disconnectIntegration,
} from "@/app/actions";

type Status = {
  provider: string;
  connected: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  webhookSecret?: string;
};

export default function SettingsPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [hevyKey, setHevyKey] = useState("");
  const [walletKey, setWalletKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const rows = (await getIntegrationsStatus()) as unknown as Status[];
    setStatuses(rows);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleHevySave() {
    if (!hevyKey.trim()) return;
    await saveApiKeyIntegration("hevy", hevyKey.trim());
    setHevyKey("");
    setMessage("Hevy key saved.");
    refresh();
  }

  async function handleWalletSave() {
    if (!walletKey.trim()) return;
    await saveApiKeyIntegration("wallet", walletKey.trim());
    setWalletKey("");
    setMessage("Wallet key saved.");
    refresh();
  }

  async function handleGetWebhook() {
    const secret = await getOrCreateHealthAutoExportWebhook();
    setWebhookUrl(`${window.location.origin}/api/integrations/health-auto-export/${secret}`);
  }

  async function handleManualSync() {
    setSyncing(true);
    setMessage("");
    try {
      await triggerManualSync();
      setMessage("Sync complete.");
      refresh();
    } catch {
      setMessage("Sync failed — check the error next to each source below.");
    }
    setSyncing(false);
  }

  async function handleDisconnect(provider: "strava" | "hevy" | "wallet") {
    await disconnectIntegration(provider);
    setMessage(`${provider} disconnected.`);
    refresh();
  }

  function lastSyncedLabel(p: string) {
    const s = find(p);
    if (!s?.lastSyncedAt) return null;
    return "last synced " + new Date(s.lastSyncedAt).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const find = (p: string) => statuses.find((s) => s.provider === p);

  return (
    <AppShell title="Connected sources" crumb="Home / Dashboard / Settings">
    <div className="page">

      {message && (
        <div className="card" style={{ padding: "12px 16px", marginBottom: 16 }}>
          <span className="eyebrow">{message}</span>
        </div>
      )}

      <div className="card">
        <div className="card-hd">
          <h2>Google Calendar</h2>
          <span className={"tag" + (find("google_calendar")?.connected ? " sage" : "")}>
            {find("google_calendar")?.connected ? "connected" : "not connected"}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 0 }}>
          Surfaces your events in the Week view. Requires a Google Cloud OAuth client
          (Client ID/Secret set as env vars) with the Calendar API enabled.
        </p>
        {find("google_calendar")?.lastError && (
          <p style={{ fontSize: 12, color: "var(--pink)" }}>{find("google_calendar")?.lastError}</p>
        )}
        <a href="/api/integrations/google-calendar/connect">
          <button className="addbtn" style={{ width: "auto" }}>
            {find("google_calendar")?.connected ? "reconnect" : "connect calendar"}
          </button>
        </a>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2>Strava</h2>
          <span className={"tag" + (find("strava")?.connected ? " sage" : "")}>
            {find("strava")?.connected ? "connected" : "not connected"}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 0 }}>
          Pulls your activities — runs, rides, and anything synced to Strava from your watch or steps app.
        </p>
        {find("strava")?.lastError && (
          <p style={{ fontSize: 12, color: "var(--pink)" }}>{find("strava")?.lastError}</p>
        )}
        {lastSyncedLabel("strava") && (
          <p style={{ fontSize: 11, color: "var(--text-dim)" }}>{lastSyncedLabel("strava")}</p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/api/integrations/strava/connect">
            <button className="addbtn" style={{ width: "auto" }}>
              {find("strava")?.connected ? "reconnect" : "connect strava"}
            </button>
          </a>
          {find("strava")?.connected && (
            <button className="addbtn" style={{ width: "auto" }} onClick={() => handleDisconnect("strava")}>
              disconnect
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2>Hevy</h2>
          <span className={"tag" + (find("hevy")?.connected ? " sage" : "")}>
            {find("hevy")?.connected ? "connected" : "not connected"}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 0 }}>
          Requires Hevy Pro. Get your key at{" "}
          <a href="https://hevy.com/settings?developer" target="_blank" rel="noreferrer">
            hevy.com/settings?developer
          </a>
          .
        </p>
        {find("hevy")?.lastError && (
          <p style={{ fontSize: 12, color: "var(--pink)" }}>{find("hevy")?.lastError}</p>
        )}
        {lastSyncedLabel("hevy") && (
          <p style={{ fontSize: 11, color: "var(--text-dim)" }}>{lastSyncedLabel("hevy")}</p>
        )}
        <div className="field-row">
          <input
            type="text"
            placeholder="Paste Hevy API key"
            value={hevyKey}
            onChange={(e) => setHevyKey(e.target.value)}
          />
          <button className="addbtn" style={{ width: "auto" }} onClick={handleHevySave}>
            save
          </button>
          {find("hevy")?.connected && (
            <button className="addbtn" style={{ width: "auto" }} onClick={() => handleDisconnect("hevy")}>
              disconnect
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2>Wallet (BudgetBakers)</h2>
          <span className={"tag" + (find("wallet")?.connected ? " sage" : "")}>
            {find("wallet")?.connected ? "connected" : "not connected"}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 0 }}>
          Requires Wallet Premium. Generate a token from the Wallet web app — profile → Settings → Rest API/MCP.
        </p>
        {find("wallet")?.lastError && (
          <p style={{ fontSize: 12, color: "var(--pink)" }}>{find("wallet")?.lastError}</p>
        )}
        {lastSyncedLabel("wallet") && (
          <p style={{ fontSize: 11, color: "var(--text-dim)" }}>{lastSyncedLabel("wallet")}</p>
        )}
        <div className="field-row">
          <input
            type="text"
            placeholder="Paste Wallet API token"
            value={walletKey}
            onChange={(e) => setWalletKey(e.target.value)}
          />
          <button className="addbtn" style={{ width: "auto" }} onClick={handleWalletSave}>
            save
          </button>
          {find("wallet")?.connected && (
            <button className="addbtn" style={{ width: "auto" }} onClick={() => handleDisconnect("wallet")}>
              disconnect
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h2>Apple Health</h2>
          <span className="tag">via Health Auto Export</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 0 }}>
          Install the <strong>Health Auto Export</strong> app on your iPhone, add a new REST API
          automation, and paste this URL as the destination. Set the export format to JSON.
        </p>
        <button className="addbtn" style={{ width: "auto", marginBottom: 10 }} onClick={handleGetWebhook}>
          get my webhook url
        </button>
        {webhookUrl && (
          <div className="field-row">
            <input type="text" readOnly value={webhookUrl} onClick={(e) => (e.target as HTMLInputElement).select()} />
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-hd">
          <h2>Manual sync</h2>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 0 }}>
          Normally this runs automatically every morning before your task list is generated.
          Use this to pull fresh data right now.
        </p>
        <button className="addbtn" style={{ width: "auto" }} onClick={handleManualSync} disabled={syncing}>
          {syncing ? "syncing…" : "sync now"}
        </button>
      </div>
    </div>
    </AppShell>
  );
}
