"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Next.js 15 requires useSearchParams to live inside a Suspense boundary,
// otherwise prerendering this client component fails the production build.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get("next") ?? "/dashboard";

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/dashboard/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error ?? "Login failed");
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="dashboard-login">
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", textDecoration: "none", color: "var(--ink)" }}>
        <Image src="/logo-on-white.png" alt="" width={32} height={32} />
        <Image src="/wordmark.png" alt="Shankara · run" width={120} height={22} />
      </Link>
      <form className="dashboard-login-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="dashboard-login-sub">Sign in to your lead dashboard.</p>
        <label className="dashboard-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            placeholder="Enter admin password"
          />
        </label>
        {error && <div className="dashboard-login-error">{error}</div>}
        <button type="submit" className="offer-action-primary" disabled={busy || !password}>
          {busy ? "Signing in…" : "Sign in →"}
        </button>
        <p style={{ fontSize: "0.78rem", opacity: 0.55, textAlign: "center", margin: 0 }}>
          Admin access only. <Link href="/" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>Back to site</Link>
        </p>
      </form>
    </main>
  );
}
