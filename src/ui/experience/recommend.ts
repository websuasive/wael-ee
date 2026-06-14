// Experience recommendation algorithm (v3). Lexicographic-by-tier scoring model
// with protocol-based narrowing-fit and constraint biases.
//
// Pure function. No reactive state, no side effects, no Pinia store access.
// Inputs: variants (flattened RecommendableVariant[]), candidateDirections (from
// synthesis), narrowingBands (from synthesis), constraints (engine output),
// statuses (flags by variant_id). Outputs: scored / filtered / sorted variants
// plus quality threshold. Diversification is a separate post-pass (see diversify.ts).

import type {
  ConstraintsOutput,
  DirectionName,
} from '../../engine/types';
import type {
  ExperienceCandidate,
  NarrowingBandEntry,
} from '../../synthesis/types';
import { inventoryTagToEngineDirection } from './data/direction_mapping';
import type { Flag, Protocol, RecommendableVariant } from './types';
import { PROTOCOL_TO_NARROWING } from './types';

/* ------------------------------------------------------------------ */
/* Public types                                                       */
/* ------------------------------------------------------------------ */

export interface ScoredVariant {
  variant: RecommendableVariant;
  tier: 'firing' | 'past_presence_only' | 'anchored_stretch' | 'none';
  narrowing_fit_score: number;
  bias_total: number;
  composite_score: number;
}

export interface RecommendationResult {
  /** Post-exertion-filter, post-status-flag-exclusion, lexicographically sorted. */
  scoredCandidates: ScoredVariant[];
  /** 0.30 * composite_score(rank 1). Zero when rank 1 is zero. */
  qualityThreshold: number;
}

/* ------------------------------------------------------------------ */
/* Candidate direction map                                            */
/* ------------------------------------------------------------------ */

interface CandidateInfo {
  priority: 'firing' | 'past_presence_only';
  pull: number;
}

