import { NextRequest, NextResponse } from "next/server";
import { adminAuth, db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { email, password, name } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const authUser = await adminAuth.createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: name.trim(),
    });

    await db.collection("users").doc(authUser.uid).set({
      role: "parent",
      familyId: user.familyId,
      displayName: name.trim(),
    });

    return NextResponse.json({ id: authUser.uid, name: name.trim(), email: authUser.email });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "auth/email-already-exists"
    ) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
    console.error("[family/parents:POST]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
