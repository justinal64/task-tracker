import { NextRequest, NextResponse } from "next/server";
import { adminAuth, db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { childId } = await params;

    const { name, avatarEmoji, centsPerPoint } = await req.json();
    const updates: Record<string, string | number | null> = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof avatarEmoji === "string" && avatarEmoji) updates.avatarEmoji = avatarEmoji;
    if (centsPerPoint === null) {
      updates.centsPerPoint = null;
    } else if (centsPerPoint !== undefined) {
      const rate = Number(centsPerPoint);
      if (!Number.isFinite(rate) || rate < 0) {
        return NextResponse.json({ error: "Rate must be zero or positive." }, { status: 400 });
      }
      updates.centsPerPoint = rate;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const childRef = db
      .collection("families")
      .doc(user.familyId)
      .collection("children")
      .doc(childId);

    await childRef.update(updates);
    if (updates.name) {
      await db.collection("users").doc(childId).update({ displayName: updates.name });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/children:PATCH]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { childId } = await params;

    const childRef = db
      .collection("families")
      .doc(user.familyId)
      .collection("children")
      .doc(childId);

    await childRef.collection("private").doc("credentials").delete();
    await childRef.delete();
    await db.collection("users").doc(childId).delete();
    await adminAuth.deleteUser(childId).catch(() => {
      // already gone from Auth is fine
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/children:DELETE]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
