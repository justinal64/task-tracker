import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import type { Child } from "@/lib/types";

/**
 * Looks up a child by first name so /kid-login never has to render the
 * full roster of names -- a kid types their own name, and this confirms
 * it against Firestore before the PIN pad is shown.
 */
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Enter your name." }, { status: 400 });
    }

    const familyId = process.env.DEFAULT_FAMILY_ID;
    if (!familyId) {
      console.error("[auth/child-lookup] DEFAULT_FAMILY_ID is not set");
      return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
    }

    const normalized = name.trim().toLowerCase();
    const childrenSnap = await db
      .collection("families")
      .doc(familyId)
      .collection("children")
      .get();

    const match = childrenSnap.docs.find(
      (doc) => (doc.data() as Child).name.trim().toLowerCase() === normalized
    );

    if (!match) {
      return NextResponse.json({ error: "We couldn't find that name." }, { status: 404 });
    }

    const child = match.data() as Child;
    return NextResponse.json({
      childId: match.id,
      name: child.name,
      avatarEmoji: child.avatarEmoji,
    });
  } catch (err) {
    console.error("[auth/child-lookup]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
