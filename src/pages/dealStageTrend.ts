export type DealTrend = "increase" | "decrease" | "steady";

export function getDealStageTrend(value: number, previousValue: number): DealTrend {
  if (value > previousValue) return "increase";
  if (value < previousValue) return "decrease";
  return "steady";
}
