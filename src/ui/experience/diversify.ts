// Diversification re-ranking pass (v3). Pure function. Operates on the
// score-sorted candidate list produced by recommend() and returns the top 12
// after diversification.
//
// Step 1: no-three-in-a-row by direction overlap over top12.
// Step 2: spread targets (3+ protocol, 2+ cost_tier) over top12 with
//         single-shot swap per target.
// Step 3: return top12.
//
// Step 2 may introduce a no-three-in-a-row violation; that is accepted.

import type { DirectionName } from '../../engine/types';
import type { CostTier, Protocol } from './types';
import type { ScoredVariant } from './recommend';
import { inventoryTagToEngineDirection } from './data/direction_mapping';

/* ------------------------------------------------------------------ */
/* Canonical facet order                                              */
/* ------------------------------------------------------------------ */

const CANONICAL_PROTOCOL_ORDER: readonly Protocol[] = [
  'stir',
  'loophole',
  'slip',
  'catch',
  'trespass',
  'aside',
  'steeping',
];

const CANONICAL_COST_TIER_ORDER: readonly CostTier[] = [
  'free',
  'low',
  'medium',
  'high',
];

const TOP_DEPTH = 12;
const SWAP_DEPTH = 24;

/* ------------------------------------------------------------------ */
/* Spread target definitions                                          */
/* ------------------------------------------------------------------ */

type SpreadTarget =
  | { facet: 'protocol'; minDistinct: 3 }
  | { facet: 'cost_tier'; minDistinct: 2 };

const SPREAD_TARGETS: readonly SpreadTarget[] = [
  { facet: 'protocol', minDistinct: 3 },
  { facet: 'cost_tier', minDistinct: 2 },
];

function canonicalOrderFor(facet: SpreadTarget['facet']): readonly string[] {
  switch (facet) {
    case 'protocol':
      return CANONICAL_PROTOCOL_ORDER;
    case 'cost_tier':
      return CANONICAL_COST_TIER_ORDER;
  }
}

function valuesFor(
  entry: ScoredVariant,
  facet: SpreadTarget['facet'],
): string[] {
  switch (facet) {
    case 'protocol':
      return [entry.variant.protocol];
    case 'cost_tier':
      return [entry.variant.cost_tier];
  }
}

function distinctSet(
  entries: readonly ScoredVariant[],
  facet: SpreadTarget['facet'],
): Set<string> {
  const out = new Set<string>();
  for (const e of entries) {
    for (const v of valuesFor(e, facet)) out.add(v);
  }
  return out;
}

function satisfiesTarget(
  top12: readonly ScoredVariant[],
  target: SpreadTarget,
): boolean {
  return distinctSet(top12, target.facet).size >= target.minDistinct;
}

function preservesSpread(
  top12: readonly ScoredVariant[],
  r: ScoredVariant,
  facet: SpreadTarget['facet'],
): boolean {
  const full = distinctSet(top12, facet).size;
  const without = distinctSet(
    top12.filter((e) => e !== r),
    facet,
  ).size;
  return without === full;
}

/* ------------------------------------------------------------------ */
/* Step 1 — no-three-in-a-row                                         */
/* ------------------------------------------------------------------ */

function applyNoThreeInARow(
  top: ScoredVariant[],
  halfTopScore: number,
): void {
  const directionSetByCandidate = new Map<ScoredVariant, Set<DirectionName>>();
  for (const cand of top) {
    const directionSet = new Set<DirectionName>();
    for (const tag of cand.variant.directions) {
      const engineName = inventoryTagToEngineDirection[tag];
      if (engineName !== undefined) directionSet.add(engineName);
    }
    directionSetByCandidate.set(cand, directionSet);
  }

  const limit = Math.min(TOP_DEPTH, top.length);
  for (let p = 2; p < limit; p++) {
    const setP = directionSetByCandidate.get(top[p]!)!;
    const setPMinus1 = directionSetByCandidate.get(top[p - 1]!)!;
    const setPMinus2 = directionSetByCandidate.get(top[p - 2]!)!;

    let hasShared = false;
    for (const d of setP) {
      if (setPMinus1.has(d) && setPMinus2.has(d)) {
        hasShared = true;
        break;
      }
    }
    if (!hasShared) continue;

    let qIndex = -1;
    for (let i = p + 1; i < top.length; i++) {
      const cand = top[i]!;
      if (cand.composite_score < halfTopScore) continue;

      const setQ = directionSetByCandidate.get(cand)!;
      let sharesWithBoth = false;
      for (const d of setQ) {
        if (setPMinus1.has(d) && setPMinus2.has(d)) {
          sharesWithBoth = true;
          break;
        }
      }
      if (sharesWithBoth) continue;

      qIndex = i;
      break;
    }
    if (qIndex === -1) continue;

    const tmp = top[p]!;
    top[p] = top[qIndex]!;
    top[qIndex] = tmp;
  }
}

/* ------------------------------------------------------------------ */
/* Step 2 — spread targets                                            */
/* ------------------------------------------------------------------ */

function applySpreadTargets(
  top: ScoredVariant[],
  halfTopScore: number,
): void {
  for (const target of SPREAD_TARGETS) {
    const top12 = top.slice(0, Math.min(TOP_DEPTH, top.length));
    if (satisfiesTarget(top12, target)) continue;

    const present = distinctSet(top12, target.facet);
    const order = canonicalOrderFor(target.facet);
    const missing = order.find((v) => !present.has(v));
    if (missing === undefined) continue;

    let qIndex = -1;
    for (let i = TOP_DEPTH; i < top.length; i++) {
      const cand = top[i]!;
      if (cand.composite_score < halfTopScore) continue;
      if (!valuesFor(cand, target.facet).includes(missing)) continue;
      qIndex = i;
      break;
    }
    if (qIndex === -1) continue;

    let rIndex = -1;
    for (let i = top12.length - 1; i >= 0; i--) {
      const cand = top12[i]!;
      if (preservesSpread(top12, cand, target.facet)) {
        rIndex = i;
        break;
      }
    }
    if (rIndex === -1) continue;

    const tmp = top[rIndex]!;
    top[rIndex] = top[qIndex]!;
    top[qIndex] = tmp;
  }
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                 */
/* ------------------------------------------------------------------ */

export function diversify(
  sortedCandidates: readonly ScoredVariant[],
): ScoredVariant[] {
  if (sortedCandidates.length < TOP_DEPTH) {
    return [...sortedCandidates];
  }

  const top = sortedCandidates.slice(0, SWAP_DEPTH);
  const halfTopScore = top[0]!.composite_score / 2;

  applyNoThreeInARow(top, halfTopScore);
  applySpreadTargets(top, halfTopScore);

  return top.slice(0, TOP_DEPTH);
}
