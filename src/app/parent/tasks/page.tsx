import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import { isAssignedToChild } from "@/lib/assignment";
import type { Child, Task } from "@/lib/types";
import TaskForm from "@/components/TaskForm";
import TaskRow from "@/components/TaskRow";

export default async function TasksPage() {
  const user = await getSessionUser();
  const familyRef = db.collection("families").doc(user!.familyId);

  const [tasksSnap, childrenSnap] = await Promise.all([
    familyRef.collection("tasks").orderBy("createdAt", "desc").get(),
    familyRef.collection("children").get(),
  ]);

  const children = childrenSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Child) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const tasks = tasksSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Task) }));
  const anyKidTasks = tasks.filter((task) => task.assignedTo === "any");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>

      {children.length === 0 && anyKidTasks.length === 0 && (
        <p className="text-muted">No tasks yet.</p>
      )}

      {children.map((child) => {
        const childTasks = tasks.filter((task) => isAssignedToChild(task.assignedTo, child.id));
        return (
          <div key={child.id} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-medium">
              <span className="text-xl">{child.avatarEmoji}</span>
              {child.name}
            </h2>
            {childTasks.length === 0 ? (
              <p className="text-sm text-muted">No tasks assigned.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {childTasks.map((task) => (
                  <TaskRow key={task.id} taskId={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {anyKidTasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium">🙌 Any kid</h2>
          <div className="flex flex-col gap-3">
            {anyKidTasks.map((task) => (
              <TaskRow key={task.id} taskId={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      <TaskForm kids={children} />
    </div>
  );
}
