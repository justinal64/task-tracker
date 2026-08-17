"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function ParentNav({ displayName }: { displayName: string }) {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-hairline bg-surface px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link href="/parent" className="font-semibold tracking-tight">
          Points Tracker
        </Link>
        <Link href="/parent/kids" className="text-sm text-muted hover:text-foreground">
          Kids
        </Link>
        <Link href="/parent/tasks" className="text-sm text-muted hover:text-foreground">
          Tasks
        </Link>
        <Link href="/parent/rewards" className="text-sm text-muted hover:text-foreground">
          Rewards
        </Link>
        <Link href="/parent/approvals" className="text-sm text-muted hover:text-foreground">
          Approvals
        </Link>
        <Link href="/parent/activity" className="text-sm text-muted hover:text-foreground">
          Activity
        </Link>
        <Link href="/parent/settings" className="text-sm text-muted hover:text-foreground">
          Settings
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">{displayName}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-muted hover:text-foreground"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
