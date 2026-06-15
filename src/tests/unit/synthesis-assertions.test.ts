// Unit tests for the synthesis-side assertion runner (src/fixtures/synthesis-assertions.ts).

import { describe, it, expect } from 'vitest';
import {
  runSynthesisAssertions,
  formatSynthesisFailures,
} from '@/fixtures/synthesis-assertions';
import type { ExpectedSynthesisAssertions } from '@/fixtures/types';
import { synthesise } from '@/synthesis';
import type { RenderingInstructions } from '@/synthesis';
import { makeEngineOutput, makeInputMap } from './synthesis-test-helpers';

function build(
  outputOverrides: Parameters<typeof makeEngineOutput>[0] = {},
  inputOverrides: Parameters<typeof makeInputMap>[0] = {},
): RenderingInstructions {
  return synthesise(
    makeEngineOutput(outputOverrides),
    makeInputMap(inputOverrides),
  );
}

/* ------------------------------------------------------------------ */
/* A — sentinel matchers (leaf)                                       */
/* ------------------------------------------------------------------ */

describe('runSynthesisAssertions — leaf sentinels', () => {
  it('<NON_NULL> against a string → pass', () => {
    const actual = build({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const r = runSynthesisAssertions(
      { recognition_paragraph: { interpretive_text: '<NON_NULL>' } },
      actual,
    );
    expect(r.passed).toBe(1);
    expect(r.failed).toBe(0);
  });

  it('<NON_NULL> against null → fail', () => {
    const actual = build();
    const r = runSynthesisAssertions(
      { recognition_paragraph: { interpretive_text: '<NON_NULL>' } },
      actual,
    );
    expect(r.failed).toBe(1);
  });

  it('<NON_NULL> against undefined → fail', () => {
    const actual = build();
    // A field that does not exist on the actual is undefined.
    const r = runSynthesisAssertions(
      { headline: { situation_text: '<NON_NULL>' } },
      // Force-cast: simulate an undefined situation_text. Baseline build returns
      // a defined situation_text, so flip to a firing-set scenario for null.
      actual,
    );
    // Baseline (no firing) returns situation_text === 'Directions all reading low.', non-null. Pass.
    expect(r.passed).toBe(1);
    // Now simulate an actual whose field is undefined by tampering at the type level.
    const tampered = {
      ...actual,
      headline: { ...actual.headline, situation_text: undefined as unknown as string | null },
    } as RenderingInstructions;
    const r2 = runSynthesisAssertions(
      { headline: { situation_text: '<NON_NULL>' } },
      tampered,
    );
    expect(r2.failed).toBe(1);
  });

  it('<NULL> against null → pass', () => {
    const actual = build({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    // recognition_paragraph.token_text is a string, but situation_text is null when firing set is non-empty.
    const r = runSynthesisAssertions(
      { headline: { situation_text: '<NULL>' } },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('<NULL> against a string → fail', () => {
    const actual = build();
    const r = runSynthesisAssertions(
      { headline: { situation_text: '<NULL>' } },
      actual,
    );
    expect(r.failed).toBe(1);
  });

  it('<NULL> against undefined → fail (distinguishes null from undefined)', () => {
    const actual = build();
    const tampered = {
      ...actual,
      headline: {
        ...actual.headline,
        situation_text: undefined as unknown as string | null,
      },
    } as RenderingInstructions;
    const r = runSynthesisAssertions(
      { headline: { situation_text: '<NULL>' } },
      tampered,
    );
    expect(r.failed).toBe(1);
  });

  it('<NON_NULL> against empty string → pass', () => {
    const actual = build();
    // recognition_paragraph.token_text === '' on baseline empty firing set.
    const r = runSynthesisAssertions(
      { recognition_paragraph: { token_text: '<NON_NULL>' } },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('<NON_NULL> against 0 → pass', () => {
    const actual = build();
    // constraints_panel.sustained_constraint_intensity = 100 on baseline; force a 0 case.
    const out = build({
      constraints: { sustained_constraint_intensity: 0 },
    });
    const r = runSynthesisAssertions(
      {
        constraints_panel: { sustained_constraint_intensity: '<NON_NULL>' },
      },
      out,
    );
    expect(r.passed).toBe(1);
    void actual;
  });

  it('<NON_NULL> against false → pass', () => {
    const actual = build();
    // cross_cutting_panel.outputs[*].fires === false on baseline.
    const r = runSynthesisAssertions(
      { cross_cutting_panel: { outputs: { between_shapes: '<NON_NULL>' } } },
      actual,
    );
    expect(r.passed).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* C — <PRESENT>/<ABSENT> for experience_candidate_directions          */
/* ------------------------------------------------------------------ */

describe('runSynthesisAssertions — experience_candidates membership', () => {
  it('<PRESENT> for engine-name keyed candidate → pass', () => {
    const actual = build({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const r = runSynthesisAssertions(
      { experience_candidate_directions: { creator: '<PRESENT>' } },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('<ABSENT> when not a candidate → pass', () => {
    const actual = build();
    const r = runSynthesisAssertions(
      { experience_candidate_directions: { creator: '<ABSENT>' } },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('sub-object asserts presence AND priority/pull', () => {
    const actual = build({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const r = runSynthesisAssertions(
      {
        experience_candidate_directions: {
          creator: { priority: 'firing', pull: { between: [70, 90] } },
        },
      },
      actual,
    );
    expect(r.failed).toBe(0);
    expect(r.passed).toBe(2);
  });
});

/* ------------------------------------------------------------------ */
/* D — direction_cards keyed by engine name                            */
/* ------------------------------------------------------------------ */

describe('runSynthesisAssertions — direction_cards engine-name lookup', () => {
  it('expected key resolves the matching card', () => {
    const actual = build({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const r = runSynthesisAssertions(
      { direction_cards: { creator: { visual_state: 'named' } } },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('unknown engine name → missing-entry failure', () => {
    const actual = build();
    const expected = {
      direction_cards: {
        // intentionally invalid key (typo).
        makking: { visual_state: 'named' },
      },
    } as unknown as ExpectedSynthesisAssertions;
    const r = runSynthesisAssertions(expected, actual);
    expect(r.failed).toBe(1);
    expect(r.results[0]!.reason).toContain('missing entry');
  });
});

/* ------------------------------------------------------------------ */
/* E — cross_cutting_panel.outputs keyed by engine name                */
/* ------------------------------------------------------------------ */

describe('runSynthesisAssertions — cross_cutting_panel outputs', () => {
  it('engine-name key asserts the fires flag', () => {
    const actual = build();
    const r = runSynthesisAssertions(
      { cross_cutting_panel: { outputs: { between_shapes: false } } },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('mismatched fires → fail', () => {
    const actual = build();
    const r = runSynthesisAssertions(
      { cross_cutting_panel: { outputs: { between_shapes: true } } },
      actual,
    );
    expect(r.failed).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* F — domains_panel.reduced_groups keyed by engine value              */
/* ------------------------------------------------------------------ */

describe('runSynthesisAssertions — domains_panel reduced_groups', () => {
  it('engine-value key resolves the matching group', () => {
    // Build via direct domains override so the makings domain fires reduced_wants_back.
    const out = synthesise(
      makeEngineOutput({
        domains: {
          making: { fires: true, value: 'reduced_wants_back' },
        },
      }),
      makeInputMap(),
    );
    const r = runSynthesisAssertions(
      {
        domains_panel: {
          reduced_groups: {
            reduced_wants_back: { domain_engine_names: { contains: ['making'] } },
          },
        },
      },
      out,
    );
    expect(r.passed).toBe(1);
    expect(r.failed).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* G — constraints_panel.constraint_lines keyed by engine name         */
/* ------------------------------------------------------------------ */

describe('runSynthesisAssertions — constraints_panel constraint_lines', () => {
  it('<PRESENT> for a firing constraint → pass', () => {
    // Baseline: SCI 100, all four constraints fire.
    const actual = build();
    const r = runSynthesisAssertions(
      { constraints_panel: { constraint_lines: { permission: '<PRESENT>' } } },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('<ABSENT> for a non-firing constraint → pass', () => {
    const actual = build({
      constraints: {
        sustained_constraint_intensity: 0,
        energy: { value: 100, band: 'full', fires: false },
        time: { value: 100, band: 'open', fires: false },
        body_capacity: { value: 100, band: 'full', fires: false },
        permission: {
          value: 100,
          band: 'present',
          sub_shape: 'present',
          fires: false,
        },
      },
    });
    const r = runSynthesisAssertions(
      { constraints_panel: { constraint_lines: { permission: '<ABSENT>' } } },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('sub-object asserts band_label on a firing line', () => {
    const actual = build();
    const r = runSynthesisAssertions(
      {
        constraints_panel: {
          constraint_lines: {
            energy: { band_label: { equals: ['heavy depletion'] } as never },
          },
        },
      },
      actual,
    );
    // band_label is a string ("Energy in heavy depletion." or similar). The
    // {equals} matcher operates on arrays — this assertion should fail because
    // band_label is not an array. We want a structural test: confirm the runner
    // walks into the sub-field without crashing.
    expect(r.results[0]!.path).toBe(
      'constraints_panel.constraint_lines.energy.band_label',
    );
  });
});

/* ------------------------------------------------------------------ */
/* H — existing matchers still work                                    */
/* ------------------------------------------------------------------ */

describe('runSynthesisAssertions — bare and existing matchers', () => {
  it('bare equality on visual_state → pass', () => {
    const actual = build({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const r = runSynthesisAssertions(
      { direction_cards: { creator: { visual_state: 'named' } } },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('{between} on chart bubble pull → pass', () => {
    const actual = build({
      directions: [{ direction: 'creator', pull: 75, pull_quality: ['real'] }],
    });
    const r = runSynthesisAssertions(
      {
        direction_evidence_chart: {
          bubbles: { creator: { pull: { between: [70, 80] } } },
        },
      },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('{contains} on direction_engine_names → pass', () => {
    const actual = build({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
      ],
    });
    const r = runSynthesisAssertions(
      {
        headline: { direction_engine_names: { contains: ['creator', 'freedom_designer'] } },
      },
      actual,
    );
    expect(r.passed).toBe(1);
  });

  it('{equals} on direction_engine_names → pass (multiset)', () => {
    const actual = build({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
      ],
    });
    const r = runSynthesisAssertions(
      {
        headline: { direction_engine_names: { equals: ['freedom_designer', 'creator'] } },
      },
      actual,
    );
    expect(r.passed).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* I — empty assertions                                                */
/* ------------------------------------------------------------------ */

describe('runSynthesisAssertions — empty', () => {
  it('{} → 0 results, 0 passed, 0 failed', () => {
    const r = runSynthesisAssertions({}, build());
    expect(r.results).toEqual([]);
    expect(r.passed).toBe(0);
    expect(r.failed).toBe(0);
    expect(r.total).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* J — multi-block walk                                                */
/* ------------------------------------------------------------------ */

describe('runSynthesisAssertions — multi-block walk', () => {
  it('assertions across all 10 top-level blocks complete', () => {
    const actual = build({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['phantom', 'real'] },
      ],
      cross_cutting: { between_shapes: true },
    });
    const expected: ExpectedSynthesisAssertions = {
      headline: { direction_engine_names: { contains: ['creator'] } },
      recognition_paragraph: { interpretive_text: '<NON_NULL>' },
      pattern_paragraph: { match: true },
      direction_cards: { creator: { visual_state: 'named' } },
      direction_evidence_chart: {
        bubbles: { creator: { pull: { between: [70, 90] } } },
        caption: { token_text: '<NON_NULL>' },
      },
      domains_panel: { summary: { token_text: '<NON_NULL>' } },
      constraints_panel: { sustained_constraint_intensity: { between: [0, 100] } },
      cross_cutting_panel: { outputs: { between_shapes: true } },
      experience_candidate_directions: { creator: '<PRESENT>' },
    };
    const r = runSynthesisAssertions(expected, actual);
    // 9 leaf assertions across 9 blocks (pattern_paragraph is now a simple boolean match).
    expect(r.total).toBe(9);
    expect(r.failed).toBe(0);
    expect(r.passed).toBe(9);
  });
});

/* ------------------------------------------------------------------ */
/* K — formatSynthesisFailures                                         */
/* ------------------------------------------------------------------ */

describe('formatSynthesisFailures', () => {
  it('no failures → empty string', () => {
    const r = runSynthesisAssertions({}, build());
    expect(formatSynthesisFailures(r)).toBe('');
  });

  it('with failures → multi-line summary', () => {
    const actual = build();
    const r = runSynthesisAssertions(
      {
        cross_cutting_panel: { outputs: { between_shapes: true } },
      },
      actual,
    );
    const out = formatSynthesisFailures(r);
    expect(out).toMatch(/^1 of 1 assertions failed:/);
    expect(out).toContain('cross_cutting_panel.outputs.between_shapes');
  });
});
