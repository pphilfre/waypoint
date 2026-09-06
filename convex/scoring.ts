export type WeightedCriterion = { id: string; maxScore: number; weight: number };

export function calculateWeightedScore(criteria: WeightedCriterion[], values: Map<string, number>) {
  const totalWeight = criteria.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (!totalWeight) return undefined;
  return Math.round(criteria.reduce((sum, item) => sum + ((values.get(item.id) ?? 0) / Math.max(1, item.maxScore)) * Math.max(0, item.weight), 0) / totalWeight * 100);
}
