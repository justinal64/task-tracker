"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import TaskCard from "@/components/TaskCard";
import { isOverdue, isScheduledToday, sortTasksForDisplay } from "@/lib/recurrence";
import { isAssignedToChild } from "@/lib/assignment";
import type { Task } from "@/lib/types";

interface TaskWithId extends Task {
  id: string;
}

export default function TaskBoard({
  familyId,
  childId,
  initialTasks,
  initialCompletedTodayIds,
  initialPendingTodayIds,
  initialStreaks,
}: {
  familyId: string;
  childId: string;
  initialTasks: TaskWithId[];
  initialCompletedTodayIds: string[];
  initialPendingTodayIds: string[];
  initialStreaks: Record<string, number>;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [completedToday, setCompletedToday] = useState(new Set(initialCompletedTodayIds));
  const [pendingToday, setPendingToday] = useState(new Set(initialPendingTodayIds));
  const [streaks, setStreaks] = useState(initialStreaks);

  useEffect(() => {
    const q = query(collection(db, "families", familyId, "tasks"), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Task) }))
        .filter((t) => isAssignedToChild(t.assignedTo, childId))
        .filter(isScheduledToday);
      setTasks(next);
    });
    return unsub;
  }, [familyId, childId]);

  if (tasks.length === 0) {
    return <p className="text-muted">No tasks right now — nice work!</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {sortTasksForDisplay(tasks).map((task) => (
        <TaskCard
          key={task.id}
          taskId={task.id}
          title={task.title}
          description={task.description}
          points={task.points}
          recurrence={task.recurrence}
          weekdays={task.weekdays}
          required={task.required}
          pinned={task.pinned}
          completed={completedToday.has(task.id)}
          pending={pendingToday.has(task.id)}
          streak={streaks[task.id] ?? 0}
          overdue={isOverdue(task, completedToday.has(task.id) || pendingToday.has(task.id))}
          onCompleted={({ pending }) => {
            if (pending) {
              setPendingToday((prev) => {
                const next = new Set(prev);
                next.add(task.id);
                return next;
              });
              return;
            }
            setCompletedToday((prev) => {
              const next = new Set(prev);
              next.add(task.id);
              return next;
            });
            if (task.recurrence === "daily") {
              // Optimistic bump -- the exact server value (which also
              // accounts for streak resets) lands on the next full load.
              setStreaks((prev) => ({ ...prev, [task.id]: (prev[task.id] ?? 0) + 1 }));
            }
          }}
        />
      ))}
    </div>
  );
}
