import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import { dateKey } from "@/lib/pin";
import type { Child, Task } from "@/lib/types";
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
    .filter((task) => task.assignedTo === "any" || task.assignedTo === childId);

  const todayKey = dateKey();
  const dailyTasks = tasks.filter((task) => task.recurrence === "daily");
  const completionChecks = await Promise.all(
    dailyTasks.map((task) =>
      familyRef.collection("activity").doc(`${task.id}__${childId}__${todayKey}`).get()
    )
  );
  const completedTodayIds = dailyTasks
    .filter((_, i) => completionChecks[i].exists)
    .map((task) => task.id);

  const child = childSnap.data() as Child;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PointsBadge familyId={user!.familyId} childId={childId} initialBalance={child.pointsBalance} />
      <TaskBoard
        familyId={user!.familyId}
        childId={childId}
        initialTasks={tasks}
        initialCompletedTodayIds={completedTodayIds}
      />
    </div>
  );
}
