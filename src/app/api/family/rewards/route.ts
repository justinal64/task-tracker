import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { title, description, cost } = await req.json();

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    const costNum = Number(cost);
    if (!Number.isInteger(costNum) || costNum <= 0) {
      return NextResponse.json({ error: "Cost must be a positive whole number." }, { status: 400 });
    }

    const ref = await db
      .collection("families")
      .doc(user.familyId)
      .collection("rewards")
      .add({
        title: title.trim(),
        description: description && typeof description === "string" ? description.trim() : null,
        cost: costNum,
        active: true,
        createdAt: Date.now(),
        createdBy: user.uid,
      });

    return NextResponse.json({ id: ref.id });
  } catch (err) {
    console.error("[family/rewards:POST]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
