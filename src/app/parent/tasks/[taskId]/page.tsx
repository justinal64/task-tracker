import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { Child, Task } from "@/lib/types";
import TaskEditForm from "@/components/TaskEditForm";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const user = await getSessionUser();
  const { taskId } = await params;
  const familyRef = db.collection("families").doc(user!.familyId);

  const [taskSnap, childrenSnap] = await Promise.all([
    familyRef.collection("tasks").doc(taskId).get(),
    familyRef.collection("children").get(),
  ]);

  if (!taskSnap.exists) notFound();
  const task = taskSnap.data() as Task;
  const children = childrenSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Child),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Edit task</h1>
      <TaskEditForm taskId={taskId} task={task} kids={children} />
    </div>
  );
}
