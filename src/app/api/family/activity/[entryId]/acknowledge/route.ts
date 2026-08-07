import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { entryId } = await params;

    await db
      .collection("families")
      .doc(user.familyId)
      .collection("activity")
      .doc(entryId)
      .update({ acknowledged: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/activity/acknowledge]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
