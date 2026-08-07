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

    if (uid === user.uid) {
      return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
    }

    const parentsSnap = await db
      .collection("users")
      .where("familyId", "==", user.familyId)
      .where("role", "==", "parent")
      .get();

    if (!parentsSnap.docs.some((doc) => doc.id === uid)) {
      return NextResponse.json({ error: "Parent not found." }, { status: 404 });
    }
    if (parentsSnap.size <= 1) {
      return NextResponse.json({ error: "Can't remove the last parent." }, { status: 400 });
    }

    await db.collection("users").doc(uid).delete();
    await adminAuth.deleteUser(uid).catch(() => {
      // already gone from Auth is fine
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/parents:DELETE]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
