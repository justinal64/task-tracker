import { dateKey } from "@/lib/pin";
import { chartColorForIndex } from "@/lib/chartPalette";

export interface PointsHistorySeries {
  id: string;
  name: string;
  avatarEmoji: string;
  color: string;
  values: number[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Query cutoff for fetching enough activity to build the history window (with a 1-day buffer). */
export function getHistoryWindowStartMs(windowDays: number): number {
  return Date.now() - (windowDays + 1) * ONE_DAY_MS;
}

/**
 * Builds a daily cumulative-points series per child for the trailing
 * `windowDays` days, anchored to each child's current pointsBalance so the
 * line always ends at the real, present-day total.
 */
export function buildPointsHistory(
  children: { id: string; name: string; avatarEmoji: string; pointsBalance: number }[],
  entries: { childId: string; points: number; createdAt: number; voided: boolean }[],
  windowDays: number
): { days: string[]; series: PointsHistorySeries[] } {
  const today = new Date();
  const days: string[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    days.push(dateKey(new Date(today.getTime() - i * ONE_DAY_MS)));
  }
  const windowStartMs = today.getTime() - (windowDays - 1) * ONE_DAY_MS;

  const series = children.map((child, index) => {
    const netByDay = new Map<string, number>();
    let pointsBeforeWindow = 0;

    for (const entry of entries) {
      if (entry.childId !== child.id || entry.voided) continue;
      if (entry.createdAt < windowStartMs) {
        pointsBeforeWindow += entry.points;
      } else {
        const key = dateKey(new Date(entry.createdAt));
        netByDay.set(key, (netByDay.get(key) ?? 0) + entry.points);
      }
    }

    let running = pointsBeforeWindow;
    const values = days.map((day) => {
      running += netByDay.get(day) ?? 0;
      return running;
    });

    return {
      id: child.id,
      name: child.name,
      avatarEmoji: child.avatarEmoji,
      color: chartColorForIndex(index),
      values,
    };
  });

  return { days, series };
}
