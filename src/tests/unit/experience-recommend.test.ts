// v2 fixtures - excluded from typecheck pending v3 fixture rebuild.
// Recommendation algorithm tests. Per EXPERIENCE.md sections 3.2, 3.3, 3.4 (sort), 3.5, 3.6.

import { describe, it, expect } from 'vitest';
import type { ConstraintsOutput } from '@/engine/types';
import type { ExperienceCandidate } from '@/synthesis/types';
import type { Flag, RecommendableVariant } from '@/ui/experience/types';
import {
  recommend,
  _excludedByExertion as excludedByExertion,
} from '@/ui/experience/recommend';

function makeExp(overrides: Partial<RecommendableVariant> & { variant_id: string }): RecommendableVariant {
  return {
    variant_id: overrides.variant_id,
    activity_id: 'act_1',
    label: overrides.label ?? `Variant ${overrides.variant_id}`,
    protocol: overrides.protocol ?? 'stir',
    pitch: 'Test pitch',
    instruction: 'Test instruction',
    who_with: ['solo'],
    magnitude: 'medium',
    friction: overrides.friction ?? 2,
    exertion: overrides.exertion ?? 2,
    cost_tier: overrides.cost_tier ?? 'free',
    websites: [],
    directions: overrides.directions ?? ['experience'],
    interest_domains: [],
    novelty_index: 0,
  };
}

function makeConstraints(over: Partial<{
  sci: number;
  energyBand: ConstraintsOutput['energy']['band'];
  timeBand: ConstraintsOutput['time']['band'];
  bodyBand: ConstraintsOutput['body_capacity']['band'];
  permissionBand: ConstraintsOutput['permission']['band'];
}> = {}): ConstraintsOutput {
  return {
    sustained_constraint_intensity: over.sci ?? 0,
    energy: { value: 0, band: over.energyBand ?? 'full', fires: false },
    time: { value: 0, band: over.timeBand ?? 'open', fires: false },
    body_capacity: { value: 0, band: over.bodyBand ?? 'full', fires: false },
    permission: {
      value: 0,
      band: over.permissionBand ?? 'present',
      sub_shape: 'present',
      fires: false,
    },
  };
}

const NO_FLAGS: Record<string, Flag> = {};

describe('Body-capacity exclusion', () => {
  it('full: nothing excluded', () => {
    expect(
      excludedByExertion(
        makeExp({ variant_id: 'a', friction: 2, exertion: 2 }),
        'full',
      ),
    ).toBe(false);
  });
  it('limited: exertion >= 3 excluded', () => {
    expect(
      excludedByExertion(
        makeExp({ variant_id: 'a', friction: 2, exertion: 3 }),
        'limited',
      ),
    ).toBe(true);
    expect(
      excludedByExertion(
        makeExp({ variant_id: 'b', friction: 2, exertion: 2 }),
        'limited',
      ),
    ).toBe(false);
  });
  it('shifted: exertion >= 4 excluded', () => {
    expect(
      excludedByExertion(
        makeExp({ variant_id: 'a', friction: 2, exertion: 4 }),
        'shifted',
      ),
    ).toBe(true);
    expect(
      excludedByExertion(
        makeExp({ variant_id: 'b', friction: 2, exertion: 3 }),
        'shifted',
      ),
    ).toBe(false);
  });
});

describe('Status flag exclusion', () => {
  it('not_interested and done removed; saved and booked retained', () => {
    const inv = [
      makeExp({ variant_id: 'a' }),
      makeExp({ variant_id: 'b' }),
      makeExp({ variant_id: 'c' }),
      makeExp({ variant_id: 'd' }),
      makeExp({ variant_id: 'e' }),
    ];
    const flags: Record<string, Flag> = {
      b: 'saved',
      c: 'booked',
      d: 'done',
      e: 'not_interested',
    };
    const result = recommend(inv, [], [], makeConstraints(), flags);
    const ids = result.scoredCandidates.map((s) => s.variant.variant_id).sort();
    expect(ids).toEqual(['a', 'b', 'c']);
  });
});

