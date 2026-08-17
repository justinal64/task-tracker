import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/session";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "child" || !user.childId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await db
      .collection("families")
      .doc(user.familyId)
      .collection("children")
      .doc(user.childId)
      .update({ locked: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[kid/lock]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
