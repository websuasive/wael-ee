import type {
  ActivityInventoryFile,
  RecommendableVariant,
} from './types';

/**
 * Flattens the v3 activity-variant inventory into a flat list of recommendable
 * variants. Each variant inherits root fields from its parent activity.
 *
 * Pure function. Preserves source order: activities in file order, variants in
 * within-activity order. The recommendable unit's stable id is variant_id.
 */
export function flattenInventory(
  file: ActivityInventoryFile,
): RecommendableVariant[] {
  const flattened: RecommendableVariant[] = [];

  for (const activity of file.activities) {
    for (const variant of activity.variants) {
      const recommendable: RecommendableVariant = {
        ...variant,
        activity_id: activity.activity_id,
        label: activity.label,
        cost_tier: activity.cost_tier,
        websites: activity.websites,
        directions: activity.directions,
        interest_domains: activity.interest_domains,
        novelty_index: activity.novelty_index,
      };
      flattened.push(recommendable);
    }
  }

  return flattened;
}
