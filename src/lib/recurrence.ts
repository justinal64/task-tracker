export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Hour (24h, local time) after which an undone recurring task is flagged. */
export const REMINDER_HOUR = 18;

/** A recurring (not one-off) task that's still undone once it's evening. */
export function isOverdue(task: { recurrence: string }, completed: boolean): boolean {
  return task.recurrence !== "once" && !completed && new Date().getHours() >= REMINDER_HOUR;
}

/** True unless the task is a 'weekly' task not scheduled for today. */
export function isScheduledToday(task: { recurrence: string; weekdays: number[] | null }): boolean {
  if (task.recurrence !== "weekly") return true;
  return (task.weekdays ?? []).includes(new Date().getDay());
}

/** Validates the weekdays array for a 'weekly' task; returns null for other recurrences. */
export function parseWeekdays(
  recurrence: string,
  weekdays: unknown
): { ok: true; value: number[] | null } | { ok: false; error: string } {
  if (recurrence !== "weekly") return { ok: true, value: null };
  if (
    !Array.isArray(weekdays) ||
    weekdays.length === 0 ||
    !weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  ) {
    return { ok: false, error: "Pick at least one day of the week." };
  }
  return { ok: true, value: [...new Set(weekdays)].sort((a, b) => a - b) };
}

export function weekdaysLabel(weekdays: number[]): string {
  const sorted = [...weekdays].sort((a, b) => a - b);
  if (sorted.length === 5 && sorted.join(",") === "1,2,3,4,5") return "School days";
  if (sorted.length === 2 && sorted.join(",") === "0,6") return "Weekends";
  if (sorted.length === 7) return "Every day";
  return sorted.map((d) => WEEKDAY_LABELS[d]).join(", ");
}

export function recurrenceLabel(task: { recurrence: string; weekdays: number[] | null }): string {
  if (task.recurrence === "once") return "One-off";
  if (task.recurrence === "daily") return "Daily";
  return task.weekdays ? weekdaysLabel(task.weekdays) : "Weekly";
}
