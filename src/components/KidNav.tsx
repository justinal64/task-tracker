"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function KidNav({ displayName }: { displayName: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/kid-login");
    router.refresh();
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-hairline bg-surface px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-semibold tracking-tight">Hi, {displayName}!</span>
        <Link
          href="/kid"
          className={`text-sm ${pathname === "/kid" ? "text-accent" : "text-muted hover:text-foreground"}`}
        >
          Tasks
        </Link>
        <Link
          href="/kid/rewards"
          className={`text-sm ${pathname === "/kid/rewards" ? "text-accent" : "text-muted hover:text-foreground"}`}
        >
          Rewards
        </Link>
        <Link
          href="/kid/requests"
          className={`text-sm ${pathname === "/kid/requests" ? "text-accent" : "text-muted hover:text-foreground"}`}
        >
          Requests
        </Link>
        <Link
          href="/kid/screen-time"
          className={`text-sm ${pathname === "/kid/screen-time" ? "text-accent" : "text-muted hover:text-foreground"}`}
        >
          Screen Time
        </Link>
      </div>
      <button onClick={handleLogout} className="text-sm text-muted hover:text-foreground">
        Log out
      </button>
    </nav>
  );
}
