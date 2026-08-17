import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { PrivilegeRequest } from "@/lib/types";
import RequestForm from "@/components/RequestForm";

export default async function KidRequestsPage() {
  const user = await getSessionUser();
  const childId = user!.childId!;
  const familyRef = db.collection("families").doc(user!.familyId);

  const requestsSnap = await familyRef
    .collection("requests")
    .where("childId", "==", childId)
    .orderBy("createdAt", "desc")
    .get();

  const requests = requestsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as PrivilegeRequest),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Requests</h1>
      <RequestForm />
      <div className="flex flex-col gap-3">
        {requests.length === 0 && <p className="text-muted">No requests yet.</p>}
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-4">
            <div>
              <p className="font-medium">{request.title}</p>
              {request.description && <p className="text-sm text-muted">{request.description}</p>}
              {request.pointCost !== null && (
                <p className="text-sm font-semibold text-accent">{request.pointCost} pts</p>
              )}
            </div>
            <span
              className={`shrink-0 text-sm font-semibold ${
                request.status === "approved"
                  ? "text-success"
                  : request.status === "rejected"
                    ? "text-danger"
                    : "text-muted"
              }`}
            >
              {request.status === "approved" ? "✓ Approved" : request.status === "rejected" ? "✗ Declined" : "⏳ Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