describe('Sort and tiebreak', () => {
  it('ties broken by id ascending (lexicographic)', () => {
    const inv = [
      makeExp({ variant_id: 'z', directions: ['experience'] }),
      makeExp({ variant_id: 'a', directions: ['experience'] }),
      makeExp({ variant_id: 'm', directions: ['experience'] }),
    ];
    const result = recommend(inv, [], [], makeConstraints(), NO_FLAGS);
    expect(result.scoredCandidates.map((s) => s.variant.variant_id)).toEqual([
      'a',
      'm',
      'z',
    ]);
  });

  it('higher score precedes lower score', () => {
    const candidates: ExperienceCandidate[] = [
      { direction_name: 'Creator', direction_engine_name: 'making', priority: 'firing', pull: 80 },
    ];
    const inv = [
      makeExp({ variant_id: 'z', directions: ['experience'] }), // factor1=0
      makeExp({ variant_id: 'a', directions: ['creation'] }),   // factor1=10
    ];
    const result = recommend(inv, candidates, [], makeConstraints(), NO_FLAGS);
    expect(result.scoredCandidates[0]!.variant.variant_id).toBe('a');
  });
});

describe('Quality threshold', () => {
  it('threshold = 0.30 * rank-1 composite_score', () => {
    const candidates: ExperienceCandidate[] = [
      { direction_name: 'Creator', direction_engine_name: 'making', priority: 'firing', pull: 80 },
    ];
    const inv = [makeExp({ variant_id: 'a', directions: ['creation'] })];
    const result = recommend(inv, candidates, [], makeConstraints(), NO_FLAGS);
    // Under new scoring: firing tier with no narrowings and no biases = composite_score 0.
    // Threshold = 0.30 * 0 = 0.
    expect(result.qualityThreshold).toBe(0);
  });

  it('threshold is 0 when rank 1 composite_score is 0', () => {
    const inv = [makeExp({ variant_id: 'a', directions: ['experience'] })];
    const result = recommend(inv, [], [], makeConstraints(), NO_FLAGS);
    expect(result.scoredCandidates[0]!.composite_score).toBe(0);
    expect(result.qualityThreshold).toBe(0);
  });

  it('threshold is 0 when candidate set is empty', () => {
    const result = recommend([], [], [], makeConstraints(), NO_FLAGS);
    expect(result.qualityThreshold).toBe(0);
    expect(result.scoredCandidates).toEqual([]);
  });
});

describe('Determinism', () => {
  it('same inputs produce identical outputs', () => {
    const candidates: ExperienceCandidate[] = [
      { direction_name: 'Creator', direction_engine_name: 'making', priority: 'firing', pull: 80 },
      { direction_name: 'Experience Seeker', direction_engine_name: 'experience_seeker', priority: 'past_presence_only', pull: 30 },
    ];
    const inv = [
      makeExp({ variant_id: 'a', directions: ['creation'] }),
      makeExp({ variant_id: 'b', directions: ['experience'] }),
      makeExp({ variant_id: 'c', directions: ['creation', 'growth'], friction: 1 }),
      makeExp({ variant_id: 'd', directions: ['closeness'] }),
    ];
    const c = makeConstraints({ sci: 80 });
    const r1 = recommend(inv, candidates, [], c, NO_FLAGS);
    const r2 = recommend(inv, candidates, [], c, NO_FLAGS);
    expect(r2).toEqual(r1);
  });
});

describe('Full pipeline integration', () => {
  it('body-capacity exclusion runs before scoring', () => {
    const inv = [
      makeExp({ variant_id: 'a', friction: 3, exertion: 4 }),
      makeExp({ variant_id: 'b', friction: 2, exertion: 3 }),
      makeExp({ variant_id: 'c', friction: 2, exertion: 2 }),
    ];
    const c = makeConstraints({ bodyBand: 'shifted' });
    const result = recommend(inv, [], [], c, NO_FLAGS);
    expect(result.scoredCandidates.map((s) => s.variant.variant_id).sort()).toEqual([
      'b',
      'c',
    ]);
  });

  it('limited body band excludes exertion >= 3', () => {
    const inv = [
      makeExp({ variant_id: 'a', friction: 2, exertion: 3 }),
      makeExp({ variant_id: 'b', friction: 2, exertion: 4 }),
      makeExp({ variant_id: 'c', friction: 2, exertion: 2 }),
    ];
    const c = makeConstraints({ bodyBand: 'limited' });
    const result = recommend(inv, [], [], c, NO_FLAGS);
    expect(result.scoredCandidates.map((s) => s.variant.variant_id)).toEqual(['c']);
  });
});
