"use client";

import { useState } from "react";

export default function RewardCard({
  rewardId,
  title,
  description,
  cost,
  redeemed,
  affordable,
  onRedeemed,
}: {
  rewardId: string;
  title: string;
  description: string | null;
  cost: number;
  redeemed: boolean;
  affordable: boolean;
  onRedeemed: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRedeem() {
    if (redeemed || !affordable || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rewards/${rewardId}/redeem`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not redeem.");
      onRedeemed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem.");
    } finally {
      setLoading(false);
    }
  }

  const disabled = redeemed || !affordable || loading;

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-4 ${
        redeemed ? "border-hairline bg-background opacity-60" : "border-hairline bg-surface"
      }`}
    >
      <button
        type="button"
        onClick={handleRedeem}
        disabled={disabled}
        className="flex w-full items-center gap-4 text-left disabled:cursor-not-allowed"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-lg ${
            redeemed
              ? "border-success bg-success text-white"
              : affordable
                ? "border-accent"
                : "border-hairline"
          }`}
        >
          {redeemed && "✓"}
        </span>
        <span className="flex-1">
          <p className="font-medium">{title}</p>
          {description && <p className="text-sm text-muted">{description}</p>}
          <p className="text-sm font-semibold text-accent">{cost} pts</p>
        </span>
        {!redeemed && !affordable && (
          <span className="shrink-0 text-sm text-muted">Not enough points</span>
        )}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
