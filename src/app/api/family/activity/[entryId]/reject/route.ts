import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";
import type { ActivityEntry } from "@/lib/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { entryId } = await params;

    const familyRef = db.collection("families").doc(user.familyId);
    const entryRef = familyRef.collection("activity").doc(entryId);
    const entrySnap = await entryRef.get();
    if (!entrySnap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const entry = entrySnap.data() as ActivityEntry;
    if (entry.type !== "completion" || entry.approvalStatus !== "pending") {
      return NextResponse.json({ error: "This entry isn't awaiting approval." }, { status: 400 });
    }

    // Mark voided so the completion slot frees up and the kid can redo the task.
    await entryRef.update({ approvalStatus: "rejected", voided: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[activity/reject]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
