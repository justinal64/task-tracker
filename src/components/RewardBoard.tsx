"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import RewardCard from "@/components/RewardCard";
import { isAssignedToChild } from "@/lib/assignment";
import type { Child, Reward } from "@/lib/types";

interface RewardWithId extends Reward {
  id: string;
}

export default function RewardBoard({
  familyId,
  childId,
  initialRewards,
  initialRedeemedIds,
  initialBalance,
}: {
  familyId: string;
  childId: string;
  initialRewards: RewardWithId[];
  initialRedeemedIds: string[];
  initialBalance: number;
}) {
  const [rewards, setRewards] = useState(initialRewards);
  const [redeemed, setRedeemed] = useState(new Set(initialRedeemedIds));
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    const q = query(collection(db, "families", familyId, "rewards"), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Reward) }))
        .filter((r) => isAssignedToChild(r.assignedTo, childId));
      setRewards(next);
    });
    return unsub;
  }, [familyId, childId]);

  useEffect(() => {
    const ref = doc(db, "families", familyId, "children", childId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as Child | undefined;
      if (data) setBalance(data.pointsBalance);
    });
    return unsub;
  }, [familyId, childId]);

  if (rewards.length === 0) {
    return <p className="text-muted">No rewards yet — ask a parent to add some!</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rewards.map((reward) => (
        <RewardCard
          key={reward.id}
          rewardId={reward.id}
          title={reward.title}
          description={reward.description}
          cost={reward.cost}
          stock={reward.stock}
          redeemed={redeemed.has(reward.id)}
          affordable={balance >= reward.cost}
          onRedeemed={() =>
            setRedeemed((prev) => {
              const next = new Set(prev);
              next.add(reward.id);
              return next;
            })
          }
        />
      ))}
    </div>
  );
}
