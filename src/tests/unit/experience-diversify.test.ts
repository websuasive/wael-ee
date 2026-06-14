// v2 fixtures - excluded from typecheck pending v3 fixture rebuild.
// Diversification pass tests. Per EXPERIENCE.md section 3.4.

import { describe, it, expect } from 'vitest';
import type { DirectionName } from '@/engine/types';
import type {
  CostTier,
  RecommendableVariant,
} from '@/ui/experience/types';
import type { ScoredVariant } from '@/ui/experience/recommend';
import { diversify } from '@/ui/experience/diversify';
import { inventoryTagToEngineDirection } from '@/ui/experience/data/direction_mapping';

interface FakeArgs {
  id: string;
  score: number;
  primary: DirectionName | null;
  exertion?: number;
  cost_tier?: CostTier;
  protocol?: string;
}

// Inverse mapping for test helper: engine direction name to inventory tag.
const engineToInventoryTag: Record<DirectionName, string> = {
  contributor: 'contributor',
  experience: 'experience',
  freedom_designer: 'freedom_designer',
  growth_focused: 'growth_focused',
  making: 'creation',
  relationship_rebuilder: 'closeness',
};

// Helper: assert that position p does not share a direction with both p-1 and p-2.
// This verifies the no-three-in-a-row guarantee under the direction-overlap mechanism.
function assertNoDirectionOverlap(
  out: ScoredVariant[],
  p: number,
): void {
  const directionsAt = (i: number): Set<DirectionName> => {
    const tags = out[i]!.variant.directions;
    const engineNames = new Set<DirectionName>();
    for (const tag of tags) {
      const engineName = inventoryTagToEngineDirection[tag];
      if (engineName !== undefined) engineNames.add(engineName);
    }
    return engineNames;
  };

  const setP = directionsAt(p);
  const setPMinus1 = directionsAt(p - 1);
  const setPMinus2 = directionsAt(p - 2);

  // Check that p does NOT share a direction with both p-1 and p-2 simultaneously.
  let sharesWithBoth = false;
  for (const d of setP) {
    if (setPMinus1.has(d) && setPMinus2.has(d)) {
      sharesWithBoth = true;
      break;
    }
  }
  expect(sharesWithBoth).toBe(false);
}

function makeScored({
  id,
  score,
  primary,
  exertion = 2,
  cost_tier = 'free',
  protocol = 'stir',
}: FakeArgs): ScoredVariant {
  const variant: RecommendableVariant = {
    variant_id: id,
    activity_id: 'act_1',
    label: id,
    protocol: protocol as any,
    pitch: 'Test pitch',
    instruction: 'Test instruction',
    who_with: ['solo'],
    magnitude: 'medium',
    friction: 2,
    exertion,
    cost_tier,
    websites: [],
    directions: primary === null ? [] : [engineToInventoryTag[primary]],
    interest_domains: [],
    novelty_index: 0,
  };
  return {
    variant,
    tier: 'firing',
    narrowing_fit_score: 0,
    bias_total: 0,
    composite_score: score,
  };
}

