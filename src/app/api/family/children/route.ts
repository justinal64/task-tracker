import { NextRequest, NextResponse } from "next/server";
import { adminAuth, db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";
import { hashPin, isValidPin } from "@/lib/pin";

export async function POST(req: NextRequest) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { name, avatarEmoji, pin } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!avatarEmoji || typeof avatarEmoji !== "string") {
      return NextResponse.json({ error: "Avatar is required." }, { status: 400 });
    }
    if (!isValidPin(pin ?? "")) {
      return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
    }

    // No email/password: the child signs in only via PIN -> custom token, but
    // still gets a first-class, distinct Firebase Auth identity.
    const authUser = await adminAuth.createUser({ displayName: name.trim() });
    const childId = authUser.uid;
    const now = Date.now();

    const childRef = db
      .collection("families")
      .doc(user.familyId)
      .collection("children")
      .doc(childId);

    await Promise.all([
      childRef.set({ name: name.trim(), avatarEmoji, pointsBalance: 0, createdAt: now }),
      childRef.collection("private").doc("credentials").set({
        pinHash: await hashPin(pin),
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: now,
      }),
      db.collection("users").doc(childId).set({
        role: "child",
        familyId: user.familyId,
        childId,
        displayName: name.trim(),
      }),
    ]);

    return NextResponse.json({ id: childId, name: name.trim(), avatarEmoji, pointsBalance: 0 });
  } catch (err) {
    console.error("[family/children:POST]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
