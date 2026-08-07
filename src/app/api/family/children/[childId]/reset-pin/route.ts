import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";
import { hashPin, isValidPin } from "@/lib/pin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { childId } = await params;

    const { pin } = await req.json();
    if (!isValidPin(pin ?? "")) {
      return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
    }

    const credRef = db
      .collection("families")
      .doc(user.familyId)
      .collection("children")
      .doc(childId)
      .collection("private")
      .doc("credentials");

    await credRef.set({
      pinHash: await hashPin(pin),
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/children/reset-pin]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
