import { NextRequest, NextResponse } from "next/server";
import { adminAuth, db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { uid } = await params;

    const caregiversSnap = await db
      .collection("users")
      .where("familyId", "==", user.familyId)
      .where("role", "==", "caregiver")
      .get();

    if (!caregiversSnap.docs.some((doc) => doc.id === uid)) {
      return NextResponse.json({ error: "Caregiver not found." }, { status: 404 });
    }

    await db.collection("users").doc(uid).delete();
    await adminAuth.deleteUser(uid).catch(() => {
      // already gone from Auth is fine
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/caregivers:DELETE]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
