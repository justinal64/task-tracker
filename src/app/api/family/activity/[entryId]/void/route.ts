import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { requireApproverSession } from "@/lib/session";
import type { ActivityEntry, Child, Reward, Task } from "@/lib/types";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Reverses a mistaken task completion or reward redemption: refunds/reclaims
 * the points and, for a one-off task, reopens it so it can be done again.
 * The entry stays in the ledger marked voided rather than being deleted, so
 * there's still a record of what happened.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const user = await requireApproverSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { entryId } = await params;

    const familyRef = db.collection("families").doc(user.familyId);
    const entryRef = familyRef.collection("activity").doc(entryId);

    const newBalance = await db.runTransaction(async (tx) => {
      const entrySnap = await tx.get(entryRef);
      if (!entrySnap.exists) throw new HttpError(404, "Not found.");
      const entry = entrySnap.data() as ActivityEntry;

      if (entry.type !== "completion" && entry.type !== "redemption") {
        throw new HttpError(400, "Only completions and redemptions can be voided.");
      }
      if (entry.voided) throw new HttpError(409, "Already voided.");

      const childRef = familyRef.collection("children").doc(entry.childId);
      const childSnap = await tx.get(childRef);
      if (!childSnap.exists) throw new HttpError(404, "Child not found.");

      let reopenTaskRef = null;
      if (entry.type === "completion" && entry.taskId) {
        const taskRef = familyRef.collection("tasks").doc(entry.taskId);
        const taskSnap = await tx.get(taskRef);
        if (taskSnap.exists && (taskSnap.data() as Task).recurrence === "once") {
          reopenTaskRef = taskRef;
        }
      }

      let restockRewardRef = null;
      if (entry.type === "redemption" && entry.rewardId) {
        const rewardRef = familyRef.collection("rewards").doc(entry.rewardId);
        const rewardSnap = await tx.get(rewardRef);
        if (rewardSnap.exists && (rewardSnap.data() as Reward).stock !== null) {
          restockRewardRef = rewardRef;
        }
      }

      tx.update(entryRef, { voided: true });
      tx.update(childRef, { pointsBalance: FieldValue.increment(-entry.points) });
      if (reopenTaskRef) {
        tx.update(reopenTaskRef, { active: true });
      }
      if (restockRewardRef) {
        tx.update(restockRewardRef, { stock: FieldValue.increment(1) });
      }

      const child = childSnap.data() as Child;
      return child.pointsBalance - entry.points;
    });

    return NextResponse.json({ pointsBalance: newBalance });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[family/activity/void]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
