"use client";

import { useState } from "react";
import type { Recurrence } from "@/lib/types";

export default function TaskCard({
  taskId,
  title,
  description,
  points,
  recurrence,
  completed,
  onCompleted,
}: {
  taskId: string;
  title: string;
  description: string | null;
  points: number;
  recurrence: Recurrence;
  completed: boolean;
  onCompleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not mark done.");
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark done.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-4 ${
        completed ? "border-hairline bg-background opacity-60" : "border-hairline bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{title}</p>
          {description && <p className="text-sm text-muted">{description}</p>}
          <p className="text-sm font-semibold text-accent">
            {points} pts{recurrence === "daily" ? " · daily" : ""}
          </p>
        </div>
        {completed ? (
          <span className="shrink-0 text-sm font-semibold text-success">✓ Done</span>
        ) : (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "…" : "Mark done"}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
