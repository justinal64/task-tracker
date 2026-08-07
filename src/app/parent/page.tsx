import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { Child } from "@/lib/types";
import ParentNotifications from "@/components/ParentNotifications";

export default async function ParentDashboard() {
  const user = await getSessionUser();
  const childrenSnap = await db
    .collection("families")
    .doc(user!.familyId)
    .collection("children")
    .get();

  const children = childrenSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Child),
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>

      <ParentNotifications familyId={user!.familyId} kids={children} />

      {children.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-surface p-6 text-center text-muted">
          No kids added yet.{" "}
          <Link href="/parent/kids" className="text-accent hover:text-accent-hover">
            Add your first kid →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{child.avatarEmoji}</span>
                <span className="font-medium">{child.name}</span>
              </div>
              <span className="text-lg font-semibold text-accent">
                {child.pointsBalance} pts
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/parent/tasks"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Manage tasks
        </Link>
        <Link
          href="/parent/kids"
          className="rounded-lg border border-hairline bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-background"
        >
          Manage kids
        </Link>
        <Link
          href="/parent/rewards"
          className="rounded-lg border border-hairline bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-background"
        >
          Manage rewards
        </Link>
      </div>
    </div>
  );
}
