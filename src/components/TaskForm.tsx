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
  const [assignedTo, setAssignedTo] = useState<string[]>(kids[0] ? [kids[0].id] : []);
  const [recurrence, setRecurrence] = useState<Recurrence>("once");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [optional, setOptional] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function toggleChild(id: string) {
    setAssignedTo((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
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
          requiresApproval,
          required: !optional,
          pinned,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add task.");

      setTitle("");
      setDescription("");
      setPoints("5");
      setAssignedTo(kids[0] ? [kids[0].id] : []);
      setRecurrence("once");
      setWeekdays([]);
      setRequiresApproval(false);
      setOptional(false);
      setPinned(false);
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
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as Recurrence)}
          className="rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="once">One-off</option>
          <option value="daily">Daily</option>
          <option value="weekly-any">Weekly (any day)</option>
          <option value="weekly">Specific days</option>
        </select>
      </div>
      {kids.length === 0 ? (
        <p className="text-sm text-muted">Add a kid first.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {kids.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => toggleChild(child.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                assignedTo.includes(child.id) ? "border-accent bg-accent/10 text-accent" : "border-hairline"
              }`}
            >
              {child.avatarEmoji} {child.name}
            </button>
          ))}
        </div>
      )}
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
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={requiresApproval}
          onChange={(e) => setRequiresApproval(e.target.checked)}
        />
        Requires parent approval before it counts
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
        Optional (bonus, not required)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        Pin to top of the list
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || kids.length === 0 || assignedTo.length === 0}
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
