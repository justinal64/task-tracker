import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import { dateKey } from "@/lib/pin";
import type { ScreenTimeSession } from "@/lib/types";
import ScreenTimeTracker from "@/components/ScreenTimeTracker";

export default async function KidScreenTimePage() {
  const user = await getSessionUser();
  const childId = user!.childId!;
  const familyRef = db.collection("families").doc(user!.familyId);

  const todaySnap = await familyRef
    .collection("screenTimeSessions")
    .where("childId", "==", childId)
    .where("dateKey", "==", dateKey())
    .get();

  const sessions = todaySnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ScreenTimeSession) }));
  const active = sessions.find((s) => s.endedAt === null) ?? null;
  const completedMinutesToday = sessions
    .filter((s) => s.durationMinutes !== null)
    .reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Screen Time</h1>
      <ScreenTimeTracker
        activeStartedAt={active?.startedAt ?? null}
        completedMinutesToday={completedMinutesToday}
      />
    </div>
  );
}
