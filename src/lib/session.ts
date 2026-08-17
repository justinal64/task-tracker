import { cookies } from "next/headers";
import { adminAuth, db } from "@/lib/firebase-admin";
import type { SessionUser, UserDoc } from "@/lib/types";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Single chokepoint for auth checks: layouts and privileged API routes both
 * call this instead of touching cookies/adminAuth/Firestore directly.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userSnap = await db.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists) return null;

    const userDoc = userSnap.data() as UserDoc;
    return {
      uid: decoded.uid,
      role: userDoc.role,
      familyId: userDoc.familyId,
      childId: userDoc.childId,
      displayName: userDoc.displayName,
    };
  } catch {
    return null;
  }
}

/** Convenience guard for API routes that only a parent may call. */
export async function requireParentSession(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "parent") return null;
  return user;
}

/** Guard for the restricted actions a caregiver may also perform: approve/reject
 * completions and requests, adjust points, void a mistaken entry. Not for task/reward/kid
 * management or family settings -- those stay requireParentSession-only. */
export async function requireApproverSession(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || (user.role !== "parent" && user.role !== "caregiver")) return null;
  return user;
}
