import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { ActivityEntry, Child } from "@/lib/types";
import ActivityFilter from "@/components/ActivityFilter";
import ActivityList from "@/components/ActivityList";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const user = await getSessionUser();
  const { child: selectedChildId } = await searchParams;
  const familyRef = db.collection("families").doc(user!.familyId);

  const [childrenSnap, activitySnap] = await Promise.all([
    familyRef.collection("children").get(),
    (selectedChildId
      ? familyRef.collection("activity").where("childId", "==", selectedChildId)
      : familyRef.collection("activity")
    )
      .orderBy("createdAt", "desc")
      .limit(100)
      .get(),
  ]);

  const children = childrenSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Child),
  }));
  const childById = new Map(children.map((c) => [c.id, c]));

  const entries = activitySnap.docs.map((doc) => {
    const entry = doc.data() as ActivityEntry;
    const child = childById.get(entry.childId);
    const label =
      entry.type === "completion"
        ? (entry.taskTitle ?? "Task completed")
        : entry.type === "redemption"
          ? (entry.rewardTitle ?? "Reward redeemed")
          : entry.type === "request"
            ? (entry.reason ?? "Request approved")
            : (entry.reason ?? "Manual adjustment");
    return {
      id: doc.id,
      childName: child?.name ?? "Unknown",
      childAvatar: child?.avatarEmoji ?? "❓",
      points: entry.points,
      label,
      createdAt: entry.createdAt,
      type: entry.type,
      voided: entry.voided,
    };
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
        <ActivityFilter kids={children} selected={selectedChildId ?? "all"} />
      </div>
      <ActivityList entries={entries} />
    </div>
  );
}
