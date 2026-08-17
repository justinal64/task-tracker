import type { AssignedTo } from "./types";

/**
 * True if a task/reward's assignedTo includes this child. Handles the
 * current array form plus two legacy shapes still present in old docs:
 * the "any" sentinel and a bare single-child-id string.
 */
export function isAssignedToChild(assignedTo: AssignedTo | string, childId: string): boolean {
  if (assignedTo === "any") return true;
  if (Array.isArray(assignedTo)) return assignedTo.includes(childId);
  return assignedTo === childId;
}

/** Normalizes any assignedTo shape (current or legacy) into a plain child-id array for editing UI. */
export function normalizeAssignedTo(assignedTo: AssignedTo | string, allChildIds: string[]): string[] {
  if (assignedTo === "any") return allChildIds;
  if (Array.isArray(assignedTo)) return assignedTo;
  return [assignedTo];
}
