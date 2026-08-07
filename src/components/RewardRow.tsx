"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Reward } from "@/lib/types";

export default function RewardRow({
  rewardId,
  reward,
}: {
  rewardId: string;
  reward: Reward;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      await fetch(`/api/family/rewards/${rewardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !reward.active }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${reward.title}"?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/family/rewards/${rewardId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRestock() {
    setBusy(true);
    try {
      await fetch(`/api/family/rewards/${rewardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: (reward.stock ?? 0) + 1 }),
      });
      router.refresh();
    } finally {
      setBusy(false);
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
      </div>
      <div className="flex items-center gap-3">
        {reward.stock !== null && (
          <button
            onClick={handleRestock}
            disabled={busy}
            className="text-sm text-muted hover:text-foreground disabled:opacity-60"
          >
            +1 stock
          </button>
        )}
        <button
          onClick={toggleActive}
          disabled={busy}
          className="text-sm text-muted hover:text-foreground disabled:opacity-60"
        >
          {reward.active ? "Pause" : "Resume"}
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-sm text-danger hover:opacity-80 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
