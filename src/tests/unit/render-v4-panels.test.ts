// Unit tests for the three v2-final panel components: LifeTexturePanel,
// LifeContextPanel, ComparisonSurfacePanel. Per RENDER_V4.md §4.12, §4.13, §4.14.
// Tests validate data structure contracts and SlotContent handling.

import { describe, it, expect } from 'vitest';
import { shouldRenderSlot } from '@/ui/render/should_render_slot';
import type {
  LifeTexturePanel as LifeTexturePanelData,
  LifeContextPanel as LifeContextPanelData,
  ComparisonSurfacePanel as ComparisonSurfacePanelData,
  SlotContent,
} from '@/synthesis';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeSlotContent(text: string): SlotContent {
  return { interpretive_text: text, token_text: text };
}

function makeEmptySlotContent(): SlotContent {
  return { interpretive_text: null, token_text: '' };
}

/* ------------------------------------------------------------------ */
/* A — LifeTexturePanel data contract                                 */
/* ------------------------------------------------------------------ */

describe('LifeTexturePanel — data contract', () => {
  it('valid data structure satisfies type contract', () => {
    const mockData: LifeTexturePanelData = {
      summary: makeSlotContent('The week reads as mixed.'),
      band_label: 'Mixed',
      flags_present: ['Variety', 'Sociality'],
      flags_absent: ['Paid work'],
      load_state_label: 'loaded by work and weekends',
    };

    expect(mockData.band_label).toBe('Mixed');
    expect(mockData.flags_present.length).toBe(2);
    expect(mockData.flags_absent.length).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* B — LifeTexturePanel SlotContent handling                          */
/* ------------------------------------------------------------------ */

describe('LifeTexturePanel — SlotContent handling', () => {
  it('empty flags_present array: length is 0', () => {
    const mockData: LifeTexturePanelData = {
      summary: makeSlotContent('The week reads as empty.'),
      band_label: 'Empty',
      flags_present: [],
      flags_absent: ['Variety', 'Sociality', 'Paid work'],
      load_state_label: 'not loaded',
    };

    expect(mockData.flags_present.length).toBe(0);
  });

  it('empty flags_absent array: length is 0', () => {
    const mockData: LifeTexturePanelData = {
      summary: makeSlotContent('The week reads as textured.'),
      band_label: 'Textured',
      flags_present: ['Variety', 'Sociality', 'Paid work'],
      flags_absent: [],
      load_state_label: 'loaded by work',
    };

    expect(mockData.flags_absent.length).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* C — LifeContextPanel data contract                                 */
/* ------------------------------------------------------------------ */

describe('LifeContextPanel — data contract', () => {
  it('valid data structure satisfies type contract', () => {
    const mockData: LifeContextPanelData = {
      life_stage_summary: makeSlotContent('Reading: building.'),
      work_load_summary: makeSlotContent('Paid work reading: Consuming.'),
      sociality_summary: makeSlotContent('Sociality reading: Balanced.'),
    };

    expect(shouldRenderSlot(mockData.life_stage_summary)).toBe(true);
    expect(shouldRenderSlot(mockData.work_load_summary)).toBe(true);
    expect(shouldRenderSlot(mockData.sociality_summary)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* D — LifeContextPanel SlotContent handling                          */
/* ------------------------------------------------------------------ */

describe('LifeContextPanel — SlotContent handling', () => {
  it('empty life_stage_summary: shouldRenderSlot returns false', () => {
    const mockData: LifeContextPanelData = {
      life_stage_summary: makeEmptySlotContent(),
      work_load_summary: makeSlotContent('Paid work reading: Consuming.'),
      sociality_summary: makeSlotContent('Sociality reading: Balanced.'),
    };

    expect(shouldRenderSlot(mockData.life_stage_summary)).toBe(false);
    expect(shouldRenderSlot(mockData.work_load_summary)).toBe(true);
    expect(shouldRenderSlot(mockData.sociality_summary)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* E — ComparisonSurfacePanel data contract                           */
/* ------------------------------------------------------------------ */

describe('ComparisonSurfacePanel — data contract', () => {
  it('valid data structure satisfies type contract', () => {
    const mockData: ComparisonSurfacePanelData = {
      summary: makeSlotContent('Two named, one surfaced.'),
      summary_id: 'comparison_mixed',
      confirmed: [
        {
          sentence: makeSlotContent('Creator reading confirmed.'),
          source: 'self_report',
          reference: { kind: 'self_report_item', id: 'building_or_making' },
        },
      ],
      quiet: [
        {
          sentence: makeSlotContent('Freedom named but quiet.'),
          source: 'self_report',
          reference: { kind: 'self_report_item', id: 'more_time_to_myself' },
        },
      ],
      surfaced: [
        {
          sentence: makeSlotContent('Experience surfaced.'),
          source: 'architecture',
          reference: {
            kind: 'engine_reading',
            reading_type: 'firing_direction',
            target: 'experience_seeker',
          },
        },
      ],
    };

    expect(mockData.confirmed.length).toBe(1);
    expect(mockData.quiet.length).toBe(1);
    expect(mockData.surfaced.length).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* F — ComparisonSurfacePanel array handling                          */
/* ------------------------------------------------------------------ */

describe('ComparisonSurfacePanel — array handling', () => {
  it('empty confirmed array: length is 0', () => {
    const mockData: ComparisonSurfacePanelData = {
      summary: makeSlotContent('One surfaced, none confirmed.'),
      summary_id: 'comparison_surfaced_only_nothing_really',
      confirmed: [],
      quiet: [],
      surfaced: [
        {
          sentence: makeSlotContent('Experience surfaced.'),
          source: 'architecture',
          reference: {
            kind: 'engine_reading',
            reading_type: 'firing_direction',
            target: 'experience_seeker',
          },
        },
      ],
    };

    expect(mockData.confirmed.length).toBe(0);
    expect(mockData.surfaced.length).toBe(1);
  });

  it('empty quiet array: length is 0', () => {
    const mockData: ComparisonSurfacePanelData = {
      summary: makeSlotContent('One confirmed.'),
      summary_id: 'comparison_all_confirmed',
      confirmed: [
        {
          sentence: makeSlotContent('Creator reading confirmed.'),
          source: 'self_report',
          reference: { kind: 'self_report_item', id: 'building_or_making' },
        },
      ],
      quiet: [],
      surfaced: [],
    };

    expect(mockData.confirmed.length).toBe(1);
    expect(mockData.quiet.length).toBe(0);
    expect(mockData.surfaced.length).toBe(0);
  });
});
