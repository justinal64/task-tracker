"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ParentRow({
  uid,
  name,
  email,
  isSelf,
  canRemove,
}: {
  uid: string;
  name: string;
  email: string;
  isSelf: boolean;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRemove() {
    if (!confirm(`Remove ${name}'s access?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/family/parents/${uid}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Could not remove parent.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-4">
      <div>
        <p className="font-medium">
          {name} {isSelf && <span className="text-sm text-muted">(you)</span>}
        </p>
        <p className="text-sm text-muted">{email}</p>
      </div>
      {canRemove && !isSelf && (
        <button
          onClick={handleRemove}
          disabled={busy}
          className="text-sm text-danger hover:opacity-80 disabled:opacity-60"
        >
          Remove
        </button>
      )}
    </div>
  );
}
