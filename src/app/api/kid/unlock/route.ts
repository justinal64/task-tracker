import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/session";
import { isValidPin, verifyPin, MAX_FAILED_ATTEMPTS, LOCKOUT_MS } from "@/lib/pin";
import type { ChildCredentials } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "child" || !user.childId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { pin } = await req.json();
    if (!isValidPin(pin ?? "")) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 400 });
    }

    const childRef = db
      .collection("families")
      .doc(user.familyId)
      .collection("children")
      .doc(user.childId);
    const credRef = childRef.collection("private").doc("credentials");

    const credSnap = await credRef.get();
    if (!credSnap.exists) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }
    const creds = credSnap.data() as ChildCredentials;

    if (creds.lockedUntil && creds.lockedUntil > Date.now()) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in a few minutes." },
        { status: 429 }
      );
    }

    const ok = await verifyPin(pin, creds.pinHash);

    if (!ok) {
      const failedAttempts = (creds.failedAttempts ?? 0) + 1;
      const lockedOut = failedAttempts >= MAX_FAILED_ATTEMPTS;
      await credRef.update({
        failedAttempts: lockedOut ? 0 : failedAttempts,
        lockedUntil: lockedOut ? Date.now() + LOCKOUT_MS : null,
        updatedAt: Date.now(),
      });
      return NextResponse.json(
        { error: lockedOut ? "Too many attempts. Try again in a few minutes." : "Incorrect PIN." },
        { status: lockedOut ? 429 : 401 }
      );
    }

    await credRef.update({ failedAttempts: 0, lockedUntil: null, updatedAt: Date.now() });
    await childRef.update({ locked: false });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[kid/unlock]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
