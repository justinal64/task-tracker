import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import ParentSignInForm from "@/components/ParentSignInForm";

export default async function Home() {
  const user = await getSessionUser();
  if (user?.role === "parent") redirect("/parent");
  if (user?.role === "child") redirect("/kid");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Family Points Tracker</h1>
        <p className="mt-1 text-muted">Sign in to manage chores and points.</p>
      </div>
      <ParentSignInForm />
      <Link href="/kid-login" className="text-sm text-accent hover:text-accent-hover">
        I&apos;m a kid →
      </Link>
    </main>
  );
}
