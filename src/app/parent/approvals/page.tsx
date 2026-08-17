import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { ActivityEntry, Child } from "@/lib/types";
import ApprovalRow from "@/components/ApprovalRow";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  const familyRef = db.collection("families").doc(user!.familyId);

  const [entriesSnap, childrenSnap] = await Promise.all([
    familyRef
      .collection("activity")
      .where("type", "==", "completion")
      .where("approvalStatus", "==", "pending")
      .orderBy("createdAt", "desc")
      .get(),
    familyRef.collection("children").get(),
  ]);

  const childById = new Map(
    childrenSnap.docs.map((doc) => [doc.id, doc.data() as Child])
  );

  const entries = entriesSnap.docs.map((doc) => {
    const entry = doc.data() as ActivityEntry;
    const child = childById.get(entry.childId);
    return {
      id: doc.id,
      childName: child?.name ?? "Unknown",
      childAvatar: child?.avatarEmoji ?? "❓",
      taskTitle: entry.taskTitle ?? "Task",
      points: entry.points,
      createdAt: entry.createdAt,
    };
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Approvals</h1>
      {entries.length === 0 ? (
        <p className="text-muted">Nothing waiting on you — nice.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <ApprovalRow key={entry.id} entryId={entry.id} {...entry} />
          ))}
        </div>
      )}
    </div>
  );
}
