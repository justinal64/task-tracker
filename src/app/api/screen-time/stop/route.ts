import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/session";

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
    if (activeSnap.empty) {
      return NextResponse.json({ error: "Not currently tracking screen time." }, { status: 409 });
    }

    const sessionDoc = activeSnap.docs[0];
    const startedAt = (sessionDoc.data().startedAt as number) ?? Date.now();
    const endedAt = Date.now();
    const durationMinutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));

    await sessionDoc.ref.update({ endedAt, durationMinutes });

    return NextResponse.json({ durationMinutes });
  } catch (err) {
    console.error("[screen-time/stop]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
