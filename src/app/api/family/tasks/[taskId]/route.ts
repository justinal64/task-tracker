import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";
import { parseWeekdays } from "@/lib/recurrence";
import type { Recurrence, Task } from "@/lib/types";

const RECURRENCES: Recurrence[] = ["once", "daily", "weekly"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { taskId } = await params;
    const taskRef = db
      .collection("families")
      .doc(user.familyId)
      .collection("tasks")
      .doc(taskId);

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
    if ("description" in body) {
      updates.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
    }
    if (body.points !== undefined) {
      const pointsNum = Number(body.points);
      if (!Number.isInteger(pointsNum) || pointsNum <= 0) {
        return NextResponse.json({ error: "Points must be a positive whole number." }, { status: 400 });
      }
      updates.points = pointsNum;
    }
    if (typeof body.assignedTo === "string" && body.assignedTo) {
      if (body.assignedTo !== "any") {
        const childSnap = await db
          .collection("families")
          .doc(user.familyId)
          .collection("children")
          .doc(body.assignedTo)
          .get();
        if (!childSnap.exists) {
          return NextResponse.json({ error: "Unknown child." }, { status: 400 });
        }
      }
      updates.assignedTo = body.assignedTo;
    }
    if (RECURRENCES.includes(body.recurrence)) updates.recurrence = body.recurrence;

    if (updates.recurrence !== undefined || body.weekdays !== undefined) {
      const effectiveRecurrence =
        (updates.recurrence as string | undefined) ??
        ((await taskRef.get()).data() as Task | undefined)?.recurrence ??
        "once";
      const weekdaysResult = parseWeekdays(effectiveRecurrence, body.weekdays);
      if (!weekdaysResult.ok) {
        return NextResponse.json({ error: weekdaysResult.error }, { status: 400 });
      }
      updates.weekdays = weekdaysResult.value;
    }

    if (typeof body.active === "boolean") updates.active = body.active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    await taskRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/tasks:PATCH]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { taskId } = await params;

    await db
      .collection("families")
      .doc(user.familyId)
      .collection("tasks")
      .doc(taskId)
      .delete();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/tasks:DELETE]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
