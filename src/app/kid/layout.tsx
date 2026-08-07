import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import KidNav from "@/components/KidNav";

export default async function KidLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "child") redirect("/kid-login");

  return (
    <div className="kid-theme flex min-h-screen flex-col bg-background">
      <KidNav displayName={user.displayName} />
      <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
