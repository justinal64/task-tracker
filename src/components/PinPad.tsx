"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinPad({ childId }: { childId: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleKey(key: string) {
    if (isPending) return;
    setError(null);

    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "" || pin.length >= PIN_LENGTH) return;

    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      startTransition(async () => {
        try {
          const res = await fetch("/api/auth/child-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ childId, pin: next }),
          });
          const data = await res.json();

          if (!res.ok) {
            setError(data.error ?? "Incorrect PIN.");
            setPin("");
            return;
          }

          const credential = await signInWithCustomToken(auth, data.customToken);
          const idToken = await credential.user.getIdToken();

          const sessionRes = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          if (!sessionRes.ok) throw new Error("Could not start session.");

          router.push("/kid");
          router.refresh();
        } catch {
          setError("Something went wrong. Try again.");
          setPin("");
        }
      });
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3" aria-live="polite">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-accent ${
              i < pin.length ? "bg-accent" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, i) =>
          key === "" ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => handleKey(key)}
              disabled={isPending}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-hairline bg-surface text-xl font-semibold transition-colors hover:bg-background disabled:opacity-60"
            >
              {key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
