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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5l11 11M4 8l4-4M20 16l-4 4M2 10l2-2M22 14l-2 2M9 4l-2 2M17 18l-2 2" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function StatusPill({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <span className={"status-pill" + (connected ? " on" : "")}>
      <span className="dot" />
      {label || (connected ? "connected" : "not connected")}
    </span>
  );
}

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

  async function handleCopyWebhook() {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setMessage("Webhook URL copied.");
    } catch {
      // clipboard not available, ignore
    }
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
    return "Last synced " + new Date(s.lastSyncedAt).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const find = (p: string) => statuses.find((s) => s.provider === p);
  const connectedCount = ["google_calendar", "strava", "hevy", "wallet"].filter((p) => find(p)?.connected).length;

  return (
    <AppShell title="Connected sources" crumb="Home / Dashboard / Settings">
      <div className="page">
        <div className="settings-summary">
          <div>
            <div className="settings-summary-count">
              <span>{connectedCount}</span> / 4 sources connected
            </div>
            <div className="settings-summary-sub">
              {message || "Data feeds your daily tasks, week view, and AI mentor."}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleManualSync} disabled={syncing}>
            <RefreshIcon />
            {syncing ? "Syncing…" : "Sync all now"}
          </button>
        </div>

        <div className="provider-grid">
          <div className="provider-card">
            <div className="provider-top">
              <div className="provider-icon" style={{ background: "#4285F4" }}>
                <CalendarIcon />
              </div>
              <div className="provider-meta">
                <h2>Google Calendar</h2>
                <p className="provider-desc">Surfaces your events in the Week view.</p>
              </div>
              <StatusPill connected={!!find("google_calendar")?.connected} />
            </div>
            <p className="provider-note">Requires a Google Cloud OAuth client with the Calendar API enabled.</p>
            {find("google_calendar")?.lastError && (
              <div className="provider-error">{find("google_calendar")?.lastError}</div>
            )}
            <div className="provider-actions">
              <a href="/api/integrations/google-calendar/connect" style={{ textDecoration: "none" }}>
                <button className="btn btn-secondary">
                  {find("google_calendar")?.connected ? "Reconnect" : "Connect calendar"}
                </button>
              </a>
            </div>
          </div>

          <div className="provider-card">
            <div className="provider-top">
              <div className="provider-icon" style={{ background: "#FC4C02" }}>
                <ActivityIcon />
              </div>
              <div className="provider-meta">
                <h2>Strava</h2>
                <p className="provider-desc">Runs, rides, and anything synced from your watch.</p>
              </div>
              <StatusPill connected={!!find("strava")?.connected} />
            </div>
            {lastSyncedLabel("strava") && <p className="provider-note">{lastSyncedLabel("strava")}</p>}
            {find("strava")?.lastError && <div className="provider-error">{find("strava")?.lastError}</div>}
            <div className="provider-actions">
              <a href="/api/integrations/strava/connect" style={{ textDecoration: "none" }}>
                <button className="btn btn-secondary">
                  {find("strava")?.connected ? "Reconnect" : "Connect Strava"}
                </button>
              </a>
              {find("strava")?.connected && (
                <button className="btn btn-danger" onClick={() => handleDisconnect("strava")}>
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <div className="provider-card">
            <div className="provider-top">
              <div className="provider-icon" style={{ background: "#7C6CF0" }}>
                <DumbbellIcon />
              </div>
              <div className="provider-meta">
                <h2>Hevy</h2>
                <p className="provider-desc">Workout logs — requires Hevy Pro.</p>
              </div>
              <StatusPill connected={!!find("hevy")?.connected} />
            </div>
            <p className="provider-note">
              Get your key at{" "}
              <a href="https://hevy.com/settings?developer" target="_blank" rel="noreferrer">
                hevy.com/settings?developer
              </a>
            </p>
            {lastSyncedLabel("hevy") && <p className="provider-note">{lastSyncedLabel("hevy")}</p>}
            {find("hevy")?.lastError && <div className="provider-error">{find("hevy")?.lastError}</div>}
            <div className="provider-actions">
              <input
                type="text"
                placeholder="Paste Hevy API key"
                value={hevyKey}
                onChange={(e) => setHevyKey(e.target.value)}
              />
              <button className="btn btn-secondary" onClick={handleHevySave}>
                Save
              </button>
              {find("hevy")?.connected && (
                <button className="btn btn-danger" onClick={() => handleDisconnect("hevy")}>
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <div className="provider-card">
            <div className="provider-top">
              <div className="provider-icon" style={{ background: "#2FBE7A" }}>
                <WalletIcon />
              </div>
              <div className="provider-meta">
                <h2>Wallet (BudgetBakers)</h2>
                <p className="provider-desc">Spending and net worth — requires Wallet Premium.</p>
              </div>
              <StatusPill connected={!!find("wallet")?.connected} />
            </div>
            <p className="provider-note">Generate a token: profile → Settings → Rest API/MCP.</p>
            {lastSyncedLabel("wallet") && <p className="provider-note">{lastSyncedLabel("wallet")}</p>}
            {find("wallet")?.lastError && <div className="provider-error">{find("wallet")?.lastError}</div>}
            <div className="provider-actions">
              <input
                type="text"
                placeholder="Paste Wallet API token"
                value={walletKey}
                onChange={(e) => setWalletKey(e.target.value)}
              />
              <button className="btn btn-secondary" onClick={handleWalletSave}>
                Save
              </button>
              {find("wallet")?.connected && (
                <button className="btn btn-danger" onClick={() => handleDisconnect("wallet")}>
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <div className="provider-card full">
            <div className="provider-top">
              <div className="provider-icon" style={{ background: "#FF375F" }}>
                <HeartIcon />
              </div>
              <div className="provider-meta">
                <h2>Apple Health</h2>
                <p className="provider-desc">Via the Health Auto Export iPhone app.</p>
              </div>
              <StatusPill connected={!!webhookUrl} label={webhookUrl ? "url generated" : "not set up"} />
            </div>
            <p className="provider-note">
              Install <strong>Health Auto Export</strong>, add a new REST API automation, and paste the URL below as
              the destination. Set the export format to JSON.
            </p>
            <div className="provider-actions">
              <button className="btn btn-secondary" onClick={handleGetWebhook}>
                {webhookUrl ? "Regenerate webhook url" : "Get my webhook url"}
              </button>
            </div>
            {webhookUrl && (
              <div className="code-row">
                <input type="text" readOnly value={webhookUrl} onClick={(e) => (e.target as HTMLInputElement).select()} />
                <button className="btn btn-secondary" onClick={handleCopyWebhook}>
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
