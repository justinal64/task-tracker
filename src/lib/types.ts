export type Role = "parent" | "child";

export interface UserDoc {
  role: Role;
  familyId: string;
  childId?: string;
  displayName: string;
}

export interface Family {
  name: string;
  createdAt: number;
}

export interface Child {
  name: string;
  avatarEmoji: string;
  pointsBalance: number;
  createdAt: number;
}

export interface ChildCredentials {
  pinHash: string;
  failedAttempts: number;
  lockedUntil: number | null;
  updatedAt: number;
}

export type Recurrence = "once" | "daily";
export type AssignedTo = "any" | string;

export interface Task {
  title: string;
  description: string | null;
  points: number;
  assignedTo: AssignedTo;
  recurrence: Recurrence;
  active: boolean;
  createdAt: number;
  createdBy: string;
}

export type ActivityType = "completion" | "adjustment";

export interface ActivityEntry {
  type: ActivityType;
  childId: string;
  points: number;
  taskId: string | null;
  taskTitle: string | null;
  dateKey: string | null;
  reason: string | null;
  createdAt: number;
  createdBy: string;
}

export interface SessionUser {
  uid: string;
  role: Role;
  familyId: string;
  childId?: string;
  displayName: string;
}
