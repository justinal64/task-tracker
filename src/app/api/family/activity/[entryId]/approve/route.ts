import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";
import { dateKey } from "@/lib/pin";
import type { ActivityEntry, Child, Streak, Task } from "@/lib/types";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const STREAK_MILESTONE = 7;
const STREAK_BONUS_POINTS = 5;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** A sibling assignee's completion counts as "done" once approved (or immediately, for tasks that don't require approval). */
function isCompletionFinal(snap: FirebaseFirestore.DocumentSnapshot): boolean {
  if (!snap.exists) return false;
  const data = snap.data();
  if (data?.voided) return false;
  return data?.approvalStatus == null || data?.approvalStatus === "approved";
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { entryId } = await params;

    const familyRef = db.collection("families").doc(user.familyId);
    const entryRef = familyRef.collection("activity").doc(entryId);

    const newBalance = await db.runTransaction(async (tx) => {
      const entrySnap = await tx.get(entryRef);
      if (!entrySnap.exists) throw new HttpError(404, "Not found.");
      const entry = entrySnap.data() as ActivityEntry;

      if (entry.type !== "completion" || entry.approvalStatus !== "pending") {
        throw new HttpError(400, "This entry isn't awaiting approval.");
      }
      if (!entry.taskId) throw new HttpError(400, "Missing task reference.");

      const taskRef = familyRef.collection("tasks").doc(entry.taskId);
      const childRef = familyRef.collection("children").doc(entry.childId);
      const streakRef = childRef.collection("streaks").doc(entry.taskId);

      const [taskSnap, childSnap] = await Promise.all([tx.get(taskRef), tx.get(childRef)]);
      if (!taskSnap.exists) throw new HttpError(404, "Task not found.");
      if (!childSnap.exists) throw new HttpError(404, "Child not found.");
      const task = taskSnap.data() as Task;
      const child = childSnap.data() as Child;

      const siblingIds =
        task.recurrence === "once" && Array.isArray(task.assignedTo)
          ? task.assignedTo.filter((id) => id !== entry.childId)
          : [];
      const siblingRefs = siblingIds.map((id) =>
        familyRef.collection("activity").doc(`${entry.taskId}__${id}`)
      );
      const siblingSnaps = siblingRefs.length ? await tx.getAll(...siblingRefs) : [];

      const streakSnap = task.recurrence === "daily" ? await tx.get(streakRef) : null;

      tx.update(entryRef, { approvalStatus: "approved" });

      let bonusPoints = 0;
      if (task.recurrence === "daily") {
        const today = dateKey();
        const yesterday = dateKey(new Date(Date.now() - ONE_DAY_MS));
        const prevStreak = streakSnap?.exists ? (streakSnap.data() as Streak) : null;
        const currentStreak =
          prevStreak?.lastCompletedDateKey === yesterday ? prevStreak.currentStreak + 1 : 1;
        const longestStreak = Math.max(prevStreak?.longestStreak ?? 0, currentStreak);

        tx.set(streakRef, { currentStreak, longestStreak, lastCompletedDateKey: today });

        if (currentStreak % STREAK_MILESTONE === 0) {
          bonusPoints = STREAK_BONUS_POINTS;
          tx.set(familyRef.collection("activity").doc(), {
            type: "adjustment",
            childId: entry.childId,
            points: bonusPoints,
            taskId: null,
            taskTitle: null,
            rewardId: null,
            rewardTitle: null,
            dateKey: null,
            reason: `${currentStreak}-day streak bonus! 🔥`,
            acknowledged: null,
            voided: false,
            approvalStatus: null,
            createdAt: Date.now(),
            createdBy: user.uid,
          });
        }
      }

      if (task.recurrence === "once") {
        const allAssigneesDone = siblingSnaps.every(isCompletionFinal);
        if (allAssigneesDone) tx.update(taskRef, { active: false });
      }

      tx.update(childRef, { pointsBalance: FieldValue.increment(entry.points + bonusPoints) });

      return child.pointsBalance + entry.points + bonusPoints;
    });

    return NextResponse.json({ pointsBalance: newBalance });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[activity/approve]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
