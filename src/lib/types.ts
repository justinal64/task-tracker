/** "caregiver" (grandparent, sitter) is a restricted parent-adjacent role: can approve/reject
 * task completions and privilege requests, adjust points, and void a mistaken entry -- but
 * cannot manage tasks/rewards/kids or family settings (see requireApproverSession vs
 * requireParentSession in session.ts). */
export type Role = "parent" | "child" | "caregiver";

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
  /** null = points mode (default). Non-null = cash allowance mode: display balance/costs
   * as pointsBalance * centsPerPoint dollars instead of raw points. The underlying economy
   * is still points -- this only changes how it's presented for this child. */
  centsPerPoint: number | null;
  /** In-app read-only kiosk lock. True hides interactive content behind a PIN-reentry
   * screen; the kid stays signed in, this doesn't touch the auth session. */
  locked: boolean;
  createdAt: number;
}

export interface ChildCredentials {
  pinHash: string;
  failedAttempts: number;
  lockedUntil: number | null;
  updatedAt: number;
}

/** "weekly" = specific weekday(s), possibly multiple times a week. "weekly-any" = once every
 * 7 days, floating, not tied to a weekday. */
export type Recurrence = "once" | "daily" | "weekly" | "weekly-any";
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
  /** false = optional/bonus task, shown but not expected. Defaults true for normal chores. */
  required: boolean;
  /** Pinned tasks sort to the top of the kid's list. */
  pinned: boolean;
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

/** A kid-initiated ask for a privilege that wasn't necessarily a predefined Reward
 * (e.g. "can I have 30 extra min of screen time?"). Parent approves/rejects; an
 * approval with a pointCost deducts points the same way a redemption does. */
export interface PrivilegeRequest {
  childId: string;
  title: string;
  description: string | null;
  pointCost: number | null;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  resolvedAt: number | null;
  resolvedBy: string | null;
}

export type ActivityType = "completion" | "adjustment" | "redemption" | "request";

export interface ActivityEntry {
  type: ActivityType;
  childId: string;
  points: number;
  taskId: string | null;
  taskTitle: string | null;
  rewardId: string | null;
  rewardTitle: string | null;
  /** Set only for type: 'request' -- the approved/rejected PrivilegeRequest this entry resulted from. */
  requestId: string | null;
  dateKey: string | null;
  /** Free text: adjustment reason, or a 'request' entry's title. */
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

/** Self-reported screen time (no OS-level enforcement -- see the issue doc for why a
 * real cross-device Screen Time integration isn't reachable from this web stack). One
 * open session (endedAt: null) per child at a time. */
export interface ScreenTimeSession {
  childId: string;
  startedAt: number;
  endedAt: number | null;
  durationMinutes: number | null;
  /** Day the session started, for "today's total" queries. */
  dateKey: string;
  createdBy: string;
}

export interface SessionUser {
  uid: string;
  role: Role;
  familyId: string;
  childId?: string;
  displayName: string;
}
