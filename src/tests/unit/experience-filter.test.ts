// v2 fixtures - excluded from typecheck pending v3 fixture rebuild.
// Filter, sort, and facet-count tests. Per EXPERIENCE.md sections 4.2 and 8.

import { describe, it, expect } from 'vitest';
import type { Flag, RecommendableVariant } from '@/ui/experience/types';
import {
  EMPTY_FILTER_STATE,
  computeFilterCounts,
  filterVariants,
  sortVariants,
  type FilterState,
  type FlagLookup,
} from '@/ui/experience/filter';

function makeVariant(overrides: Partial<RecommendableVariant> & { variant_id: string }): RecommendableVariant {
  return {
    variant_id: overrides.variant_id,
    activity_id: overrides.activity_id ?? 'act_1',
    label: overrides.label ?? `Variant ${overrides.variant_id}`,
    protocol: overrides.protocol ?? 'stir',
    pitch: overrides.pitch ?? 'Test pitch',
    instruction: overrides.instruction ?? 'Test instruction',
    who_with: overrides.who_with ?? ['solo'],
    magnitude: overrides.magnitude ?? 'medium',
    friction: overrides.friction ?? 1,
    exertion: overrides.exertion ?? 2,
    cost_tier: overrides.cost_tier ?? 'free',
    websites: overrides.websites ?? [],
    directions: overrides.directions ?? ['experience'],
    interest_domains: overrides.interest_domains ?? [],
    novelty_index: overrides.novelty_index ?? 0,
  };
}

const noFlags: FlagLookup = () => null;

function withState(partial: Partial<FilterState>): FilterState {
  return { ...EMPTY_FILTER_STATE, ...partial };
}

describe('filterVariants: direction translation', () => {
  const inv = [
    makeVariant({ variant_id: 'a', directions: ['creation'] }),
    makeVariant({ variant_id: 'b', directions: ['closeness'] }),
    makeVariant({ variant_id: 'c', directions: ['experience', 'freedom'] }),
  ];

  it('inventory tag "creation" matches engine direction "creator"', () => {
    const out = filterVariants(
      inv,
      withState({ direction: ['creator'] }),
      noFlags,
    );
    expect(out.map((v) => v.variant_id)).toEqual(['a']);
  });

  it('inventory tag "closeness" matches engine direction "relationship_rebuilder"', () => {
    const out = filterVariants(
      inv,
      withState({ direction: ['relationship_rebuilder'] }),
      noFlags,
    );
    expect(out.map((v) => v.variant_id)).toEqual(['b']);
  });

  it('OR within direction: creator OR experience_seeker returns both', () => {
    const out = filterVariants(
      inv,
      withState({ direction: ['creator', 'experience_seeker'] }),
      noFlags,
    );
    expect(out.map((v) => v.variant_id)).toEqual(['a', 'c']);
  });
});

describe('filterVariants: status', () => {
  const inv = [
    makeVariant({ variant_id: 'a' }),
    makeVariant({ variant_id: 'b' }),
    makeVariant({ variant_id: 'c' }),
  ];
  const flagMap: Record<string, Flag> = { b: 'saved', c: 'done' };
  const flagFor: FlagLookup = (id) => flagMap[id] ?? null;

  it('unflagged returns variants with no flag', () => {
    const out = filterVariants(inv, withState({ status: ['unflagged'] }), flagFor);
    expect(out.map((v) => v.variant_id)).toEqual(['a']);
  });

  it('saved returns only saved', () => {
    const out = filterVariants(inv, withState({ status: ['saved'] }), flagFor);
    expect(out.map((v) => v.variant_id)).toEqual(['b']);
  });

  it('OR within status: saved OR done', () => {
    const out = filterVariants(
      inv,
      withState({ status: ['saved', 'done'] }),
      flagFor,
    );
    expect(out.map((v) => v.variant_id)).toEqual(['b', 'c']);
  });
});

