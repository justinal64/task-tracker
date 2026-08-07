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

export type Recurrence = "once" | "daily" | "weekly";
export type AssignedTo = "any" | string;

export interface Task {
  title: string;
  description: string | null;
  points: number;
  assignedTo: AssignedTo;
  recurrence: Recurrence;
  /** Only set (and non-empty) when recurrence === 'weekly'. 0 = Sunday .. 6 = Saturday. */
  weekdays: number[] | null;
  active: boolean;
  createdAt: number;
  createdBy: string;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDateKey: string;
}

export interface Reward {
  title: string;
  description: string | null;
  cost: number;
  active: boolean;
  createdAt: number;
  createdBy: string;
}

export type ActivityType = "completion" | "adjustment" | "redemption";

export interface ActivityEntry {
  type: ActivityType;
  childId: string;
  points: number;
  taskId: string | null;
  taskTitle: string | null;
  rewardId: string | null;
  rewardTitle: string | null;
  dateKey: string | null;
  reason: string | null;
  /** Only meaningful for type: 'redemption' -- has a parent seen this yet? */
  acknowledged: boolean | null;
  /** Only meaningful for type: 'completion' | 'redemption' -- has a parent reversed this? */
  voided: boolean;
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
