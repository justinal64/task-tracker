import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/session";
import type { Child, Reward } from "@/lib/types";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "child") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { rewardId } = await params;
    const childId = user.childId!;

    const familyRef = db.collection("families").doc(user.familyId);
    const rewardRef = familyRef.collection("rewards").doc(rewardId);
    const childRef = familyRef.collection("children").doc(childId);
    // Deterministic id: a reward can only ever be redeemed once per child,
    // same idempotency trick used for one-off task completions.
    const activityRef = familyRef.collection("activity").doc(`redemption__${rewardId}__${childId}`);

    const newBalance = await db.runTransaction(async (tx) => {
      const [rewardSnap, childSnap, activitySnap] = await Promise.all([
        tx.get(rewardRef),
        tx.get(childRef),
        tx.get(activityRef),
      ]);

      if (!rewardSnap.exists) throw new HttpError(404, "Reward not found.");
      if (!childSnap.exists) throw new HttpError(404, "Child not found.");
      // A voided redemption frees the slot back up, same as a voided completion.
      if (activitySnap.exists && !activitySnap.data()?.voided) {
        throw new HttpError(409, "Already redeemed.");
      }

      const reward = rewardSnap.data() as Reward;
      const child = childSnap.data() as Child;

      if (!reward.active) throw new HttpError(409, "This reward is no longer available.");
      if (reward.stock !== null && reward.stock <= 0) {
        throw new HttpError(409, "Out of stock.");
      }
      if (child.pointsBalance < reward.cost) {
        throw new HttpError(409, "Not enough points.");
      }

      tx.set(activityRef, {
        type: "redemption",
        childId,
        points: -reward.cost,
        taskId: null,
        taskTitle: null,
        rewardId,
        rewardTitle: reward.title,
        requestId: null,
        dateKey: null,
        reason: null,
        acknowledged: false,
        voided: false,
        approvalStatus: null,
        createdAt: Date.now(),
        createdBy: user.uid,
      });
      tx.update(childRef, { pointsBalance: FieldValue.increment(-reward.cost) });
      if (reward.stock !== null) {
        tx.update(rewardRef, { stock: FieldValue.increment(-1) });
      }

      return child.pointsBalance - reward.cost;
    });

    return NextResponse.json({ pointsBalance: newBalance });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[rewards/redeem]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
