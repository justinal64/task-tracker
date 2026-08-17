"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-client";
import type { Child } from "@/lib/types";

export default function LockGate({
  familyId,
  childId,
  initialLocked,
  children,
}: {
  familyId: string;
  childId: string;
  initialLocked: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locked, setLocked] = useState(initialLocked);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = doc(db, "families", familyId, "children", childId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as Child | undefined;
      if (data) setLocked(data.locked);
    });
    return unsub;
  }, [familyId, childId]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/kid/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Incorrect PIN.");
      setPin("");
      setLocked(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect PIN.");
    } finally {
      setLoading(false);
    }
  }

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form
        onSubmit={handleUnlock}
        className="flex w-full max-w-xs flex-col items-center gap-4 rounded-xl border border-hairline bg-surface p-6 text-center"
      >
        <span className="text-4xl">🔒</span>
        <h1 className="text-lg font-semibold">Locked</h1>
        <p className="text-sm text-muted">Enter your PIN to unlock.</p>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          autoFocus
          required
          className="w-32 rounded-lg border border-hairline bg-background px-4 py-2.5 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading || pin.length !== 4}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
