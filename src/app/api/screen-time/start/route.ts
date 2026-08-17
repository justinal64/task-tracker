import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/session";
import { dateKey } from "@/lib/pin";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    let childId: string;
    if (user.role === "child") {
      childId = user.childId!;
    } else {
      const body = await req.json().catch(() => ({}));
      if (!body.childId || typeof body.childId !== "string") {
        return NextResponse.json({ error: "childId is required." }, { status: 400 });
      }
      childId = body.childId;
    }

    const familyRef = db.collection("families").doc(user.familyId);

    const activeSnap = await familyRef
      .collection("screenTimeSessions")
      .where("childId", "==", childId)
      .where("endedAt", "==", null)
      .limit(1)
      .get();
    if (!activeSnap.empty) {
      return NextResponse.json({ error: "Already tracking screen time." }, { status: 409 });
    }

    const ref = await familyRef.collection("screenTimeSessions").add({
      childId,
      startedAt: Date.now(),
      endedAt: null,
      durationMinutes: null,
      dateKey: dateKey(),
      createdBy: user.uid,
    });

    return NextResponse.json({ id: ref.id });
  } catch (err) {
    console.error("[screen-time/start]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
