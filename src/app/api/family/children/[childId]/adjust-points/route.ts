import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { childId } = await params;

    const { points, reason } = await req.json();
    const pointsNum = Number(points);
    if (!Number.isInteger(pointsNum) || pointsNum === 0) {
      return NextResponse.json({ error: "Points must be a non-zero whole number." }, { status: 400 });
    }

    const familyRef = db.collection("families").doc(user.familyId);
    const childRef = familyRef.collection("children").doc(childId);

    const childSnap = await childRef.get();
    if (!childSnap.exists) {
      return NextResponse.json({ error: "Child not found." }, { status: 404 });
    }

    await familyRef.collection("activity").add({
      type: "adjustment",
      childId,
      points: pointsNum,
      taskId: null,
      taskTitle: null,
      rewardId: null,
      rewardTitle: null,
      requestId: null,
      dateKey: null,
      reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
      acknowledged: null,
      voided: false,
      approvalStatus: null,
      createdAt: Date.now(),
      createdBy: user.uid,
    });
    await childRef.update({ pointsBalance: FieldValue.increment(pointsNum) });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[adjust-points]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
