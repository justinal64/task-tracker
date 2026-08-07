import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/session";
import { dateKey } from "@/lib/pin";
import { isScheduledToday } from "@/lib/recurrence";
import type { Child, Streak, Task } from "@/lib/types";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const STREAK_MILESTONE = 7;
const STREAK_BONUS_POINTS = 5;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { taskId } = await params;

    let childId: string;
    if (user.role === "child") {
      childId = user.childId!;
    } else {
      const body = await req.json().catch(() => ({}));
      if (!body.childId || typeof body.childId !== "string") {
        return NextResponse.json({ error: "childId is required." }, { status: 400 });
      }
      childId = body.childId;
    }

    const familyRef = db.collection("families").doc(user.familyId);
    const taskRef = familyRef.collection("tasks").doc(taskId);
    const childRef = familyRef.collection("children").doc(childId);
    const streakRef = childRef.collection("streaks").doc(taskId);

    const newBalance = await db.runTransaction(async (tx) => {
      const [taskSnap, childSnap] = await Promise.all([tx.get(taskRef), tx.get(childRef)]);

      if (!taskSnap.exists) throw new HttpError(404, "Task not found.");
      if (!childSnap.exists) throw new HttpError(404, "Child not found.");

      const task = taskSnap.data() as Task;
      const child = childSnap.data() as Child;

      if (!task.active) throw new HttpError(409, "This task is no longer active.");
      if (task.assignedTo !== "any" && task.assignedTo !== childId) {
        throw new HttpError(403, "This task isn't assigned to this child.");
      }
      if (!isScheduledToday(task)) {
        throw new HttpError(409, "This task isn't scheduled for today.");
      }

      const activityId =
        task.recurrence === "once" ? taskId : `${taskId}__${childId}__${dateKey()}`;
      const activityRef = familyRef.collection("activity").doc(activityId);
      const activitySnap = await tx.get(activityRef);
      // A voided completion frees the slot back up -- undoing a mistaken
      // "done" should let the kid actually do (and log) it again.
      if (activitySnap.exists && !activitySnap.data()?.voided) {
        throw new HttpError(409, "Already completed.");
      }

      const streakSnap = task.recurrence === "daily" ? await tx.get(streakRef) : null;

      tx.set(activityRef, {
        type: "completion",
        childId,
        points: task.points,
        taskId,
        taskTitle: task.title,
        rewardId: null,
        rewardTitle: null,
        dateKey: task.recurrence !== "once" ? dateKey() : null,
        reason: null,
        acknowledged: null,
        voided: false,
        createdAt: Date.now(),
        createdBy: user.uid,
      });
      if (task.recurrence === "once") {
        tx.update(taskRef, { active: false });
      }

      // Firestore only keeps the LAST update() call per document within a
      // transaction (they don't merge), so pointsBalance is written exactly
      // once below with the full total, task points plus any streak bonus.
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
            childId,
            points: bonusPoints,
            taskId: null,
            taskTitle: null,
            rewardId: null,
            rewardTitle: null,
            dateKey: null,
            reason: `${currentStreak}-day streak bonus! 🔥`,
            acknowledged: null,
            voided: false,
            createdAt: Date.now(),
            createdBy: user.uid,
          });
        }
      }

      tx.update(childRef, { pointsBalance: FieldValue.increment(task.points + bonusPoints) });

      return child.pointsBalance + task.points + bonusPoints;
    });

    return NextResponse.json({ pointsBalance: newBalance });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[tasks/complete]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
