import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { Child } from "@/lib/types";

export default async function KidLoginPicker() {
  const user = await getSessionUser();
  if (user?.role === "child") redirect("/kid");
  if (user?.role === "parent") redirect("/parent");

  const familyId = process.env.DEFAULT_FAMILY_ID;
  const childrenSnap = familyId
    ? await db.collection("families").doc(familyId).collection("children").get()
    : null;

  const children = (childrenSnap?.docs ?? []).map((doc) => ({
    id: doc.id,
    ...(doc.data() as Child),
  }));

  return (
    <main className="kid-theme flex flex-1 flex-col items-center justify-center gap-8 bg-background px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Who are you?</h1>

      {children.length === 0 ? (
        <p className="text-muted">No kids set up yet — ask a parent to add you.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/kid-login/${child.id}`}
              className="flex w-32 flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-6 transition-transform hover:scale-105"
            >
              <span className="text-4xl">{child.avatarEmoji}</span>
              <span className="font-medium">{child.name}</span>
            </Link>
          ))}
        </div>
      )}

      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Parent sign in
      </Link>
    </main>
  );
}
