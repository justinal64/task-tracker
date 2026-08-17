import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { Child } from "@/lib/types";
import KidNav from "@/components/KidNav";
import LockGate from "@/components/LockGate";

export default async function KidLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "child") redirect("/kid-login");

  const childSnap = await db
    .collection("families")
    .doc(user.familyId)
    .collection("children")
    .doc(user.childId!)
    .get();
  const locked = childSnap.exists ? Boolean((childSnap.data() as Child).locked) : false;

  return (
    <div className="kid-theme flex min-h-screen flex-col bg-background">
      <KidNav displayName={user.displayName} />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <LockGate familyId={user.familyId} childId={user.childId!} initialLocked={locked}>
          {children}
        </LockGate>
      </main>
    </div>
  );
}
