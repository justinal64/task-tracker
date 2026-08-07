"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Child } from "@/lib/types";

const AVATAR_OPTIONS = ["🦁", "🐯", "🐸", "🦊", "🐼", "🐨", "🦄", "🐶", "🐱", "🐵", "🦖", "🐙"];

export default function KidDetailForm({
  childId,
  child,
}: {
  childId: string;
  child: Child;
}) {
  const router = useRouter();
  const [name, setName] = useState(child.name);
  const [avatarEmoji, setAvatarEmoji] = useState(child.avatarEmoji);
  const [pin, setPin] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/family/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarEmoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      setMessage("Saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSavingPin(true);
    try {
      const res = await fetch(`/api/family/children/${childId}/reset-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reset PIN.");
      setPin("");
      setMessage("PIN updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset PIN.");
    } finally {
      setSavingPin(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove ${child.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/family/children/${childId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove kid.");
      router.push("/parent/kids");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove kid.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}

      <form
        onSubmit={handleProfileSubmit}
        className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-5"
      >
        <h2 className="font-medium">Profile</h2>
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={savingProfile}
          className="self-start rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {savingProfile ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form
        onSubmit={handlePinSubmit}
        className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-5"
      >
        <h2 className="font-medium">Reset PIN</h2>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          placeholder="New 4-digit PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          required
          className="rounded-lg border border-hairline bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={savingPin}
          className="self-start rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {savingPin ? "Saving…" : "Set PIN"}
        </button>
      </form>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="self-start rounded-lg border border-danger px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
      >
        {deleting ? "Removing…" : "Remove kid"}
      </button>
    </div>
  );
}
