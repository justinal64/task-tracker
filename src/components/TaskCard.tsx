"use client";

import { useState } from "react";
import { weekdaysLabel } from "@/lib/recurrence";
import { fireConfetti } from "@/lib/confetti";
import { playSuccessChime } from "@/lib/sound";
import type { Recurrence } from "@/lib/types";

export default function TaskCard({
  taskId,
  title,
  description,
  points,
  recurrence,
  weekdays,
  completed,
  pending,
  required,
  pinned,
  streak,
  overdue,
  onCompleted,
}: {
  taskId: string;
  title: string;
  description: string | null;
  points: number;
  recurrence: Recurrence;
  weekdays: number[] | null;
  completed: boolean;
  pending: boolean;
  required: boolean;
  pinned: boolean;
  streak: number;
  overdue: boolean;
  onCompleted: (result: { pending: boolean }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(e: React.MouseEvent<HTMLButtonElement>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not mark done.");
      if (!data.pending) {
        fireConfetti(e.clientX, e.clientY);
        playSuccessChime();
      }
      onCompleted({ pending: !!data.pending });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark done.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-4 ${
        completed || pending
          ? "border-hairline bg-background opacity-60"
          : overdue
            ? "border-danger bg-surface"
            : "border-hairline bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">
            {pinned && "📌 "}
            {title}
            {!required && (
              <span className="ml-2 text-sm font-normal text-muted">optional</span>
            )}
            {streak > 0 && (
              <span className="ml-2 text-sm font-semibold text-accent">
                🔥 {streak}
              </span>
            )}
            {overdue && (
              <span className="ml-2 text-sm font-semibold text-danger">
                ⏰ Not done yet
              </span>
            )}
          </p>
          {description && <p className="text-sm text-muted">{description}</p>}
          <p className="text-sm font-semibold text-accent">
            {points} pts
            {recurrence === "daily" && " · daily"}
            {recurrence === "weekly-any" && " · weekly"}
            {recurrence === "weekly" && weekdays && ` · ${weekdaysLabel(weekdays)}`}
          </p>
        </div>
        {completed ? (
          <span className="shrink-0 text-sm font-semibold text-success">✓ Done</span>
        ) : pending ? (
          <span className="shrink-0 text-sm font-semibold text-muted">⏳ Pending approval</span>
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
