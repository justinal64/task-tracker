"use client";

import { useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { playSuccessChime } from "@/lib/sound";

export default function RewardCard({
  rewardId,
  title,
  description,
  cost,
  stock,
  redeemed,
  affordable,
  onRedeemed,
}: {
  rewardId: string;
  title: string;
  description: string | null;
  cost: number;
  stock: number | null;
  redeemed: boolean;
  affordable: boolean;
  onRedeemed: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outOfStock = stock !== null && stock <= 0;

  async function handleRedeem(e: React.MouseEvent<HTMLButtonElement>) {
    if (redeemed || !affordable || outOfStock || loading) return;
    const { clientX, clientY } = e;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rewards/${rewardId}/redeem`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not redeem.");
      fireConfetti(clientX, clientY);
      playSuccessChime();
      onRedeemed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem.");
    } finally {
      setLoading(false);
    }
  }

  const disabled = redeemed || !affordable || outOfStock || loading;

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
          <p className="text-sm font-semibold text-accent">
            {cost} pts
            {stock !== null && !redeemed && <span className="text-muted"> · {stock} left</span>}
          </p>
        </span>
        {!redeemed && outOfStock && (
          <span className="shrink-0 text-sm text-danger">Out of stock</span>
        )}
        {!redeemed && !outOfStock && !affordable && (
          <span className="shrink-0 text-sm text-muted">Not enough points</span>
        )}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
