import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import { isAssignedToChild } from "@/lib/assignment";
import type { Child, Reward } from "@/lib/types";
import RewardBoard from "@/components/RewardBoard";

export default async function KidRewardsPage() {
  const user = await getSessionUser();
  const childId = user!.childId!;
  const familyRef = db.collection("families").doc(user!.familyId);

  const [rewardsSnap, childSnap] = await Promise.all([
    familyRef.collection("rewards").where("active", "==", true).get(),
    familyRef.collection("children").doc(childId).get(),
  ]);

  const rewards = rewardsSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Reward) }))
    .filter((reward) => isAssignedToChild(reward.assignedTo, childId));

  const redemptionChecks = await Promise.all(
    rewards.map((reward) =>
      familyRef.collection("activity").doc(`redemption__${reward.id}__${childId}`).get()
    )
  );
  const redeemedIds = rewards.filter((_, i) => redemptionChecks[i].exists).map((r) => r.id);

  const child = childSnap.data() as Child;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Rewards</h1>
      <RewardBoard
        familyId={user!.familyId}
        childId={childId}
        initialRewards={rewards}
        initialRedeemedIds={redeemedIds}
        initialBalance={child.pointsBalance}
      />
    </div>
  );
}
