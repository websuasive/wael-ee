// Direction name mapping. Per EXPERIENCE.md section 3.1. Three naming spaces
// exist in the system: engine direction names (the canonical internal form),
// inventory direction tags (used by content authors in experiences.json), and
// display names (emitted by synthesis and shown to the man). The recommendation
// algorithm and filter logic operate on engine names; both other spaces are
// translated via the records below before comparison.

import type { DirectionName } from '../../../engine/types';
import type { Activity } from '../types';

/**
 * Inventory tag to engine direction name. Two of the six inventory tags differ
 * from their engine names: `creation` -> `making`, `closeness` -> `relationship`.
 */
export const inventoryTagToEngineDirection: Record<string, DirectionName> = {
  contribution: 'contributor',
  experience: 'experience_seeker',
  freedom: 'freedom_designer',
  growth: 'growth_focused',
  creation: 'creator',
  closeness: 'relationship_rebuilder',
};

/* ------------------------------------------------------------------ */
/* Build-time consistency checks: section 3.1                        */
/* ------------------------------------------------------------------ */

/**
 * Inventory coverage check. Returns the set of direction tags found in the
 * inventory that are not keys of inventoryTagToEngineDirection. An empty
 * result means every tag is mapped. Per section 11.6 this is a content
 * concern, not a runtime crash: callers may warn, log, or assert as fits the
 * context.
 */
export function findUnmappedInventoryTags(
  activities: readonly Activity[],
): string[] {
  const unmapped = new Set<string>();
  for (const activity of activities) {
    for (const tag of activity.directions) {
      if (!(tag in inventoryTagToEngineDirection)) {
        unmapped.add(tag);
      }
    }
  }
  return [...unmapped].sort();
}

