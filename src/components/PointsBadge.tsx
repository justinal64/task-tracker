"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { formatBalance } from "@/lib/currency";
import type { Child } from "@/lib/types";

export default function PointsBadge({
  familyId,
  childId,
  initialBalance,
  initialCentsPerPoint = null,
}: {
  familyId: string;
  childId: string;
  initialBalance: number;
  initialCentsPerPoint?: number | null;
}) {
  const [balance, setBalance] = useState(initialBalance);
  const [centsPerPoint, setCentsPerPoint] = useState(initialCentsPerPoint);

  useEffect(() => {
    const ref = doc(db, "families", familyId, "children", childId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as Child | undefined;
      if (data) {
        setBalance(data.pointsBalance);
        setCentsPerPoint(data.centsPerPoint ?? null);
      }
    });
    return unsub;
  }, [familyId, childId]);

  return (
    <div className="flex w-fit items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
      <span className="text-2xl">{centsPerPoint == null ? "⭐" : "💵"}</span>
      <span className="text-xl font-bold text-accent">{formatBalance(balance, centsPerPoint)}</span>
      {centsPerPoint == null && <span className="text-sm text-muted">points</span>}
    </div>
  );
}
