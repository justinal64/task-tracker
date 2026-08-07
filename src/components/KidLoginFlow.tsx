"use client";

import { useState } from "react";
import PinPad from "@/components/PinPad";

interface MatchedChild {
  childId: string;
  name: string;
  avatarEmoji: string;
}

export default function KidLoginFlow() {
  const [name, setName] = useState("");
  const [child, setChild] = useState<MatchedChild | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/child-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "We couldn't find that name.");
      setChild(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't find that name.");
    } finally {
      setLoading(false);
    }
  }

  if (child) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <span className="text-5xl">{child.avatarEmoji}</span>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Hi, {child.name}!</h1>
          <p className="text-muted">Enter your PIN</p>
        </div>
        <PinPad childId={child.childId} />
        <button
          type="button"
          onClick={() => {
            setChild(null);
            setName("");
          }}
          className="text-sm text-muted hover:text-foreground"
        >
          ← Not you?
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleNameSubmit} className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">What&apos;s your first name?</h1>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
        className="w-full max-w-xs rounded-lg border border-hairline bg-surface px-4 py-2.5 text-center text-lg focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
