"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdjustPointsForm({ childId }: { childId: string }) {
  const router = useRouter();
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/family/children/${childId}/adjust-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: Number(points), reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not adjust points.");
      setPoints("");
      setReason("");
      setMessage("Points updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not adjust points.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-5"
    >
      <h2 className="font-medium">Adjust points</h2>
      <div className="flex gap-3">
        <input
          type="number"
          step={1}
          placeholder="+5 or -5"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          required
          className="w-28 rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="text"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="flex-1 rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {saving ? "Saving…" : "Apply"}
      </button>
    </form>
  );
}