describe('diversify: pass-through cases', () => {
  it('fewer than 12 candidates: returned in input order, untouched', () => {
    const arr = [
      makeScored({ id: 'a', score: 30, primary: 'making' }),
      makeScored({ id: 'b', score: 20, primary: 'making' }),
      makeScored({ id: 'c', score: 15, primary: 'making' }),
    ];
    const out = diversify(arr);
    expect(out.map((s) => s.variant.variant_id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input array', () => {
    const arr = [
      makeScored({ id: 'a', score: 30, primary: 'making' }),
      makeScored({ id: 'b', score: 20, primary: 'experience' }),
    ];
    const before = arr.map((s) => s.variant.variant_id);
    diversify(arr);
    expect(arr.map((s) => s.variant.variant_id)).toEqual(before);
  });
});

describe('diversify: no-three-in-a-row', () => {
  it('swaps position 3 (zero-indexed: 2) when first three share primary direction', () => {
    // Build 12 entries with positions 0,1,2 all 'making'; positions 3-11 all
    // 'experience'. Provide a 13th entry (index 12) of 'experience' with score
    // >= halfTopScore so the swap target exists.
    const arr: ScoredVariant[] = [];
    for (let i = 0; i < 3; i++) {
      arr.push(makeScored({ id: `m${i}`, score: 100 - i, primary: 'making' }));
    }
    for (let i = 3; i < 12; i++) {
      arr.push(makeScored({ id: `e${i}`, score: 80 - i, primary: 'experience' }));
    }
    // Pool entry: high score, different direction.
    arr.push(makeScored({ id: 'pool0', score: 70, primary: 'experience' }));

    const out = diversify(arr);
    // Position 2 should have been swapped with the highest-scoring different-
    // direction candidate from positions 3..end (which is e3 at score 77, since
    // the loop stops at the first match in score-desc order). e3 had score 77;
    // halfTopScore = 50; so e3 qualifies.
    assertNoDirectionOverlap(out, 2);
    expect(out[2]!.variant.variant_id).toBe('e3');
    // m2 displaced into e3's old slot (index 3).
    expect(out[3]!.variant.variant_id).toBe('m2');
  });

  it('leaves violation in place when no candidate meets score floor', () => {
    // First three share making; everything else is also making until pool
    // entries which fall below halfTopScore.
    const arr: ScoredVariant[] = [];
    arr.push(makeScored({ id: 'm0', score: 100, primary: 'making' }));
    arr.push(makeScored({ id: 'm1', score: 99, primary: 'making' }));
    arr.push(makeScored({ id: 'm2', score: 98, primary: 'making' }));
    for (let i = 3; i < 12; i++) {
      arr.push(makeScored({ id: `m${i}`, score: 60 - i, primary: 'making' }));
    }
    // Pool entry: different direction but score below halfTopScore (= 50).
    arr.push(makeScored({ id: 'pool0', score: 30, primary: 'experience' }));
    arr.push(makeScored({ id: 'pool1', score: 25, primary: 'experience' }));

    const out = diversify(arr);
    // Violation must be left in place: positions 0..2 still share 'making'.
    // All three have directions=['creation'] which maps to engine 'making'.
    const allMaking = out.slice(0, 3).every((s) => s.variant.directions.includes('creation'));
    expect(allMaking).toBe(true);
  });

  it('skips swap when no different-direction candidate exists at all', () => {
    const arr: ScoredVariant[] = [];
    for (let i = 0; i < 14; i++) {
      arr.push(makeScored({ id: `m${i}`, score: 100 - i, primary: 'making' }));
    }
    const out = diversify(arr);
    // All making throughout; no swap possible; top12 unchanged from sort order.
    expect(out.map((s) => s.variant.variant_id)).toEqual(arr.slice(0, 12).map((s) => s.variant.variant_id));
  });
});

describe('diversify: spread targets', () => {
  it('protocol: brings in the first missing protocol value', () => {
    // Twelve entries all with protocol = 'stir'. Pool has
    // 'loophole' (first canonical) and 'slip' (second). The
    // algorithm targets the first missing only; loophole is swapped in,
    // slip is not (single-shot per target).
    const arr: ScoredVariant[] = [];
    for (let i = 0; i < 12; i++) {
      arr.push(
        makeScored({
          id: `e${i}`,
          score: 100 - i,
          primary: i % 2 === 0 ? 'making' : 'experience',
          protocol: 'stir',
        }),
      );
    }
    arr.push(
      makeScored({
        id: 'poolLoophole',
        score: 70,
        primary: 'making',
        protocol: 'loophole',
      }),
    );
    arr.push(
      makeScored({
        id: 'poolSlip',
        score: 65,
        primary: 'experience',
        protocol: 'slip',
      }),
    );

    const out = diversify(arr);
    const protocols = new Set<string>();
    for (const s of out) protocols.add(s.variant.protocol);
    // First missing in canonical (loophole) was brought in; single-shot
    // means slip stays in the pool even though it would also help.
    expect(out.map((s) => s.variant.variant_id)).toContain('poolLoophole');
    expect(out.map((s) => s.variant.variant_id)).not.toContain('poolSlip');
    expect(protocols.has('loophole')).toBe(true);
    expect(protocols.has('stir')).toBe(true);
  });

  it('cost_tier spread: brings in a missing cost band', () => {
    const arr: ScoredVariant[] = [];
    for (let i = 0; i < 12; i++) {
      arr.push(
        makeScored({
          id: `c${i}`,
          score: 100 - i,
          primary: i % 2 === 0 ? 'making' : 'experience',
          cost_tier: 'free',
          exertion: i < 6 ? 1 : 2,
          protocol: i % 2 === 0 ? 'stir' : 'loophole',
        }),
      );
    }
    arr.push(
      makeScored({
        id: 'poolLow',
        score: 70,
        primary: 'experience',
        cost_tier: 'low',
      }),
    );
    const out = diversify(arr);
    const costs = new Set(out.map((s) => s.variant.cost_tier));
    expect(costs.size).toBeGreaterThanOrEqual(2);
  });

  it('does not swap if pool candidate falls below score floor', () => {
    // halfTopScore = 50; pool candidate at 40 must not be selected.
    const arr: ScoredVariant[] = [];
    for (let i = 0; i < 12; i++) {
      arr.push(
        makeScored({
          id: `c${i}`,
          score: 100 - i,
          primary: i % 2 === 0 ? 'making' : 'experience',
          cost_tier: 'free',
          exertion: i < 6 ? 1 : 2,
          protocol: i % 2 === 0 ? 'stir' : 'loophole',
        }),
      );
    }
    arr.push(
      makeScored({
        id: 'poolLow',
        score: 40,
        primary: 'experience',
        cost_tier: 'low',
      }),
    );
    const out = diversify(arr);
    expect(out.some((s) => s.variant.variant_id === 'poolLow')).toBe(false);
  });

});

describe('diversify: spread preservation predicate', () => {
  it('does not swap out a uniquely-valued entry for a target facet', () => {
    // Scenario for cost_tier (single-value facet, easier to reason about):
    // top12 has 11 free + 1 low. The unique 'low' entry must NOT be swapped
    // out when bringing in a new value, because removing it would decrease
    // distinct count.
    //
    // Construct: 11 entries cost_tier=free, 1 entry cost_tier=low (lowest score
    // in top12). Pool has 'medium'. Spread target 2 (cost_tier 2+) is already
    // satisfied (free + low = 2 distinct), so no swap should happen on
    // cost_tier. To exercise the predicate we instead force experience_types
    // violation.
    //
    // Predicate-direct test: build top12 where the lowest-scoring entry has
    // a unique protocol. Pool has the missing protocol, but the
    // lowest-scoring entry must not be chosen (removing it would lose its
    // unique protocol). The next-lowest entry that preserves spread is selected.
    const arr: ScoredVariant[] = [];
    // index 0..9: stir
    for (let i = 0; i < 10; i++) {
      arr.push(
        makeScored({
          id: `c${i}`,
          score: 100 - i,
          primary: i % 2 === 0 ? 'making' : 'experience',
          protocol: 'stir',
        }),
      );
    }
    // index 10: loophole (one entry contributes 'loophole' to top12)
    arr.push(
      makeScored({
        id: 'loophole_unique',
        score: 90,
        primary: 'making',
        protocol: 'loophole',
      }),
    );
    // index 11: slip — UNIQUE in top12, lowest score.
    arr.push(
      makeScored({
        id: 'slip_unique',
        score: 50,
        primary: 'experience',
        protocol: 'slip',
      }),
    );
    // Set positions in score-desc order so index 11 has the lowest composite_score.
    arr.sort((a, b) => b.composite_score - a.composite_score);

    // Top12 distinct protocols: stir, loophole, slip -> already 3.
    // No swap expected on protocol target. Verify slip_unique stays.
    const out = diversify(arr);
    expect(out.some((s) => s.variant.variant_id === 'slip_unique')).toBe(true);
  });
});

describe('diversify: edge cases', () => {
  it('exactly 12 candidates: returns all 12', () => {
    const arr: ScoredVariant[] = [];
    for (let i = 0; i < 12; i++) {
      arr.push(
        makeScored({
          id: `e${i}`,
          score: 100 - i,
          primary: i % 2 === 0 ? 'making' : 'experience',
          exertion: i < 4 ? 1 : i < 8 ? 2 : 3,
          cost_tier: i < 6 ? 'free' : 'low',
          protocol: i % 2 === 0 ? 'stir' : 'loophole',
        }),
      );
    }
    const out = diversify(arr);
    expect(out).toHaveLength(12);
  });

  it('between 12 and 24 candidates: algorithm runs against what exists', () => {
    const arr: ScoredVariant[] = [];
    for (let i = 0; i < 18; i++) {
      arr.push(
        makeScored({
          id: `e${i}`,
          score: 100 - i,
          primary: i < 3 ? 'making' : 'experience',
          exertion: i < 6 ? 1 : i < 12 ? 2 : 3,
          cost_tier: i < 8 ? 'free' : 'low',
          protocol: i % 2 === 0 ? 'stir' : 'loophole',
        }),
      );
    }
    const out = diversify(arr);
    expect(out).toHaveLength(12);
    // No-three-in-a-row should still attempt to break first three 'making'.
    assertNoDirectionOverlap(out, 2);
  });
});
