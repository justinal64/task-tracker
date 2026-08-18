"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestApprovalRow({
  requestId,
  childName,
  childAvatar,
  title,
  description,
  pointCost,
}: {
  requestId: string;
  childName: string;
  childAvatar: string;
  title: string;
  description: string | null;
  pointCost: number | null;
  createdAt: number;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = pendingAction !== null;

  async function respond(action: "approve" | "reject") {
    setPendingAction(action);
    setError(null);
    try {
      const res = await fetch(`/api/family/requests/${requestId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">
            {childAvatar} {childName} · {title}
          </p>
          {description && <p className="text-sm text-muted">{description}</p>}
          {pointCost !== null && <p className="text-sm text-muted">{pointCost} pts</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => respond("approve")}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {pendingAction === "approve" ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={() => respond("reject")}
            disabled={busy}
            className="rounded-lg border border-danger px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
          >
            {pendingAction === "reject" ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
