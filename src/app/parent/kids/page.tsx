import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import { dateKey } from "@/lib/pin";
import { formatBalance } from "@/lib/currency";
import type { Child, ScreenTimeSession } from "@/lib/types";
import KidForm from "@/components/KidForm";

export default async function KidsPage() {
  const user = await getSessionUser();
  const familyRef = db.collection("families").doc(user!.familyId);

  const [childrenSnap, screenTimeSnap] = await Promise.all([
    familyRef.collection("children").get(),
    familyRef.collection("screenTimeSessions").where("dateKey", "==", dateKey()).get(),
  ]);

  const children = childrenSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Child),
  }));

  const sessions = screenTimeSnap.docs.map((doc) => doc.data() as ScreenTimeSession);
  const screenTimeByChild = new Map<string, { minutes: number; active: boolean }>();
  for (const session of sessions) {
    const entry = screenTimeByChild.get(session.childId) ?? { minutes: 0, active: false };
    if (session.endedAt === null) entry.active = true;
    else entry.minutes += session.durationMinutes ?? 0;
    screenTimeByChild.set(session.childId, entry);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Kids</h1>

      <div className="flex flex-col gap-3">
        {children.map((child) => {
          const screenTime = screenTimeByChild.get(child.id);
          return (
            <Link
              key={child.id}
              href={`/parent/kids/${child.id}`}
              className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-4 hover:bg-background"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{child.avatarEmoji}</span>
                <span className="font-medium">{child.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {screenTime && (
                  <span className="text-sm text-muted">
                    {screenTime.active ? "🖥️ Active" : screenTime.minutes > 0 ? `🖥️ ${screenTime.minutes}m today` : null}
                  </span>
                )}
                <span className="text-sm text-muted">{formatBalance(child.pointsBalance, child.centsPerPoint)}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {user!.role !== "caregiver" && <KidForm />}
    </div>
  );
}
