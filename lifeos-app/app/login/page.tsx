"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
async function handleSubmit(e: React.FormEvent) {
e.preventDefault();
setLoading(true);
setError("");
const normalizedEmail = email.trim().toLowerCase();
const res = await signIn("credentials", { email: normalizedEmail, password, redirect: false });
setLoading(false);
if (!res || res.error) {
setError("Invalid email or password.");
return;
}
router.push("/dashboard");
router.refresh();
}
return (
<div className="login-wrap">
<form className="login-card" onSubmit={handleSubmit}>
<div className="eyebrow">LIFE OS</div>
<h1>Log in</h1>
<input type="email" placeholder="Email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
<input type="password" placeholder="Password" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
{error && <div className="login-error">{error}</div>}
<button type="submit" disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
</form>
</div>
);
}
