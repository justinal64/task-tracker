/**
 * Fixed categorical order from the dataviz skill's validated reference
 * palette (light mode) -- never cycled, assigned by a kid's position in
 * the (already-alphabetical) kids list. Passes CVD + contrast checks for
 * up to 8 adjacent series (line charts use the adjacent pairlist).
 */
export const CHART_CATEGORICAL_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export function chartColorForIndex(index: number): string {
  return CHART_CATEGORICAL_COLORS[index % CHART_CATEGORICAL_COLORS.length];
}
