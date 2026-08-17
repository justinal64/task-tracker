/** Renders a points balance/cost as "N pts" normally, or as a dollar amount
 * when centsPerPoint is set (cash allowance mode) -- see Child.centsPerPoint. */
export function formatBalance(points: number, centsPerPoint: number | null): string {
  if (centsPerPoint == null) return `${points} pts`;
  const dollars = (points * centsPerPoint) / 100;
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
