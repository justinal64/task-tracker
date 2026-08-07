"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActivityType } from "@/lib/types";

interface ActivityRow {
  id: string;
  childName: string;
  childAvatar: string;
  points: number;
  label: string;
  createdAt: number;
  type: ActivityType;
  voided: boolean;
}

export default function ActivityList({ entries }: { entries: ActivityRow[] }) {
  const router = useRouter();
  const [busyIds, setBusyIds] = useState(new Set<string>());

  async function handleVoid(entryId: string, label: string) {
    if (!confirm(`Undo "${label}"? This reverses the points and, for a one-off task, lets it be done again.`)) {
      return;
    }
    setBusyIds((prev) => new Set(prev).add(entryId));
    try {
      const res = await fetch(`/api/family/activity/${entryId}/void`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Could not undo this.");
        return;
      }
      router.refresh();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  }

  if (entries.length === 0) {
    return <p className="text-muted">No activity yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const canVoid = (entry.type === "completion" || entry.type === "redemption") && !entry.voided;
        return (
          <div
            key={entry.id}
            className={`flex items-center justify-between rounded-lg border border-hairline bg-surface p-4 ${
              entry.voided ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{entry.childAvatar}</span>
              <div>
                <p className={`font-medium ${entry.voided ? "line-through" : ""}`}>
                  {entry.label}
                  {entry.voided && <span className="ml-2 text-xs text-muted">(undone)</span>}
                </p>
                <p className="text-sm text-muted">
                  {entry.childName} · {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`font-semibold ${
                  entry.voided ? "text-muted line-through" : entry.points >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {entry.points >= 0 ? "+" : ""}
                {entry.points}
              </span>
              {canVoid && (
                <button
                  onClick={() => handleVoid(entry.id, entry.label)}
                  disabled={busyIds.has(entry.id)}
                  className="text-sm text-danger hover:opacity-80 disabled:opacity-60"
                >
                  Undo
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