function buildCandidateMap(
  candidates: readonly ExperienceCandidate[],
): Partial<Record<DirectionName, CandidateInfo>> {
  const map: Partial<Record<DirectionName, CandidateInfo>> = {};
  for (const c of candidates) {
    const engine = c.direction_engine_name;
    const existing = map[engine];
    if (
      existing === undefined ||
      (existing.priority === 'past_presence_only' && c.priority === 'firing')
    ) {
      map[engine] = { priority: c.priority, pull: c.pull };
    }
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Exertion exclusion (v3)                                            */
/* ------------------------------------------------------------------ */

function excludedByExertion(
  variant: RecommendableVariant,
  band: ConstraintsOutput['body_capacity']['band'],
): boolean {
  if (band === 'limited') return variant.exertion >= 3;
  if (band === 'shifted') return variant.exertion >= 4;
  return false;
}

/* ------------------------------------------------------------------ */
/* Translated directions                                              */
/* ------------------------------------------------------------------ */

function translateDirections(variant: RecommendableVariant): DirectionName[] {
  const out: DirectionName[] = [];
  for (const tag of variant.directions) {
    const engine = inventoryTagToEngineDirection[tag];
    if (engine !== undefined) out.push(engine);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Direction tier assignment                                          */
/* ------------------------------------------------------------------ */

function assignTier(
  variant: RecommendableVariant,
  candidateMap: Partial<Record<DirectionName, CandidateInfo>>,
): 'firing' | 'past_presence_only' | 'anchored_stretch' | 'none' {
  const translated = translateDirections(variant);
  if (translated.length === 0) return 'none';

  let hasFiring = false;
  let hasPastPresence = false;
  let hasAnyMatch = false;

  for (const d of translated) {
    const candidate = candidateMap[d];
    if (candidate !== undefined) {
      hasAnyMatch = true;
      if (candidate.priority === 'firing') {
        hasFiring = true;
      } else if (candidate.priority === 'past_presence_only') {
        hasPastPresence = true;
      }
    }
  }

  if (hasFiring) return 'firing';
  if (hasPastPresence) return 'past_presence_only';
  if (hasAnyMatch) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `Variant ${variant.variant_id} assigned to anchored_stretch tier (rare case).`,
      );
    }
    return 'anchored_stretch';
  }
  return 'none';
}

/* ------------------------------------------------------------------ */
/* Narrowing-fit score (protocol-based, v3)                          */
/* ------------------------------------------------------------------ */

function narrowingFitScore(
  variant: RecommendableVariant,
  narrowingBands: readonly NarrowingBandEntry[],
): number {
  const narrowingTag = PROTOCOL_TO_NARROWING[variant.protocol];
  const band = narrowingBands.find((b) => b.band_field === narrowingTag);
  
  if (band !== undefined) {
    return band.intensity;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `Variant ${variant.variant_id} protocol "${variant.protocol}" maps to narrowing "${narrowingTag}" not found in narrowingBands. Degrading gracefully (score = 0).`,
    );
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/* Protocol-first narrowing intensity (hub box signal)                 */
/* ------------------------------------------------------------------ */

/**
 * Protocol-first narrowing intensity (hub box signal).
 *
 * Given a protocol and the user's narrowing bands, returns the intensity
 * (33 / 66 / 100) of the single narrowing that protocol maps to via
 * PROTOCOL_TO_NARROWING. Returns 0 if the mapped band is absent (degrade,
 * do not crash) — consistent with narrowingFitScore.
 *
 * This is the protocol-first counterpart to narrowingFitScore (which is
 * variant-first). It exists to light/rank the protocol boxes on the hub:
 * the protocol is the input, not read from a variant.
 */
export function protocolNarrowingIntensity(
  protocol: Protocol,
  bands: readonly NarrowingBandEntry[],
): number {
  const narrowingTag = PROTOCOL_TO_NARROWING[protocol];
  const band = bands.find((b) => b.band_field === narrowingTag);
  return band?.intensity ?? 0;
}

/* ------------------------------------------------------------------ */
/* Constraint biases (v3)                                             */
/* ------------------------------------------------------------------ */

function constraintBiases(
  variant: RecommendableVariant,
  constraints: ConstraintsOutput,
): number {
  let sum = 0;

  if (
    constraints.energy.band === 'heavy_depletion' &&
    variant.friction <= 2
  ) {
    sum += 20;
  }

  if (
    constraints.time.band === 'heavy_time_pressure' &&
    variant.magnitude === 'small'
  ) {
    sum += 20;
  }

  return sum;
}


/* ------------------------------------------------------------------ */
/* Public entry point                                                 */
/* ------------------------------------------------------------------ */

/**
 * Score, exclude, sort (v3). Pure function. Diversification is a separate pass.
 *
 * Order of operations:
 *   1. Exertion exclusion (pre-filter based on body_capacity band).
 *   2. Status flag exclusion (`not_interested`, `done`).
 *   3. Tier assignment (firing > past_presence_only > anchored_stretch > none).
 *   4. Narrowing-fit score (protocol maps to single band via PROTOCOL_TO_NARROWING).
 *   5. Constraint biases (energy depletion + time pressure).
 *   6. Composite score = narrowing_fit_score + bias_total.
 *   7. Lexicographic sort: tier (descending), composite_score (descending), variant_id (ascending).
 *   8. Quality threshold = 0.30 * composite_score(rank 1).
 */
export function recommend(
  variants: readonly RecommendableVariant[],
  candidateDirections: readonly ExperienceCandidate[],
  narrowingBands: readonly NarrowingBandEntry[],
  constraints: ConstraintsOutput,
  statuses: Readonly<Record<string, Flag>>,
): RecommendationResult {
  const candidateMap = buildCandidateMap(candidateDirections);
  const bodyBand = constraints.body_capacity.band;

  const scored: ScoredVariant[] = [];
  for (const variant of variants) {
    if (excludedByExertion(variant, bodyBand)) continue;

    const flag = statuses[variant.variant_id];
    if (flag === 'not_interested' || flag === 'done') continue;

    const tier = assignTier(variant, candidateMap);
    const narrowing_fit_score = narrowingFitScore(variant, narrowingBands);
    const bias_total = constraintBiases(variant, constraints);
    const composite_score = narrowing_fit_score + bias_total;

    scored.push({
      variant,
      tier,
      narrowing_fit_score,
      bias_total,
      composite_score,
    });
  }

  const tierOrder: Record<ScoredVariant['tier'], number> = {
    firing: 0,
    past_presence_only: 1,
    anchored_stretch: 2,
    none: 3,
  };

  scored.sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;

    if (a.composite_score !== b.composite_score) {
      return b.composite_score - a.composite_score;
    }

    return a.variant.variant_id < b.variant.variant_id
      ? -1
      : a.variant.variant_id > b.variant.variant_id
        ? 1
        : 0;
  });

  const top = scored[0];
  const qualityThreshold = top === undefined ? 0 : 0.3 * top.composite_score;

  return { scoredCandidates: scored, qualityThreshold };
}

/* ------------------------------------------------------------------ */
/* Internal exports for test use                                      */
/* ------------------------------------------------------------------ */

export {
  buildCandidateMap as _buildCandidateMap,
  excludedByExertion as _excludedByExertion,
  assignTier as _assignTier,
  narrowingFitScore as _narrowingFitScore,
  constraintBiases as _constraintBiases,
  translateDirections as _translateDirections,
};
export type { CandidateInfo as _CandidateInfo };
