// Experience filter logic (v3). Filter and sort the inventory for the Browse
// view (AND across facets, OR within a facet), and compute live facet counts.

import type { DirectionName } from '../../engine/types';
import type {
  CostTier,
  Flag,
  Protocol,
  RecommendableVariant,
} from './types';
import { inventoryTagToEngineDirection } from './data/direction_mapping';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type StatusFilterValue = 'unflagged' | Flag;

export type SortOption =
  | 'default'
  | 'novelty_asc'
  | 'novelty_desc'
  | 'friction_asc';

export interface FilterState {
  direction: DirectionName[];
  protocol: Protocol[];
  exertion: number[];
  cost_tier: CostTier[];
  interest_domain: string[];
  status: StatusFilterValue[];
}

export type FacetKey = keyof FilterState;

export const FACET_KEYS: readonly FacetKey[] = [
  'direction',
  'protocol',
  'exertion',
  'cost_tier',
  'interest_domain',
  'status',
];

export const EMPTY_FILTER_STATE: FilterState = Object.freeze({
  direction: [],
  protocol: [],
  exertion: [],
  cost_tier: [],
  interest_domain: [],
  status: [],
}) as FilterState;

/** Returns the man's flag for a variant, or null if unflagged. */
export type FlagLookup = (variantId: string) => Flag | null;

/* ------------------------------------------------------------------ */
/* Per-facet match predicates                                         */
/* ------------------------------------------------------------------ */

function translateDirections(variant: RecommendableVariant): DirectionName[] {
  const out: DirectionName[] = [];
  for (const tag of variant.directions) {
    const engine = inventoryTagToEngineDirection[tag];
    if (engine !== undefined) out.push(engine);
  }
  return out;
}

function arrayMatchesAny<T>(haystack: readonly T[], needles: readonly T[]): boolean {
  for (const n of needles) {
    if (haystack.includes(n)) return true;
  }
  return false;
}

function matchesFacet(
  facet: FacetKey,
  selected: readonly (string | number)[],
  variant: RecommendableVariant,
  flagFor: FlagLookup,
): boolean {
  if (selected.length === 0) return true;
  switch (facet) {
    case 'direction': {
      const translated = translateDirections(variant);
      return arrayMatchesAny(translated, selected as DirectionName[]);
    }
    case 'protocol':
      return (selected as Protocol[]).includes(variant.protocol);
    case 'exertion':
      return (selected as number[]).includes(variant.exertion);
    case 'cost_tier':
      return (selected as CostTier[]).includes(variant.cost_tier);
    case 'interest_domain':
      return arrayMatchesAny(variant.interest_domains, selected as string[]);
    case 'status': {
      const flag = flagFor(variant.variant_id);
      const sel = selected as StatusFilterValue[];
      if (flag === null) return sel.includes('unflagged');
      return sel.includes(flag);
    }
  }
}

function variantMatchesState(
  variant: RecommendableVariant,
  state: FilterState,
  flagFor: FlagLookup,
  excludeFacet: FacetKey | null = null,
): boolean {
  for (const facet of FACET_KEYS) {
    if (facet === excludeFacet) continue;
    if (!matchesFacet(facet, state[facet], variant, flagFor)) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Filtering                                                          */
/* ------------------------------------------------------------------ */

export function filterVariants(
  variants: readonly RecommendableVariant[],
  state: FilterState,
  flagFor: FlagLookup,
): RecommendableVariant[] {
  return variants.filter((variant) =>
    variantMatchesState(variant, state, flagFor),
  );
}

/* ------------------------------------------------------------------ */
/* Sorting                                                            */
/* ------------------------------------------------------------------ */

export function sortVariants(
  variants: readonly RecommendableVariant[],
  option: SortOption,
  scoreMap?: ReadonlyMap<string, number>,
): RecommendableVariant[] {
  const arr = [...variants];
  switch (option) {
    case 'default':
      if (scoreMap) {
        arr.sort((a, b) => {
          const sa = scoreMap.get(a.variant_id) ?? 0;
          const sb = scoreMap.get(b.variant_id) ?? 0;
          if (sa !== sb) return sb - sa;
          return a.variant_id < b.variant_id ? -1 : a.variant_id > b.variant_id ? 1 : 0;
        });
      }
      return arr;
    case 'novelty_asc':
      arr.sort((a, b) => {
        if (a.novelty_index !== b.novelty_index) {
          return a.novelty_index - b.novelty_index;
        }
        return a.variant_id < b.variant_id ? -1 : a.variant_id > b.variant_id ? 1 : 0;
      });
      return arr;
    case 'novelty_desc':
      arr.sort((a, b) => {
        if (a.novelty_index !== b.novelty_index) {
          return b.novelty_index - a.novelty_index;
        }
        return a.variant_id < b.variant_id ? -1 : a.variant_id > b.variant_id ? 1 : 0;
      });
      return arr;
    case 'friction_asc':
      arr.sort((a, b) => {
        if (a.friction !== b.friction) {
          return a.friction - b.friction;
        }
        return a.variant_id < b.variant_id ? -1 : a.variant_id > b.variant_id ? 1 : 0;
      });
      return arr;
  }
}

/* ------------------------------------------------------------------ */
/* Live facet counts                                                  */
/* ------------------------------------------------------------------ */

const STATUS_FACET_VALUES: readonly StatusFilterValue[] = [
  'unflagged',
  'saved',
  'booked',
  'done',
  'not_interested',
];

function collectFacetValues(
  variants: readonly RecommendableVariant[],
  facet: FacetKey,
): (string | number)[] {
  if (facet === 'status') return [...STATUS_FACET_VALUES];
  const set = new Set<string | number>();
  for (const variant of variants) {
    switch (facet) {
      case 'direction':
        for (const v of translateDirections(variant)) set.add(v);
        break;
      case 'protocol':
        set.add(variant.protocol);
        break;
      case 'exertion':
        set.add(variant.exertion);
        break;
      case 'cost_tier':
        set.add(variant.cost_tier);
        break;
      case 'interest_domain':
        for (const v of variant.interest_domains) set.add(v);
        break;
    }
  }
  return [...set].sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });
}

function variantHasFacetValue(
  variant: RecommendableVariant,
  facet: FacetKey,
  value: string | number,
  flagFor: FlagLookup,
): boolean {
  switch (facet) {
    case 'direction':
      return translateDirections(variant).includes(value as DirectionName);
    case 'protocol':
      return variant.protocol === value;
    case 'exertion':
      return variant.exertion === value;
    case 'cost_tier':
      return variant.cost_tier === value;
    case 'interest_domain':
      return variant.interest_domains.includes(value as string);
    case 'status': {
      const flag = flagFor(variant.variant_id);
      if (value === 'unflagged') return flag === null;
      return flag === value;
    }
  }
}

export function computeFilterCounts(
  variants: readonly RecommendableVariant[],
  state: FilterState,
  flagFor: FlagLookup,
): Record<FacetKey, Record<string, number>> {
  const result = {} as Record<FacetKey, Record<string, number>>;
  for (const facet of FACET_KEYS) {
    const values = collectFacetValues(variants, facet);
    const baseSet = variants.filter((variant) =>
      variantMatchesState(variant, state, flagFor, facet),
    );
    const counts: Record<string, number> = {};
    for (const value of values) {
      let n = 0;
      for (const variant of baseSet) {
        if (variantHasFacetValue(variant, facet, value, flagFor)) n++;
      }
      counts[String(value)] = n;
    }
    result[facet] = counts;
  }
  return result;
}
