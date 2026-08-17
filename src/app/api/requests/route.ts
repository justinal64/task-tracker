import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "child" || !user.childId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { title, description, pointCost } = await req.json();

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    let pointCostValue: number | null = null;
    if (pointCost !== null && pointCost !== undefined && pointCost !== "") {
      const costNum = Number(pointCost);
      if (!Number.isInteger(costNum) || costNum < 0) {
        return NextResponse.json({ error: "Point cost must be zero or a positive whole number." }, { status: 400 });
      }
      pointCostValue = costNum;
    }

    const ref = await db
      .collection("families")
      .doc(user.familyId)
      .collection("requests")
      .add({
        childId: user.childId,
        title: title.trim(),
        description: description && typeof description === "string" ? description.trim() : null,
        pointCost: pointCostValue,
        status: "pending",
        createdAt: Date.now(),
        resolvedAt: null,
        resolvedBy: null,
      });

    return NextResponse.json({ id: ref.id });
  } catch (err) {
    console.error("[requests:POST]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
