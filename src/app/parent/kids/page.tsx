import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { Child } from "@/lib/types";
import KidForm from "@/components/KidForm";

export default async function KidsPage() {
  const user = await getSessionUser();
  const childrenSnap = await db
    .collection("families")
    .doc(user!.familyId)
    .collection("children")
    .get();

  const children = childrenSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Child),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Kids</h1>

      <div className="flex flex-col gap-3">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/parent/kids/${child.id}`}
            className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-4 hover:bg-background"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{child.avatarEmoji}</span>
              <span className="font-medium">{child.name}</span>
            </div>
            <span className="text-sm text-muted">{child.pointsBalance} pts</span>
          </Link>
        ))}
      </div>

      <KidForm />
    </div>
  );
}
