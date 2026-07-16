"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createFirstUser, hasAnyUser } from "@/app/actions";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [alreadySetUp, setAlreadySetUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hasAnyUser().then((exists) => {
      setAlreadySetUp(exists);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await createFirstUser(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Something went wrong.");
      return;
    }
    router.push("/login");
  }

  if (checking) {
    return (
      <div className="login-wrap">
        <div className="eyebrow">checking…</div>
      </div>
    );
  }

  if (alreadySetUp) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="eyebrow">LIFE OS</div>
          <h1>Already set up</h1>
          <p style={{ fontSize: 13, color: "var(--text-mid)" }}>
            An account already exists on this deployment. Go to the login page instead.
          </p>
          <button onClick={() => router.push("/login")}>Go to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="eyebrow">LIFE OS — FIRST-TIME SETUP</div>
        <h1>Create your login</h1>
        <p style={{ fontSize: 13, color: "var(--text-mid)", marginTop: -6 }}>
          This runs once. After this, this page won&apos;t let anyone create another account.
        </p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
