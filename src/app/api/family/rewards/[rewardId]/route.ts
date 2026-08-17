import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { rewardId } = await params;

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
    if ("description" in body) {
      updates.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
    }
    if (body.cost !== undefined) {
      const costNum = Number(body.cost);
      if (!Number.isInteger(costNum) || costNum <= 0) {
        return NextResponse.json({ error: "Cost must be a positive whole number." }, { status: 400 });
      }
      updates.cost = costNum;
    }
    if ("stock" in body) {
      if (body.stock === null || body.stock === undefined || body.stock === "") {
        updates.stock = null;
      } else {
        const stockNum = Number(body.stock);
        if (!Number.isInteger(stockNum) || stockNum < 0) {
          return NextResponse.json(
            { error: "Quantity must be zero or a positive whole number." },
            { status: 400 }
          );
        }
        updates.stock = stockNum;
      }
    }
    if (typeof body.active === "boolean") updates.active = body.active;

    if (body.assignedTo !== undefined) {
      if (body.assignedTo === "all") {
        updates.assignedTo = "all";
      } else if (
        Array.isArray(body.assignedTo) &&
        body.assignedTo.length > 0 &&
        body.assignedTo.every((id: unknown) => typeof id === "string")
      ) {
        const childRefs = body.assignedTo.map((id: string) =>
          db.collection("families").doc(user.familyId).collection("children").doc(id)
        );
        const childSnaps = await db.getAll(...childRefs);
        if (childSnaps.some((snap) => !snap.exists)) {
          return NextResponse.json({ error: "Unknown child." }, { status: 400 });
        }
        updates.assignedTo = body.assignedTo;
      } else {
        return NextResponse.json({ error: "Pick at least one child, or leave it visible to all." }, { status: 400 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    await db
      .collection("families")
      .doc(user.familyId)
      .collection("rewards")
      .doc(rewardId)
      .update(updates);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/rewards:PATCH]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { rewardId } = await params;

    await db
      .collection("families")
      .doc(user.familyId)
      .collection("rewards")
      .doc(rewardId)
      .delete();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/rewards:DELETE]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
