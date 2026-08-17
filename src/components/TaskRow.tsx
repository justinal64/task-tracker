"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recurrenceLabel } from "@/lib/recurrence";
import type { Task } from "@/lib/types";

export default function TaskRow({
  taskId,
  task,
  assigneeLabel,
}: {
  taskId: string;
  task: Task;
  assigneeLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

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
          {assigneeLabel && `${assigneeLabel} · `}
          {task.points} pts · {recurrenceLabel(task)}
          {Array.isArray(task.assignedTo) && task.assignedTo.length > 1 && ` · shared with ${task.assignedTo.length - 1} other${task.assignedTo.length > 2 ? "s" : ""}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/parent/tasks/${taskId}`} className="text-sm text-accent hover:text-accent-hover">
          Edit
        </Link>
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
