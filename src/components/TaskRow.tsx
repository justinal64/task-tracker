"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/types";

export default function TaskRow({
  taskId,
  task,
  assigneeLabel,
}: {
  taskId: string;
  task: Task;
  assigneeLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      await fetch(`/api/family/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !task.active }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/family/tasks/${taskId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-4">
      <div>
        <p className={`font-medium ${!task.active ? "text-muted line-through" : ""}`}>
          {task.title}
        </p>
        <p className="text-sm text-muted">
          {assigneeLabel} · {task.points} pts · {task.recurrence === "daily" ? "Daily" : "One-off"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/parent/tasks/${taskId}`} className="text-sm text-accent hover:text-accent-hover">
          Edit
        </Link>
        <button
          onClick={toggleActive}
          disabled={busy}
          className="text-sm text-muted hover:text-foreground disabled:opacity-60"
        >
          {task.active ? "Pause" : "Resume"}
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
