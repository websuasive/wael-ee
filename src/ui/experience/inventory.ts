// Inventory accessor (the data seam).
//
// Single source for the flattened experience inventory. Today this reads the
// bundled JSON synchronously. Later (Supabase), this is the one place that
// changes — callers consume loadInventory() and need not know the source.
//
// Existing components (ForYouFeed, BrowseList) still import the JSON directly;
// they predate this accessor and are migrated separately. New surfaces use this.

import inventoryFile from './data/experiences.json';
import { flattenInventory } from './flatten';
import type { ActivityInventoryFile, RecommendableVariant } from './types';

/**
 * Returns the full flattened inventory as RecommendableVariant[].
 * Synchronous in v3 (bundled JSON). The signature is intentionally simple;
 * a future Supabase-backed version may return a Promise, at which point
 * callers adopt the async form. For now, callers treat this as the single
 * accessor for inventory data instead of importing the JSON directly.
 */
export function loadInventory(): RecommendableVariant[] {
  return flattenInventory(inventoryFile as ActivityInventoryFile);
}
