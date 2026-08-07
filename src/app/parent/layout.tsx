import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import ParentNav from "@/components/ParentNav";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "parent") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <ParentNav displayName={user.displayName} />
      <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
