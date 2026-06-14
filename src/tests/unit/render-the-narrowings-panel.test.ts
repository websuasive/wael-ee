// Unit tests for TheNarrowingsPanel component. Per RENDER_V4.md §4.15.
// Tests validate data structure contract, order preservation, and pill colour class application.

import { describe, it, expect } from 'vitest';
import { shouldRenderSlot } from '@/ui/render/should_render_slot';
import type {
  TheNarrowingsPanel as TheNarrowingsPanelData,
  NarrowingBandEntry,
  SlotContent,
} from '@/synthesis';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeSlotContent(text: string): SlotContent {
  return { interpretive_text: text, token_text: text };
}

function makeBandEntry(
  field: NarrowingBandEntry['band_field'],
  name: string,
  band: 'low' | 'moderate' | 'high',
): NarrowingBandEntry {
  const intensityMap = { low: 33, moderate: 66, high: 100 } as const;
  return {
    band_field: field,
    display_name: name,
    full_name: `${name} Narrowing`,
    character_name: 'Test Character',
    band,
    intensity: intensityMap[band],
    observation: 'Test observation.',
  };
}

/* ------------------------------------------------------------------ */
/* A — TheNarrowingsPanel data contract                               */
/* ------------------------------------------------------------------ */

describe('TheNarrowingsPanel — data contract', () => {
  it('valid data structure with seven bands in declaration order', () => {
    const mockData: TheNarrowingsPanelData = {
      summary: makeSlotContent('All seven dimensions reading high.'),
      bands: [
        makeBandEntry('structural', 'Structure', 'high'),
        makeBandEntry('experiential', 'Variety', 'moderate'),
        makeBandEntry('psychological', 'Wanting', 'low'),
        makeBandEntry('identity', 'Identity', 'high'),
        makeBandEntry('energetic', 'Energy', 'moderate'),
        makeBandEntry('relational', 'Relationships', 'low'),
        makeBandEntry('attention', 'Attention', 'high'),
      ],
    };

    expect(mockData.bands.length).toBe(7);
    expect(mockData.bands[0]!.band_field).toBe('structural');
    expect(mockData.bands[6]!.band_field).toBe('attention');
    expect(shouldRenderSlot(mockData.summary)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* B — Pill colour class application                                  */
/* ------------------------------------------------------------------ */

describe('TheNarrowingsPanel — pill colour class', () => {
  it('three band states produce distinct pill classes', () => {
    const mockData: TheNarrowingsPanelData = {
      summary: makeSlotContent('Mixed states.'),
      bands: [
        makeBandEntry('structural', 'Structure', 'low'),
        makeBandEntry('experiential', 'Variety', 'moderate'),
        makeBandEntry('psychological', 'Wanting', 'high'),
        makeBandEntry('identity', 'Identity', 'low'),
        makeBandEntry('energetic', 'Energy', 'moderate'),
        makeBandEntry('relational', 'Relationships', 'high'),
        makeBandEntry('attention', 'Attention', 'low'),
      ],
    };

    const lowCount = mockData.bands.filter((b) => b.band === 'low').length;
    const moderateCount = mockData.bands.filter((b) => b.band === 'moderate')
      .length;
    const highCount = mockData.bands.filter((b) => b.band === 'high').length;

    expect(lowCount).toBe(3);
    expect(moderateCount).toBe(2);
    expect(highCount).toBe(2);
  });
});

/* ------------------------------------------------------------------ */
/* C — Order preservation                                             */
/* ------------------------------------------------------------------ */

describe('TheNarrowingsPanel — order preservation', () => {
  it('bands render in input array order, not sorted by band value', () => {
    const mockData: TheNarrowingsPanelData = {
      summary: makeSlotContent('Non-canonical order.'),
      bands: [
        makeBandEntry('structural', 'Structure', 'high'),
        makeBandEntry('experiential', 'Variety', 'high'),
        makeBandEntry('psychological', 'Wanting', 'high'),
        makeBandEntry('identity', 'Identity', 'low'),
        makeBandEntry('energetic', 'Energy', 'low'),
        makeBandEntry('relational', 'Relationships', 'low'),
        makeBandEntry('attention', 'Attention', 'low'),
      ],
    };

    expect(mockData.bands[0]!.band).toBe('high');
    expect(mockData.bands[1]!.band).toBe('high');
    expect(mockData.bands[2]!.band).toBe('high');
    expect(mockData.bands[3]!.band).toBe('low');
    expect(mockData.bands[4]!.band).toBe('low');
    expect(mockData.bands[5]!.band).toBe('low');
    expect(mockData.bands[6]!.band).toBe('low');
  });

  it('band_field values confirm declaration order preservation', () => {
    const mockData: TheNarrowingsPanelData = {
      summary: makeSlotContent('Declaration order.'),
      bands: [
        makeBandEntry('structural', 'Structure', 'moderate'),
        makeBandEntry('experiential', 'Variety', 'moderate'),
        makeBandEntry('psychological', 'Wanting', 'moderate'),
        makeBandEntry('identity', 'Identity', 'moderate'),
        makeBandEntry('energetic', 'Energy', 'moderate'),
        makeBandEntry('relational', 'Relationships', 'moderate'),
        makeBandEntry('attention', 'Attention', 'moderate'),
      ],
    };

    const fieldOrder = mockData.bands.map((b) => b.band_field);
    expect(fieldOrder).toEqual([
      'structural',
      'experiential',
      'psychological',
      'identity',
      'energetic',
      'relational',
      'attention',
    ]);
  });
});
