import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
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

  const children = childrenSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Child),
  }));
  const childById = new Map(children.map((c) => [c.id, c]));

  const tasks = tasksSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Task),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>

      <div className="flex flex-col gap-3">
        {tasks.length === 0 && <p className="text-muted">No tasks yet.</p>}
        {tasks.map((task) => {
          const assignee =
            task.assignedTo === "any" ? "Any kid" : (childById.get(task.assignedTo)?.name ?? "Unknown");
          return <TaskRow key={task.id} taskId={task.id} task={task} assigneeLabel={assignee} />;
        })}
      </div>

      <TaskForm kids={children} />
    </div>
  );
}
