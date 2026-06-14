// v2 fixtures - excluded from typecheck pending v3 fixture rebuild.
// Direction-overlap mechanism tests for diversify.ts. Per EXPERIENCE.md §3.4
// (E3 revision: no-three-in-a-row uses set intersection on translated
// experience.directions[], not primary-direction comparison).

import { describe, it, expect } from 'vitest';
import type { RecommendableVariant } from '@/ui/experience/types';
import type { ScoredVariant } from '@/ui/experience/recommend';
import { diversify } from '@/ui/experience/diversify';

function makeExp(id: string, directions: string[]): RecommendableVariant {
  return {
    variant_id: id,
    activity_id: 'act_1',
    label: id,
    protocol: 'stir',
    pitch: 'Test pitch',
    instruction: 'Test instruction',
    who_with: ['solo'],
    magnitude: 'medium',
    friction: 2,
    exertion: 2,
    cost_tier: 'free',
    websites: [],
    directions,
    interest_domains: [],
    novelty_index: 0,
  };
}

function makeScored(
  id: string,
  directions: string[],
  composite_score: number,
): ScoredVariant {
  return {
    variant: makeExp(id, directions),
    tier: 'firing',
    narrowing_fit_score: 0,
    bias_total: 0,
    composite_score,
  };
}

describe('diversify: direction-overlap mechanism', () => {
  it('no violation when three consecutive experiences share no common direction', () => {
    // A: [creation] -> {making}
    // B: [creation, growth] -> {making, growth}
    // C: [growth] -> {growth}
    // Intersection: {making} ∩ {making, growth} ∩ {growth} = empty set
    // No violation should fire; no swap should occur.
    const arr: ScoredVariant[] = [
      makeScored('a', ['creation'], 100),
      makeScored('b', ['creation', 'growth_focused'], 99),
      makeScored('c', ['growth_focused'], 98),
      makeScored('d', ['experience'], 97),
      makeScored('e', ['freedom_designer'], 96),
      makeScored('f', ['contributor'], 95),
      makeScored('g', ['closeness'], 94),
      makeScored('h', ['creation'], 93),
      makeScored('i', ['growth_focused'], 92),
      makeScored('j', ['experience'], 91),
      makeScored('k', ['freedom_designer'], 90),
      makeScored('l', ['contributor'], 89),
      // Pool entries
      makeScored('pool1', ['closeness'], 70),
      makeScored('pool2', ['experience'], 65),
    ];

    const out = diversify(arr);
    // Positions 0, 1, 2 should remain unchanged (no violation).
    expect(out[0]!.variant.variant_id).toBe('a');
    expect(out[1]!.variant.variant_id).toBe('b');
    expect(out[2]!.variant.variant_id).toBe('c');
  });

  it('violation fires when three consecutive experiences share a common direction', () => {
    // A: [creation, growth] -> {making, growth}
    // B: [creation] -> {making}
    // C: [creation, experience] -> {making, experience}
    // Intersection: {making, growth} ∩ {making} ∩ {making, experience} = {making}
    // Violation fires at position 2 (zero-indexed).
    const arr: ScoredVariant[] = [
      makeScored('a', ['creation', 'growth_focused'], 100),
      makeScored('b', ['creation'], 99),
      makeScored('c', ['creation', 'experience'], 98),
      makeScored('d', ['creation'], 97),
      makeScored('e', ['creation'], 96),
      makeScored('f', ['creation'], 95),
      makeScored('g', ['creation'], 94),
      makeScored('h', ['creation'], 93),
      makeScored('i', ['creation'], 92),
      makeScored('j', ['creation'], 91),
      makeScored('k', ['creation'], 90),
      makeScored('l', ['creation'], 89),
      // Pool entry: does NOT share 'making' with both a and b.
      // setQ ∩ setPMinus1 ∩ setPMinus2 check:
      // {freedom} ∩ {making} ∩ {making, growth} = empty
      // This candidate qualifies (no shared direction with both neighbours).
      makeScored('pool_freedom', ['freedom_designer'], 70),
      makeScored('pool_exp', ['experience'], 65),
    ];

    const out = diversify(arr);
    // Position 2 should have been swapped with pool_freedom (highest-scoring
    // qualifying candidate from positions 3..end).
    expect(out[2]!.variant.variant_id).toBe('pool_freedom');
    // The diversification pass returns only the top 12, so we verify the swap
    // occurred by confirming pool_freedom is in the top 12 at position 2.
    expect(out).toHaveLength(12);
  });

  it('halfTopScore floor blocks below-floor swap-ins', () => {
    // Rank 1 composite_score: 200. halfTopScore = 100.
    // Three consecutive experiences all share 'making'. A pool candidate with
    // composite_score 90 (below floor) should be rejected even though it would
    // resolve the violation.
    const arr: ScoredVariant[] = [
      makeScored('a', ['creation'], 200),
      makeScored('b', ['creation'], 199),
      makeScored('c', ['creation'], 198),
      makeScored('d', ['creation'], 197),
      makeScored('e', ['creation'], 196),
      makeScored('f', ['creation'], 195),
      makeScored('g', ['creation'], 194),
      makeScored('h', ['creation'], 193),
      makeScored('i', ['creation'], 192),
      makeScored('j', ['creation'], 191),
      makeScored('k', ['creation'], 190),
      makeScored('l', ['creation'], 189),
      // Pool candidate: different direction but below halfTopScore (100).
      makeScored('pool_low', ['freedom_designer'], 90),
      makeScored('pool_lower', ['experience'], 85),
    ];

    const out = diversify(arr);
    // Violation at position 2 remains in place (no above-floor candidate exists).
    expect(out[0]!.variant.variant_id).toBe('a');
    expect(out[1]!.variant.variant_id).toBe('b');
    expect(out[2]!.variant.variant_id).toBe('c'); // unchanged
    // Pool candidates should NOT appear in top 12.
    expect(out.some((s) => s.variant.variant_id === 'pool_low')).toBe(false);
    expect(out.some((s) => s.variant.variant_id === 'pool_lower')).toBe(false);
  });
});
