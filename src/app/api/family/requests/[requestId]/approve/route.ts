import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";
import type { Child, PrivilegeRequest } from "@/lib/types";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { requestId } = await params;

    const familyRef = db.collection("families").doc(user.familyId);
    const requestRef = familyRef.collection("requests").doc(requestId);

    const newBalance = await db.runTransaction(async (tx) => {
      const requestSnap = await tx.get(requestRef);
      if (!requestSnap.exists) throw new HttpError(404, "Not found.");
      const request = requestSnap.data() as PrivilegeRequest;
      if (request.status !== "pending") {
        throw new HttpError(400, "This request isn't awaiting approval.");
      }

      const childRef = familyRef.collection("children").doc(request.childId);
      const childSnap = await tx.get(childRef);
      if (!childSnap.exists) throw new HttpError(404, "Child not found.");
      const child = childSnap.data() as Child;

      const cost = request.pointCost ?? 0;
      if (cost > 0 && child.pointsBalance < cost) {
        throw new HttpError(409, "This child doesn't have enough points.");
      }

      tx.update(requestRef, { status: "approved", resolvedAt: Date.now(), resolvedBy: user.uid });

      if (cost > 0) {
        tx.set(familyRef.collection("activity").doc(), {
          type: "request",
          childId: request.childId,
          points: -cost,
          taskId: null,
          taskTitle: null,
          rewardId: null,
          rewardTitle: null,
          requestId,
          dateKey: null,
          reason: request.title,
          acknowledged: null,
          voided: false,
          approvalStatus: null,
          createdAt: Date.now(),
          createdBy: user.uid,
        });
        tx.update(childRef, { pointsBalance: FieldValue.increment(-cost) });
      }

      return child.pointsBalance - cost;
    });

    return NextResponse.json({ pointsBalance: newBalance });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[requests/approve]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
