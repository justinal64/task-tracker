"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WEEKDAY_LABELS } from "@/lib/recurrence";
import type { Recurrence } from "@/lib/types";

interface ChildOption {
  id: string;
  name: string;
  avatarEmoji: string;
}

export default function TaskForm({ kids }: { kids: ChildOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("5");
  const [assignedTo, setAssignedTo] = useState("any");
  const [recurrence, setRecurrence] = useState<Recurrence>("once");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/family/tasks", {
        method: "POST",
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
      if (!res.ok) throw new Error(data.error ?? "Could not add task.");

      setTitle("");
      setDescription("");
      setPoints("5");
      setAssignedTo("any");
      setRecurrence("once");
      setWeekdays([]);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add task.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        + Add a task
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-5"
    >
      <input
        type="text"
        placeholder="Title, e.g. Make bed"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <textarea
        placeholder="Description (optional)"
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
          placeholder="Points"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          required
          className="w-24 rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="flex-1 rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="any">Any kid</option>
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
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Adding…" : "Add task"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-hairline px-4 py-2.5 text-sm font-semibold hover:bg-background"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
