"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import type { ActivityEntry } from "@/lib/types";

interface ChildOption {
  id: string;
  name: string;
  avatarEmoji: string;
}

interface RedemptionEntry extends ActivityEntry {
  id: string;
}

export default function ParentNotifications({
  familyId,
  kids,
}: {
  familyId: string;
  kids: ChildOption[];
}) {
  const [entries, setEntries] = useState<RedemptionEntry[]>([]);
  const [busyIds, setBusyIds] = useState(new Set<string>());
  const childById = new Map(kids.map((c) => [c.id, c]));

  useEffect(() => {
    const q = query(
      collection(db, "families", familyId, "activity"),
      where("type", "==", "redemption"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const redemptions = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as ActivityEntry) }))
        .filter((entry) => !entry.acknowledged);
      setEntries(redemptions);
    });
    return unsub;
  }, [familyId]);

  async function handleAcknowledge(entryId: string) {
    setBusyIds((prev) => new Set(prev).add(entryId));
    try {
      await fetch(`/api/family/activity/${entryId}/acknowledge`, { method: "POST" });
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  }

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent/5 p-5">
      <h2 className="font-medium">🔔 Reward requests</h2>
      {entries.map((entry) => {
        const child = childById.get(entry.childId);
        return (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{child?.avatarEmoji ?? "❓"}</span>
              <div>
                <p className="font-medium">
                  {child?.name ?? "Unknown"} chose <em>{entry.rewardTitle}</em>
                </p>
                <p className="text-sm text-muted">
                  {-entry.points} pts · {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAcknowledge(entry.id)}
              disabled={busyIds.has(entry.id)}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              Got it
            </button>
          </div>
        );
      })}
    </div>
  );
}
