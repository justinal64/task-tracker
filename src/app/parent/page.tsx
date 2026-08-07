import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { ActivityEntry, Child } from "@/lib/types";
import ParentNotifications from "@/components/ParentNotifications";
import PointsHistoryChart from "@/components/PointsHistoryChart";
import { buildPointsHistory, getHistoryWindowStartMs } from "@/lib/pointsHistory";

const HISTORY_WINDOW_DAYS = 30;

export default async function ParentDashboard() {
  const user = await getSessionUser();
  const familyRef = db.collection("families").doc(user!.familyId);

  const [childrenSnap, activitySnap] = await Promise.all([
    familyRef.collection("children").get(),
    familyRef
      .collection("activity")
      .where("createdAt", ">=", getHistoryWindowStartMs(HISTORY_WINDOW_DAYS))
      .get(),
  ]);

  const children = childrenSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Child),
  }));

  const recentEntries = activitySnap.docs.map((doc) => doc.data() as ActivityEntry);
  const { days, series } = buildPointsHistory(children, recentEntries, HISTORY_WINDOW_DAYS);

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

      {children.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="mb-3 font-medium">Points over the last {HISTORY_WINDOW_DAYS} days</h2>
          <PointsHistoryChart days={days} series={series} />
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
