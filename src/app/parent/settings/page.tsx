import { getSessionUser } from "@/lib/session";
import { adminAuth, db } from "@/lib/firebase-admin";
import AddParentForm from "@/components/AddParentForm";
import ParentRow from "@/components/ParentRow";

export default async function SettingsPage() {
  const user = await getSessionUser();

  const parentsSnap = await db
    .collection("users")
    .where("familyId", "==", user!.familyId)
    .where("role", "==", "parent")
    .get();

  const uids = parentsSnap.docs.map((doc) => doc.id);
  const authUsers = uids.length
    ? (await adminAuth.getUsers(uids.map((uid) => ({ uid })))).users
    : [];
  const emailByUid = new Map(authUsers.map((u) => [u.uid, u.email ?? ""]));

  const parents = parentsSnap.docs.map((doc) => ({
    uid: doc.id,
    name: (doc.data().displayName as string) ?? "Unknown",
    email: emailByUid.get(doc.id) ?? "",
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Parents</h2>
        {parents.map((parent) => (
          <ParentRow
            key={parent.uid}
            uid={parent.uid}
            name={parent.name}
            email={parent.email}
            isSelf={parent.uid === user!.uid}
            canRemove={parents.length > 1}
          />
        ))}
        <AddParentForm />
      </div>
    </div>
  );
}
