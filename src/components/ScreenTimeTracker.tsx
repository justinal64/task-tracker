"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ScreenTimeTracker({
  activeStartedAt,
  completedMinutesToday,
}: {
  activeStartedAt: number | null;
  completedMinutesToday: number;
}) {
  const router = useRouter();
  const [active, setActive] = useState(activeStartedAt !== null);
  const [startedAt, setStartedAt] = useState(activeStartedAt);
  const [elapsedSeconds, setElapsedSeconds] = useState(
    startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !startedAt) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [active, startedAt]);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/screen-time/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start.");
      setStartedAt(Date.now());
      setElapsedSeconds(0);
      setActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/screen-time/stop", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not stop.");
      setActive(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop.");
    } finally {
      setLoading(false);
    }
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedSecondsDisplay = elapsedSeconds % 60;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-5">
      <div>
        <p className="text-sm text-muted">Today so far</p>
        <p className="text-2xl font-bold text-accent">
          {formatMinutes(completedMinutesToday + (active ? elapsedMinutes : 0))}
        </p>
      </div>
      {active && (
        <p className="text-sm text-muted">
          Current session: {elapsedMinutes}m {elapsedSecondsDisplay}s
        </p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      {active ? (
        <button
          onClick={handleStop}
          disabled={loading}
          className="self-start rounded-full bg-danger px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "…" : "Stop"}
        </button>
      ) : (
        <button
          onClick={handleStart}
          disabled={loading}
          className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "…" : "Start screen time"}
        </button>
      )}
    </div>
  );
}
