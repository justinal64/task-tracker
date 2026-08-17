import type { AssignedTo, Reward } from "./types";

type AnyAssignment = AssignedTo | Reward["assignedTo"] | string;

/**
 * True if a task/reward's assignedTo includes this child. Handles the
 * current array form plus legacy/sentinel shapes: tasks' "any", rewards'
 * "all", and a bare single-child-id string from pre-multi-assign docs.
 */
export function isAssignedToChild(assignedTo: AnyAssignment, childId: string): boolean {
  if (assignedTo === "any" || assignedTo === "all") return true;
  if (Array.isArray(assignedTo)) return assignedTo.includes(childId);
  return assignedTo === childId;
}

/** Normalizes any assignedTo shape (current or legacy) into a plain child-id array for editing UI. */
export function normalizeAssignedTo(assignedTo: AnyAssignment, allChildIds: string[]): string[] {
  if (assignedTo === "any" || assignedTo === "all") return allChildIds;
  if (Array.isArray(assignedTo)) return assignedTo;
  return [assignedTo];
}
