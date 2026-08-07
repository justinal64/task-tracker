import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import type { Child } from "@/lib/types";
import PinPad from "@/components/PinPad";

export default async function KidLoginPinPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const familyId = process.env.DEFAULT_FAMILY_ID;
  if (!familyId) notFound();

  const childSnap = await db
    .collection("families")
    .doc(familyId)
    .collection("children")
    .doc(childId)
    .get();

  if (!childSnap.exists) notFound();
  const child = childSnap.data() as Child;

  return (
    <main className="kid-theme flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 py-16">
      <div className="text-center">
        <span className="text-5xl">{child.avatarEmoji}</span>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Hi, {child.name}!</h1>
        <p className="text-muted">Enter your PIN</p>
      </div>
      <PinPad childId={childId} />
    </main>
  );
}
