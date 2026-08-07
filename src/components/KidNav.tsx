"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function KidNav({ displayName }: { displayName: string }) {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/kid-login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between border-b border-hairline bg-surface px-6 py-4">
      <span className="font-semibold tracking-tight">Hi, {displayName}!</span>
      <button onClick={handleLogout} className="text-sm text-muted hover:text-foreground">
        Log out
      </button>
    </nav>
  );
}
