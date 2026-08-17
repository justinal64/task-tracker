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
/** "any" is legacy (pre-multi-assign) and only read, never written by current code. */
export type AssignedTo = string[] | "any";

export interface Task {
  title: string;
  description: string | null;
  points: number;
  assignedTo: AssignedTo;
  recurrence: Recurrence;
  /** Only set (and non-empty) when recurrence === 'weekly'. 0 = Sunday .. 6 = Saturday. */
  weekdays: number[] | null;
  /** When true, a kid checking this off creates a pending completion instead of awarding points immediately. */
  requiresApproval: boolean;
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
  /** null = unlimited; otherwise the number of remaining claims shared across everyone who can see this reward. */
  stock: number | null;
  /** "all" = every kid (default); otherwise the specific child ids this reward is visible to. */
  assignedTo: string[] | "all";
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
  /** Only meaningful for a 'completion' of a task with requiresApproval: true. null = approval doesn't apply to this entry. */
  approvalStatus: "pending" | "approved" | "rejected" | null;
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
