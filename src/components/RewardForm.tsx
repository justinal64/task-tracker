"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RewardForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("20");
  const [stock, setStock] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/family/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          cost: Number(cost),
          stock: stock === "" ? null : Number(stock),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add reward.");

      setTitle("");
      setDescription("");
      setCost("20");
      setStock("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add reward.");
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
        + Add a reward
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
        placeholder="Title, e.g. Extra 30 min screen time"
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
          placeholder="Cost in points"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          required
          className="w-32 rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="number"
          min={0}
          step={1}
          placeholder="Quantity (blank = unlimited)"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="flex-1 rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Adding…" : "Add reward"}
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
