"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Child, Reward } from "@/lib/types";

export default function RewardRow({
  rewardId,
  reward,
  childrenById,
}: {
  rewardId: string;
  reward: Reward;
  childrenById?: (Child & { id: string })[];
}) {
  const visibilityLabel = Array.isArray(reward.assignedTo)
    ? childrenById
        ?.filter((c) => (reward.assignedTo as string[]).includes(c.id))
        .map((c) => c.name)
        .join(", ") ?? `${reward.assignedTo.length} kid${reward.assignedTo.length === 1 ? "" : "s"}`
    : "All kids";
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"toggle" | "delete" | "restock" | null>(null);
  const busy = pendingAction !== null;

  async function toggleActive() {
    setPendingAction("toggle");
    try {
      await fetch(`/api/family/rewards/${rewardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !reward.active }),
      });
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${reward.title}"?`)) return;
    setPendingAction("delete");
    try {
      await fetch(`/api/family/rewards/${rewardId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRestock() {
    setPendingAction("restock");
    try {
      await fetch(`/api/family/rewards/${rewardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: (reward.stock ?? 0) + 1 }),
      });
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-4">
      <div>
        <p className={`font-medium ${!reward.active ? "text-muted line-through" : ""}`}>
          {reward.title}
        </p>
        {reward.description && <p className="text-sm text-muted">{reward.description}</p>}
        <p className="text-sm font-semibold text-accent">
          {reward.cost} pts
          {reward.stock !== null && (
            <span className={reward.stock <= 0 ? "text-danger" : "text-muted"}>
              {" "}
              · {reward.stock} left
            </span>
          )}
        </p>
        <p className="text-sm text-muted">{visibilityLabel}</p>
      </div>
      <div className="flex items-center gap-3">
        {reward.stock !== null && (
          <button
            onClick={handleRestock}
            disabled={busy}
            className="text-sm text-muted hover:text-foreground disabled:opacity-60"
          >
            {pendingAction === "restock" ? "…" : "+1 stock"}
          </button>
        )}
        <button
          onClick={toggleActive}
          disabled={busy}
          className="text-sm text-muted hover:text-foreground disabled:opacity-60"
        >
          {pendingAction === "toggle" ? "…" : reward.active ? "Pause" : "Resume"}
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-sm text-danger hover:opacity-80 disabled:opacity-60"
        >
          {pendingAction === "delete" ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
