import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import { dateKey } from "@/lib/pin";
import { isScheduledToday } from "@/lib/recurrence";
import { isAssignedToChild } from "@/lib/assignment";
import type { Child, Streak, Task } from "@/lib/types";
import PointsBadge from "@/components/PointsBadge";
import TaskBoard from "@/components/TaskBoard";

export default async function KidDashboard() {
  const user = await getSessionUser();
  const childId = user!.childId!;
  const familyRef = db.collection("families").doc(user!.familyId);

  const [tasksSnap, childSnap] = await Promise.all([
    familyRef.collection("tasks").where("active", "==", true).get(),
    familyRef.collection("children").doc(childId).get(),
  ]);

  const tasks = tasksSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Task) }))
    .filter((task) => isAssignedToChild(task.assignedTo, childId))
    .filter(isScheduledToday);

  const todayKey = dateKey();
  const completionChecks = await Promise.all(
    tasks.map((task) =>
      familyRef
        .collection("activity")
        .doc(task.recurrence === "once" ? `${task.id}__${childId}` : `${task.id}__${childId}__${todayKey}`)
        .get()
    )
  );
  const completedTodayIds = tasks
    .filter((_, i) => completionChecks[i].exists && !completionChecks[i].data()?.voided)
    .map((task) => task.id);

  const dailyTasks = tasks.filter((task) => task.recurrence === "daily");
  const streakSnaps = await Promise.all(
    dailyTasks.map((task) =>
      familyRef.collection("children").doc(childId).collection("streaks").doc(task.id).get()
    )
  );
  const streakByTaskId: Record<string, number> = {};
  dailyTasks.forEach((task, i) => {
    const snap = streakSnaps[i];
    if (snap.exists) streakByTaskId[task.id] = (snap.data() as Streak).currentStreak;
  });

  const child = childSnap.data() as Child;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PointsBadge familyId={user!.familyId} childId={childId} initialBalance={child.pointsBalance} />
      <TaskBoard
        familyId={user!.familyId}
        childId={childId}
        initialTasks={tasks}
        initialCompletedTodayIds={completedTodayIds}
        initialStreaks={streakByTaskId}
      />
    </div>
  );
}
