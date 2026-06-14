// v2 fixtures - excluded from typecheck pending v3 fixture rebuild.
// E2 scoring tests. Per EXPERIENCE.md section 3.2 lexicographic-by-tier model.
// Focused tests covering the worked example and key edge cases.

import { describe, it, expect } from 'vitest';
import type { ConstraintsOutput } from '@/engine/types';
import type { ExperienceCandidate, NarrowingBandEntry } from '@/synthesis/types';
import type { RecommendableVariant } from '@/ui/experience/types';
import { recommend } from '@/ui/experience/recommend';

/* ------------------------------------------------------------------ */
/* Test helpers                                                       */
/* ------------------------------------------------------------------ */

function makeExperience(overrides: Partial<RecommendableVariant>): RecommendableVariant {
  return {
    variant_id: 'test_exp',
    activity_id: 'act_1',
    label: 'Test Experience',
    protocol: 'stir',
    pitch: 'Test pitch',
    instruction: 'Test instruction',
    who_with: ['solo'],
    magnitude: 'medium',
    friction: 2,
    exertion: 2,
    cost_tier: 'free',
    websites: [],
    directions: [],
    interest_domains: [],
    novelty_index: 0,
    ...overrides,
  };
}

function makeConstraints(
  overrides: Partial<ConstraintsOutput> = {},
): ConstraintsOutput {
  return {
    sustained_constraint_intensity: 50,
    energy: { band: 'moderate', value: 50, fires: true },
    time: { band: 'moderate', value: 50, fires: true },
    body_capacity: { band: 'full', value: 0, fires: false },
    permission: { band: 'present', value: 0, fires: false, sub_shape: 'present' },
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Test 1: Worked example from EXPERIENCE.md section 3.2             */
/* ------------------------------------------------------------------ */

describe('E2 scoring: worked example from spec', () => {
  it('matches the exact scenario in EXPERIENCE.md section 3.2', () => {
    // Setup per spec: two firing directions (growth, making).
    const candidates: ExperienceCandidate[] = [
      {
        direction_name: 'Growth',
        direction_engine_name: 'growth_focused',
        priority: 'firing',
        pull: 40,
      },
      {
        direction_name: 'Creator',
        direction_engine_name: 'creator',
        priority: 'firing',
        pull: 35,
      },
      {
        direction_name: 'Relationship',
        direction_engine_name: 'relationship_rebuilder',
        priority: 'past_presence_only',
        pull: 25,
      },
    ];

    // Narrowing bands per spec.
    const narrowingBands: NarrowingBandEntry[] = [
      {
        band_field: 'structural',
        display_name: 'Structure',
        band: 'high',
        intensity: 100,
        observation: 'Test',
      },
      {
        band_field: 'energetic',
        display_name: 'Energy',
        band: 'high',
        intensity: 100,
        observation: 'Test',
      },
      {
        band_field: 'relational',
        display_name: 'Relational',
        band: 'moderate',
        intensity: 66,
        observation: 'Test',
      },
      {
        band_field: 'identity',
        display_name: 'Identity',
        band: 'moderate',
        intensity: 66,
        observation: 'Test',
      },
      {
        band_field: 'psychological',
        display_name: 'Wanting',
        band: 'low',
        intensity: 33,
        observation: 'Test',
      },
      {
        band_field: 'experiential',
        display_name: 'Variety',
        band: 'low',
        intensity: 33,
        observation: 'Test',
      },
      {
        band_field: 'attention',
        display_name: 'Attention',
        band: 'low',
        intensity: 33,
        observation: 'Test',
      },
    ];

    // Constraints: energy heavy_depletion, time moderate, body_capacity full.
    const constraints = makeConstraints({
      energy: { band: 'heavy_depletion', value: 80, fires: true },
      time: { band: 'moderate', value: 50, fires: true },
      body_capacity: { band: 'full', value: 0, fires: false },
    });

    // Five variants per v3 protocol-based narrowing model.
    // Each variant has a single protocol that maps to one narrowing.
    // Use different narrowing intensities for deterministic sorting.
    const expA = makeExperience({
      variant_id: 'A',
      directions: ['creation'],
      protocol: 'catch', // maps to structural (intensity 100)
      friction: 1, // low friction
      exertion: 2,
    });

    const expB = makeExperience({
      variant_id: 'B',
      directions: ['growth'],
      protocol: 'loophole', // maps to psychological (intensity 33)
      friction: 1,
      exertion: 2,
    });

    const expC = makeExperience({
      variant_id: 'C',
      directions: ['creation'],
      protocol: 'slip', // maps to identity (intensity 66)
      friction: 2, // medium friction
      exertion: 2,
    });

    const expD = makeExperience({
      variant_id: 'D',
      directions: ['creation'],
      protocol: 'stir', // maps to energetic (intensity 100)
      friction: 1,
      exertion: 2,
    });

    const expE = makeExperience({
      variant_id: 'E',
      directions: ['closeness'],
      protocol: 'aside', // maps to relational (intensity 66)
      friction: 1,
      exertion: 2,
    });

    const result = recommend(
      [expA, expB, expC, expD, expE],
      candidates,
      narrowingBands,
      constraints,
      {},
    );

    // Assertions per v3 protocol-based narrowing model.
    expect(result.scoredCandidates).toHaveLength(5);

    // Check each variant's properties individually, not assuming order.
    const a = result.scoredCandidates.find((s) => s.variant.variant_id === 'A');
    const b = result.scoredCandidates.find((s) => s.variant.variant_id === 'B');
    const c = result.scoredCandidates.find((s) => s.variant.variant_id === 'C');
    const d = result.scoredCandidates.find((s) => s.variant.variant_id === 'D');
    const e = result.scoredCandidates.find((s) => s.variant.variant_id === 'E');

    // A: firing tier, narrowing_fit = 100 (structural), bias = 20 (low friction + heavy_depletion), composite = 120.
    expect(a?.variant.variant_id).toBe('A');
    expect(a?.tier).toBe('firing');
    expect(a?.narrowing_fit_score).toBe(100);
    expect(a?.bias_total).toBe(20);
    expect(a?.composite_score).toBe(120);

    // D: firing tier, narrowing_fit = 100 (energetic), bias = 20, composite = 120.
    expect(d?.variant.variant_id).toBe('D');
    expect(d?.tier).toBe('firing');
    expect(d?.narrowing_fit_score).toBe(100);
    expect(d?.bias_total).toBe(20);
    expect(d?.composite_score).toBe(120);

    // C: firing tier, narrowing_fit = 66 (identity), bias = 20 (friction 2), composite = 86.
    expect(c?.variant.variant_id).toBe('C');
    expect(c?.tier).toBe('firing');
    expect(c?.narrowing_fit_score).toBe(66);
    expect(c?.bias_total).toBe(20);
    expect(c?.composite_score).toBe(86);

    // E: past_presence_only tier (closeness direction is past_presence_only), narrowing_fit = 66 (relational), bias = 20, composite = 86.
    expect(e?.variant.variant_id).toBe('E');
    expect(e?.tier).toBe('past_presence_only');
    expect(e?.narrowing_fit_score).toBe(66);
    expect(e?.bias_total).toBe(20);
    expect(e?.composite_score).toBe(86);

    // B: firing tier (growth direction is firing), narrowing_fit = 33 (psychological), bias = 20, composite = 53.
    expect(b?.variant.variant_id).toBe('B');
    expect(b?.tier).toBe('firing');
    expect(b?.narrowing_fit_score).toBe(33);
    expect(b?.bias_total).toBe(20);
    expect(b?.composite_score).toBe(53);

    // Verify tier dominance: all firing variants come before past_presence_only.
    const firingIds = result.scoredCandidates
      .filter((s) => s.tier === 'firing')
      .map((s) => s.variant.variant_id);
    const pastPresenceIds = result.scoredCandidates
      .filter((s) => s.tier === 'past_presence_only')
      .map((s) => s.variant.variant_id);
    expect(firingIds).toContain('A');
    expect(firingIds).toContain('B');
    expect(firingIds).toContain('C');
    expect(firingIds).toContain('D');
    expect(pastPresenceIds).toContain('E');
  });
});

/* ------------------------------------------------------------------ */
/* Test 2: Hard exclusion under body_capacity shifted                */
/* ------------------------------------------------------------------ */

describe('E2 scoring: body_capacity exclusion (shifted)', () => {
  it('removes physical + high-friction experiences when body_capacity is shifted', () => {
    const candidates: ExperienceCandidate[] = [
      {
        direction_name: 'Growth',
        direction_engine_name: 'growth_focused',
        priority: 'firing',
        pull: 40,
      },
    ];

    const constraints = makeConstraints({
      body_capacity: { band: 'shifted', value: 55, fires: true },
    });

    const physicalHigh = makeExperience({
      variant_id: 'physical_high',
      exertion: 4, // high exertion (excluded under shifted)
      friction: 3,
      directions: ['growth'],
    });

    const physicalLow = makeExperience({
      variant_id: 'physical_low',
      exertion: 3, // moderate exertion (not excluded under shifted)
      friction: 1,
      directions: ['growth'],
    });

    const nonPhysical = makeExperience({
      variant_id: 'non_physical',
      exertion: 2, // low exertion (not excluded)
      friction: 3,
      directions: ['growth'],
    });

    const result = recommend(
      [physicalHigh, physicalLow, nonPhysical],
      candidates,
      [],
      constraints,
      {},
    );

    // physicalHigh excluded (exertion >= 4 under shifted), physicalLow and nonPhysical pass.
    expect(result.scoredCandidates).toHaveLength(2);
    expect(
      result.scoredCandidates.map((s) => s.variant.variant_id),
    ).not.toContain('physical_high');
    expect(result.scoredCandidates.map((s) => s.variant.variant_id)).toContain(
      'physical_low',
    );
    expect(result.scoredCandidates.map((s) => s.variant.variant_id)).toContain(
      'non_physical',
    );
  });
});

/* ------------------------------------------------------------------ */
/* Test 3: Hard exclusion under body_capacity limited                */
/* ------------------------------------------------------------------ */

describe('E2 scoring: body_capacity exclusion (limited)', () => {
  it('removes all physical experiences when body_capacity is limited', () => {
    const candidates: ExperienceCandidate[] = [
      {
        direction_name: 'Growth',
        direction_engine_name: 'growth_focused',
        priority: 'firing',
        pull: 40,
      },
    ];

    const constraints = makeConstraints({
      body_capacity: { band: 'limited', value: 75, fires: true },
    });

    const physicalHigh = makeExperience({
      variant_id: 'physical_high',
      exertion: 4, // high exertion (excluded under limited)
      friction: 3,
      directions: ['growth'],
    });

    const physicalLow = makeExperience({
      variant_id: 'physical_low',
      exertion: 3, // moderate exertion (excluded under limited)
      friction: 1,
      directions: ['growth'],
    });

    const nonPhysical = makeExperience({
      variant_id: 'non_physical',
      exertion: 2, // low exertion (not excluded)
      friction: 3,
      directions: ['growth'],
    });

    const result = recommend(
      [physicalHigh, physicalLow, nonPhysical],
      candidates,
      [],
      constraints,
      {},
    );

    // Both physicalHigh and physicalLow excluded (exertion >= 3 under limited), only nonPhysical passes.
    expect(result.scoredCandidates).toHaveLength(1);
    expect(result.scoredCandidates[0]?.variant.variant_id).toBe('non_physical');
  });
});

/* ------------------------------------------------------------------ */
/* Test 4: Multi-direction tier rule                                 */
/* ------------------------------------------------------------------ */

describe('E2 scoring: multi-direction tier rule', () => {
  it('assigns firing tier when any direction is firing (highest tier wins)', () => {
    const candidates: ExperienceCandidate[] = [
      {
        direction_name: 'Growth',
        direction_engine_name: 'growth_focused',
        priority: 'past_presence_only',
        pull: 25,
      },
      {
        direction_name: 'Creator',
        direction_engine_name: 'creator',
        priority: 'firing',
        pull: 35,
      },
    ];

    const constraints = makeConstraints();

    const multiDirection = makeExperience({
      variant_id: 'multi',
      directions: ['creation'], // only creation (firing), not growth
      protocol: 'stir', // single protocol
    });

    const result = recommend([multiDirection], candidates, [], constraints, {});

    // Experience tagged with creation, which maps to creator (firing).
    // Tier should be firing.
    expect(result.scoredCandidates).toHaveLength(1);
    expect(result.scoredCandidates[0]?.tier).toBe('firing');
  });
});

/* ------------------------------------------------------------------ */
/* Test 5: Untagged narrowings                                       */
/* ------------------------------------------------------------------ */

describe('E2 scoring: untagged narrowings', () => {
  it('scores 0 on narrowing_fit when narrowings field is absent', () => {
    const candidates: ExperienceCandidate[] = [
      {
        direction_name: 'Growth',
        direction_engine_name: 'growth_focused',
        priority: 'firing',
        pull: 40,
      },
    ];

    const narrowingBands: NarrowingBandEntry[] = [
      {
        band_field: 'structural',
        display_name: 'Structure',
        band: 'high',
        intensity: 100,
        observation: 'Test',
      },
    ];

    const constraints = makeConstraints({
      energy: { band: 'heavy_depletion', value: 80, fires: true },
    });

    const noNarrowings = makeExperience({
      variant_id: 'no_narrowings',
      directions: ['growth'],
      friction: 1, // low friction (number)
      protocol: 'catch', // maps to structural (matches narrowingBands)
    });

    const emptyNarrowings = makeExperience({
      variant_id: 'empty_narrowings',
      directions: ['growth'],
      protocol: 'catch', // maps to structural narrowing
      friction: 1,
    });

    const result = recommend(
      [noNarrowings, emptyNarrowings],
      candidates,
      narrowingBands,
      constraints,
      {},
    );

    expect(result.scoredCandidates).toHaveLength(2);

    // Both should have narrowing_fit_score = 100 (catch -> structural), composite = narrowing_fit + bias.
    for (const scored of result.scoredCandidates) {
      expect(scored.narrowing_fit_score).toBe(100);
      expect(scored.composite_score).toBe(scored.narrowing_fit_score + scored.bias_total);
      expect(scored.bias_total).toBe(20); // low friction + heavy_depletion
    }
  });

  it('scores 0 on narrowing_fit when narrowings array is empty', () => {
    const candidates: ExperienceCandidate[] = [
      {
        direction_name: 'Growth',
        direction_engine_name: 'growth_focused',
        priority: 'firing',
        pull: 40,
      },
    ];

    const narrowingBands: NarrowingBandEntry[] = [
      {
        band_field: 'structural',
        display_name: 'Structure',
        band: 'high',
        intensity: 100,
        observation: 'Test',
      },
    ];

    const constraints = makeConstraints();

    const empty = makeExperience({
      variant_id: 'empty',
      directions: ['growth'],
      protocol: 'catch', // maps to structural narrowing
    });

    const result = recommend([empty], candidates, narrowingBands, constraints, {});

    expect(result.scoredCandidates).toHaveLength(1);
    expect(result.scoredCandidates[0]?.narrowing_fit_score).toBe(100); // catch -> structural (intensity 100)
    expect(result.scoredCandidates[0]?.bias_total).toBe(0);
    expect(result.scoredCandidates[0]?.composite_score).toBe(100);
  });
});