describe('filterVariants: protocol facet (v3)', () => {
  const inv = [
    makeVariant({ variant_id: 'a', protocol: 'stir' }),
    makeVariant({ variant_id: 'b', protocol: 'loophole' }),
    makeVariant({ variant_id: 'c', protocol: 'stir' }),
    makeVariant({ variant_id: 'd', protocol: 'slip' }),
    makeVariant({ variant_id: 'e', protocol: 'catch' }),
  ];

  it('single value: protocol=stir returns variants with protocol stir', () => {
    const out = filterVariants(inv, withState({ protocol: ['stir'] }), noFlags);
    expect(out.map((v) => v.variant_id)).toEqual(['a', 'c']);
  });

  it('OR within facet: protocol=stir OR slip returns either', () => {
    const out = filterVariants(
      inv,
      withState({ protocol: ['stir', 'slip'] }),
      noFlags,
    );
    expect(out.map((v) => v.variant_id)).toEqual(['a', 'c', 'd']);
  });

  it('computeFilterCounts surfaces every protocol value present in inventory', () => {
    const counts = computeFilterCounts(inv, EMPTY_FILTER_STATE, noFlags);
    expect(Object.keys(counts.protocol).sort()).toEqual(
      ['catch', 'loophole', 'slip', 'stir'].sort(),
    );
    expect(counts.protocol['stir']).toBe(2);
    expect(counts.protocol['loophole']).toBe(1);
  });
});

describe('sortVariants', () => {
  it('novelty_asc: ascending by novelty_index, ties by id', () => {
    const inv = [
      makeVariant({ variant_id: 'b', novelty_index: 50 }),
      makeVariant({ variant_id: 'a', novelty_index: 50 }),
      makeVariant({ variant_id: 'c', novelty_index: 0 }),
      makeVariant({ variant_id: 'd', novelty_index: 200 }),
    ];
    expect(sortVariants(inv, 'novelty_asc').map((v) => v.variant_id))
      .toEqual(['c', 'a', 'b', 'd']);
  });

  it('friction_asc: 1, 2, 3', () => {
    const inv = [
      makeVariant({ variant_id: 'a', friction: 3 }),
      makeVariant({ variant_id: 'b', friction: 1 }),
      makeVariant({ variant_id: 'c', friction: 2 }),
    ];
    expect(sortVariants(inv, 'friction_asc').map((v) => v.variant_id))
      .toEqual(['b', 'c', 'a']);
  });

  it('default without a score map preserves input order', () => {
    const inv = [
      makeVariant({ variant_id: 'z' }),
      makeVariant({ variant_id: 'a' }),
      makeVariant({ variant_id: 'm' }),
    ];
    expect(sortVariants(inv, 'default').map((v) => v.variant_id))
      .toEqual(['z', 'a', 'm']);
  });

  it('default with a score map sorts by score desc, ties by id', () => {
    const inv = [
      makeVariant({ variant_id: 'a' }),
      makeVariant({ variant_id: 'b' }),
      makeVariant({ variant_id: 'c' }),
    ];
    const scores = new Map<string, number>([
      ['a', 5],
      ['b', 10],
      ['c', 10],
    ]);
    expect(sortVariants(inv, 'default', scores).map((v) => v.variant_id))
      .toEqual(['b', 'c', 'a']);
  });
});

describe('computeFilterCounts', () => {
  const inv = [
    makeVariant({ variant_id: 'a', friction: 1, exertion: 1 }),
    makeVariant({ variant_id: 'b', friction: 1, exertion: 2 }),
    makeVariant({ variant_id: 'c', friction: 2, exertion: 1 }),
    makeVariant({ variant_id: 'd', friction: 3, exertion: 3 }),
  ];

  it('with no filters, each value counts every variant that has it', () => {
    const counts = computeFilterCounts(inv, EMPTY_FILTER_STATE, noFlags);
    expect(counts.exertion).toEqual({ 1: 2, 2: 1, 3: 1 });
  });

  it('status facet always exposes the five canonical values', () => {
    const counts = computeFilterCounts(inv, EMPTY_FILTER_STATE, noFlags);
    expect(Object.keys(counts.status).sort()).toEqual(
      ['booked', 'done', 'not_interested', 'saved', 'unflagged'].sort(),
    );
    expect(counts.status['unflagged']).toBe(4);
    expect(counts.status['saved']).toBe(0);
  });
});
