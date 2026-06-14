// v2 fixtures - excluded from typecheck pending v3 fixture rebuild.
// Direction-mapping coverage tests. Per EXPERIENCE.md section 3.1.
// E1 note: displayNameToEngineDirection and findMissingDisplayNames retired.
// The recommendation algorithm reads direction_engine_name directly from
// synthesis output per SYNTHESIS.md section 5.9.
//
// Stage 2 rebuild: findUnmappedInventoryTags now takes Activity[] (v3);
// update fixtures to pass Activity[] not Experience[].

import { describe, it, expect } from 'vitest';
import type { DirectionName } from '@/engine/types';
import {
  inventoryTagToEngineDirection,
  findUnmappedInventoryTags,
} from '@/ui/experience/data/direction_mapping';
import type { Activity, ActivityInventoryFile } from '@/ui/experience/types';
import inventoryFile from '@/ui/experience/data/experiences.json';

const ALL_ENGINE_DIRECTIONS: readonly DirectionName[] = [
  'contributor',
  'creator',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'relationship_rebuilder',
];

const inventory: Activity[] = (inventoryFile as ActivityInventoryFile)
  .activities as Activity[];

describe('direction_mapping: inventory tag map', () => {
  it('contains exactly six entries', () => {
    expect(Object.keys(inventoryTagToEngineDirection).length).toBe(6);
  });

  it('maps each tag to a valid DirectionName', () => {
    for (const tag of Object.keys(inventoryTagToEngineDirection)) {
      const engine = inventoryTagToEngineDirection[tag];
      expect(ALL_ENGINE_DIRECTIONS).toContain(engine);
    }
  });

  it('covers every direction tag actually used in the inventory', () => {
    const unmapped = findUnmappedInventoryTags(inventory);
    expect(unmapped).toEqual([]);
  });
});
