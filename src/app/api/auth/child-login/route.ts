import { NextRequest, NextResponse } from "next/server";
import { adminAuth, db } from "@/lib/firebase-admin";
import { isValidPin, verifyPin, MAX_FAILED_ATTEMPTS, LOCKOUT_MS } from "@/lib/pin";
import type { ChildCredentials } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { childId, pin } = await req.json();
    if (!childId || typeof childId !== "string" || !isValidPin(pin ?? "")) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const familyId = process.env.DEFAULT_FAMILY_ID;
    if (!familyId) {
      console.error("[auth/child-login] DEFAULT_FAMILY_ID is not set");
      return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
    }

    const credRef = db
      .collection("families")
      .doc(familyId)
      .collection("children")
      .doc(childId)
      .collection("private")
      .doc("credentials");

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
        {
          error: lockedOut
            ? "Too many attempts. Try again in a few minutes."
            : "Incorrect PIN.",
        },
        { status: lockedOut ? 429 : 401 }
      );
    }

    await credRef.update({ failedAttempts: 0, lockedUntil: null, updatedAt: Date.now() });

    const customToken = await adminAuth.createCustomToken(childId, {
      role: "child",
      familyId,
    });

    return NextResponse.json({ customToken });
  } catch (err) {
    console.error("[auth/child-login]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
