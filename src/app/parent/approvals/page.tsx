import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { ActivityEntry, Child, PrivilegeRequest } from "@/lib/types";
import ApprovalRow from "@/components/ApprovalRow";
import RequestApprovalRow from "@/components/RequestApprovalRow";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  const familyRef = db.collection("families").doc(user!.familyId);

  const [entriesSnap, requestsSnap, childrenSnap] = await Promise.all([
    familyRef
      .collection("activity")
      .where("type", "==", "completion")
      .where("approvalStatus", "==", "pending")
      .orderBy("createdAt", "desc")
      .get(),
    familyRef
      .collection("requests")
      .where("status", "==", "pending")
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

  const requests = requestsSnap.docs.map((doc) => {
    const request = doc.data() as PrivilegeRequest;
    const child = childById.get(request.childId);
    return {
      id: doc.id,
      childName: child?.name ?? "Unknown",
      childAvatar: child?.avatarEmoji ?? "❓",
      title: request.title,
      description: request.description,
      pointCost: request.pointCost,
      createdAt: request.createdAt,
    };
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Approvals</h1>

      {entries.length === 0 && requests.length === 0 ? (
        <p className="text-muted">Nothing waiting on you — nice.</p>
      ) : (
        <>
          {entries.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium">Task completions</h2>
              {entries.map((entry) => (
                <ApprovalRow key={entry.id} entryId={entry.id} {...entry} />
              ))}
            </div>
          )}
          {requests.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium">Privilege requests</h2>
              {requests.map((request) => (
                <RequestApprovalRow key={request.id} requestId={request.id} {...request} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
