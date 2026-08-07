import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/firebase-admin";
import type { Reward } from "@/lib/types";
import RewardForm from "@/components/RewardForm";
import RewardRow from "@/components/RewardRow";

export default async function RewardsPage() {
  const user = await getSessionUser();
  const rewardsSnap = await db
    .collection("families")
    .doc(user!.familyId)
    .collection("rewards")
    .orderBy("createdAt", "desc")
    .get();

  const rewards = rewardsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Reward),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Rewards</h1>

      <div className="flex flex-col gap-3">
        {rewards.length === 0 && <p className="text-muted">No rewards yet.</p>}
        {rewards.map((reward) => (
          <RewardRow key={reward.id} rewardId={reward.id} reward={reward} />
        ))}
      </div>

      <RewardForm />
    </div>
  );
}
