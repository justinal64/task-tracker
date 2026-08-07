import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { Child } from "@/lib/types";
import KidDetailForm from "@/components/KidDetailForm";
import AdjustPointsForm from "@/components/AdjustPointsForm";

export default async function KidDetailPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const user = await getSessionUser();
  const { childId } = await params;

  const childSnap = await db
    .collection("families")
    .doc(user!.familyId)
    .collection("children")
    .doc(childId)
    .get();

  if (!childSnap.exists) notFound();
  const child = childSnap.data() as Child;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">
        {child.avatarEmoji} {child.name} · {child.pointsBalance} pts
      </h1>
      <AdjustPointsForm childId={childId} />
      <KidDetailForm childId={childId} child={child} />
    </div>
  );
}
