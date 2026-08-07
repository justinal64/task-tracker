"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import type { Child } from "@/lib/types";

export default function PointsBadge({
  familyId,
  childId,
  initialBalance,
}: {
  familyId: string;
  childId: string;
  initialBalance: number;
}) {
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    const ref = doc(db, "families", familyId, "children", childId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as Child | undefined;
      if (data) setBalance(data.pointsBalance);
    });
    return unsub;
  }, [familyId, childId]);

  return (
    <div className="flex w-fit items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
      <span className="text-2xl">⭐</span>
      <span className="text-xl font-bold text-accent">{balance}</span>
      <span className="text-sm text-muted">points</span>
    </div>
  );
}
