import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import KidLoginFlow from "@/components/KidLoginFlow";

export default async function KidLoginPage() {
  const user = await getSessionUser();
  if (user?.role === "child") redirect("/kid");
  if (user?.role === "parent") redirect("/parent");

  return (
    <main className="kid-theme flex flex-1 flex-col items-center justify-center gap-8 bg-background px-6 py-16">
      <KidLoginFlow />
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Parent sign in
      </Link>
    </main>
  );
}
