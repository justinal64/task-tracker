import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";
import { parseWeekdays } from "@/lib/recurrence";
import type { Recurrence } from "@/lib/types";

const RECURRENCES: Recurrence[] = ["once", "daily", "weekly"];

export async function POST(req: NextRequest) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { title, description, points, assignedTo, recurrence, weekdays } = await req.json();

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    const pointsNum = Number(points);
    if (!Number.isInteger(pointsNum) || pointsNum <= 0) {
      return NextResponse.json({ error: "Points must be a positive whole number." }, { status: 400 });
    }
    if (typeof assignedTo !== "string" || !assignedTo) {
      return NextResponse.json({ error: "Assignee is required." }, { status: 400 });
    }
    if (!RECURRENCES.includes(recurrence)) {
      return NextResponse.json({ error: "Invalid recurrence." }, { status: 400 });
    }
    const weekdaysResult = parseWeekdays(recurrence, weekdays);
    if (!weekdaysResult.ok) {
      return NextResponse.json({ error: weekdaysResult.error }, { status: 400 });
    }

    // 'assignedTo' is either the literal 'any' or a child uid within this family;
    // verify child ids to prevent assigning a task to a uid outside the family.
    if (assignedTo !== "any") {
      const childSnap = await db
        .collection("families")
        .doc(user.familyId)
        .collection("children")
        .doc(assignedTo)
        .get();
      if (!childSnap.exists) {
        return NextResponse.json({ error: "Unknown child." }, { status: 400 });
      }
    }

    const ref = await db
      .collection("families")
      .doc(user.familyId)
      .collection("tasks")
      .add({
        title: title.trim(),
        description: description && typeof description === "string" ? description.trim() : null,
        points: pointsNum,
        assignedTo,
        recurrence,
        weekdays: weekdaysResult.value,
        active: true,
        createdAt: Date.now(),
        createdBy: user.uid,
      });

    return NextResponse.json({ id: ref.id });
  } catch (err) {
    console.error("[family/tasks:POST]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
