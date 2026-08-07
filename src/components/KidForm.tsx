"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AVATAR_OPTIONS = ["🦁", "🐯", "🐸", "🦊", "🐼", "🐨", "🦄", "🐶", "🐱", "🐵", "🦖", "🐙"];

export default function KidForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState(AVATAR_OPTIONS[0]);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/family/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarEmoji, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add kid.");

      setName("");
      setPin("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add kid.");
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
        + Add a kid
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-5"
    >
      <div className="flex flex-wrap gap-2">
        {AVATAR_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setAvatarEmoji(emoji)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-xl ${
              avatarEmoji === emoji ? "border-accent bg-accent/10" : "border-hairline"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        placeholder="4-digit PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        required
        className="rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Adding…" : "Add kid"}
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
