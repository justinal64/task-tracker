import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { adminAuth, db } from "@/lib/firebase-admin";
import AddParentForm from "@/components/AddParentForm";
import ParentRow from "@/components/ParentRow";
import AddCaregiverForm from "@/components/AddCaregiverForm";
import CaregiverRow from "@/components/CaregiverRow";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (user!.role === "caregiver") redirect("/parent");

  const [parentsSnap, caregiversSnap] = await Promise.all([
    db.collection("users").where("familyId", "==", user!.familyId).where("role", "==", "parent").get(),
    db.collection("users").where("familyId", "==", user!.familyId).where("role", "==", "caregiver").get(),
  ]);

  const uids = [...parentsSnap.docs, ...caregiversSnap.docs].map((doc) => doc.id);
  const authUsers = uids.length
    ? (await adminAuth.getUsers(uids.map((uid) => ({ uid })))).users
    : [];
  const emailByUid = new Map(authUsers.map((u) => [u.uid, u.email ?? ""]));

  const parents = parentsSnap.docs.map((doc) => ({
    uid: doc.id,
    name: (doc.data().displayName as string) ?? "Unknown",
    email: emailByUid.get(doc.id) ?? "",
  }));
  const caregivers = caregiversSnap.docs.map((doc) => ({
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

      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Caregivers</h2>
        {caregivers.length === 0 && (
          <p className="text-sm text-muted">No caregivers yet.</p>
        )}
        {caregivers.map((caregiver) => (
          <CaregiverRow key={caregiver.uid} uid={caregiver.uid} name={caregiver.name} email={caregiver.email} />
        ))}
        <AddCaregiverForm />
      </div>
    </div>
  );
}
