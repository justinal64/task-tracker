"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WEEKDAY_LABELS } from "@/lib/recurrence";
import type { Recurrence, Task } from "@/lib/types";

interface ChildOption {
  id: string;
  name: string;
  avatarEmoji: string;
}

export default function TaskEditForm({
  taskId,
  task,
  kids,
}: {
  taskId: string;
  task: Task;
  kids: ChildOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [points, setPoints] = useState(String(task.points));
  const [assignedTo, setAssignedTo] = useState(task.assignedTo);
  const [recurrence, setRecurrence] = useState<Recurrence>(task.recurrence);
  const [weekdays, setWeekdays] = useState<number[]>(task.weekdays ?? []);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/family/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          points: Number(points),
          assignedTo,
          recurrence,
          weekdays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      setMessage("Saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/family/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete.");
      router.push("/parent/tasks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-5"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="flex gap-3">
        <input
          type="number"
          min={1}
          step={1}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          required
          className="w-24 rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          required
          className="flex-1 rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {kids.map((child) => (
            <option key={child.id} value={child.id}>
              {child.avatarEmoji} {child.name}
            </option>
          ))}
        </select>
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as Recurrence)}
          className="rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="once">One-off</option>
          <option value="daily">Daily</option>
          <option value="weekly">Specific days</option>
        </select>
      </div>
      {recurrence === "weekly" && (
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleWeekday(day)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                weekdays.includes(day) ? "border-accent bg-accent/10 text-accent" : "border-hairline"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-danger px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete task"}
        </button>
      </div>
    </form>
  );
}
