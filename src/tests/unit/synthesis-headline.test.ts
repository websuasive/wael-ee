// Unit tests for synthesis-layer headline computation (SYNTHESIS.md sections 4 and 4.1).

import { describe, it, expect } from 'vitest';
import type { DirectionName } from '@/engine';
import {
  computeFiringSet,
  computeHeadline,
  type FiringSetEntry,
} from '@/synthesis/headline';
import {
  makeEngineOutput,
  makeInputMap,
} from './synthesis-test-helpers';

function findEntry(
  set: FiringSetEntry[],
  name: DirectionName,
): FiringSetEntry | undefined {
  return set.find((e) => e.direction === name);
}

/* ------------------------------------------------------------------ */
/* A — pull_quality firing                                            */
/* ------------------------------------------------------------------ */

describe('computeFiringSet — pull_quality firing', () => {
  it('a real-quality direction enters the firing set even with pull = 0', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 0, pull_quality: ['real'] }],
    });
    expect(findEntry(computeFiringSet(out), 'creator')).toBeDefined();
  });

  it('a phantom direction enters the firing set', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 0, pull_quality: ['phantom'] }],
    });
    expect(findEntry(computeFiringSet(out), 'creator')).toBeDefined();
  });

  it('a phantom_partial direction enters the firing set', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 0, pull_quality: ['phantom_partial'] },
      ],
    });
    expect(findEntry(computeFiringSet(out), 'creator')).toBeDefined();
  });

  it('a saturated + behaviourally_divergent direction enters the firing set', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['saturated', 'behaviourally_divergent'],
        },
      ],
    });
    expect(findEntry(computeFiringSet(out), 'creator')).toBeDefined();
  });

  it('all directions empty quality and pull < 50 → empty firing set', () => {
    const out = makeEngineOutput();
    expect(computeFiringSet(out)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* B — pull threshold                                                 */
/* ------------------------------------------------------------------ */

describe('computeFiringSet — pull threshold', () => {
  it('pull = 50 enters the firing set (boundary inclusive)', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 50 }],
    });
    expect(findEntry(computeFiringSet(out), 'creator')).toBeDefined();
  });

  it('pull = 49 does not enter the firing set', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 49 }],
    });
    expect(findEntry(computeFiringSet(out), 'creator')).toBeUndefined();
  });

  it('pull = 75 enters the firing set', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 75 }],
    });
    expect(findEntry(computeFiringSet(out), 'creator')).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/* C — sort order                                                     */
/* ------------------------------------------------------------------ */

describe('computeFiringSet — sort order', () => {
  it('sorts by pull descending', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80 },
        { direction: 'freedom_designer', pull: 60 },
        { direction: 'growth_focused', pull: 50 },
      ],
    });
    const set = computeFiringSet(out);
    expect(set.map((e) => e.direction)).toEqual(['creator', 'freedom_designer', 'growth_focused']);
  });

  it('alphabetical tiebreak when pulls equal', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 70, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
      ],
    });
    const set = computeFiringSet(out);
    expect(set.map((e) => e.direction)).toEqual(['creator', 'freedom_designer']);
  });

  it('three directions all at pull 0 with phantom firing — alphabetical order', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 0, pull_quality: ['phantom'] },
        { direction: 'freedom_designer', pull: 0, pull_quality: ['phantom'] },
        { direction: 'contributor', pull: 0, pull_quality: ['phantom'] },
      ],
    });
    const set = computeFiringSet(out);
    expect(set.map((e) => e.direction)).toEqual([
      'contributor',
      'creator',
      'freedom_designer',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* D — independent of engine sort                                     */
/* ------------------------------------------------------------------ */

describe('computeFiringSet — independent of engine pre-sort', () => {
  it('returns correct sort even if input array is not pre-sorted', () => {
    // Provide directions in alphabetical (NOT pull-desc) order.
    const out = makeEngineOutput({
      directions: [
        { direction: 'contributor', pull: 60 },
        { direction: 'experience_seeker', pull: 90 },
        { direction: 'freedom_designer', pull: 75 },
      ],
    });
    const set = computeFiringSet(out);
    expect(set.map((e) => e.direction)).toEqual([
      'experience_seeker',
      'freedom_designer',
      'contributor',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* E — top-3 limit                                                    */
/* ------------------------------------------------------------------ */

describe('computeHeadline — top-3 limit', () => {
  it('six directions firing → 3 names', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 95 },
        { direction: 'freedom_designer', pull: 80 },
        { direction: 'experience_seeker', pull: 65 },
        { direction: 'contributor', pull: 55 },
        { direction: 'growth_focused', pull: 52 },
        { direction: 'relationship_rebuilder', pull: 51 },
      ],
    });
    const inp = makeInputMap();
    const h = computeHeadline(out, inp);
    expect(h.direction_names).toEqual([
      'Creator',
      'Freedom Designer',
      'Experience Seeker',
    ]);
    expect(h.situation_text).toBeNull();
  });

  it('four directions firing → 3 names', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 90 },
        { direction: 'freedom_designer', pull: 80 },
        { direction: 'experience_seeker', pull: 70 },
        { direction: 'growth_focused', pull: 60 },
      ],
    });
    const h = computeHeadline(out, makeInputMap());
    expect(h.direction_names).toHaveLength(3);
  });

  it('three directions firing → 3 names', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 90 },
        { direction: 'freedom_designer', pull: 80 },
        { direction: 'experience_seeker', pull: 70 },
      ],
    });
    const h = computeHeadline(out, makeInputMap());
    expect(h.direction_names).toHaveLength(3);
  });

  it('two directions firing → 2 names', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 90 },
        { direction: 'freedom_designer', pull: 80 },
      ],
    });
    const h = computeHeadline(out, makeInputMap());
    expect(h.direction_names).toHaveLength(2);
    expect(h.situation_text).toBeNull();
  });

  it('one direction firing → 1 name', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 90 }],
    });
    const h = computeHeadline(out, makeInputMap());
    expect(h.direction_names).toEqual(['Creator']);
    expect(h.situation_text).toBeNull();
  });

  it('zero directions firing → empty names + situation_text set', () => {
    const out = makeEngineOutput();
    const h = computeHeadline(out, makeInputMap());
    expect(h.direction_names).toEqual([]);
    expect(h.situation_text).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* F — display name mapping                                           */
/* ------------------------------------------------------------------ */

describe('computeHeadline — display name mapping', () => {
  function nameFor(d: DirectionName): string {
    const out = makeEngineOutput({
      directions: [{ direction: d, pull: 90 }],
    });
    const h = computeHeadline(out, makeInputMap());
    return h.direction_names[0]!;
  }

  it('making → Creator', () => {
    expect(nameFor('creator')).toBe('Creator');
  });

  it('freedom → Freedom Designer', () => {
    expect(nameFor('freedom_designer')).toBe('Freedom Designer');
  });

  it('contribution → Contributor', () => {
    expect(nameFor('contributor')).toBe('Contributor');
  });

  it('all six engine directions map to their canonical display names', () => {
    expect(nameFor('contributor')).toBe('Contributor');
    expect(nameFor('experience_seeker')).toBe('Experience Seeker');
    expect(nameFor('freedom_designer')).toBe('Freedom Designer');
    expect(nameFor('growth_focused')).toBe('Growth Focused');
    expect(nameFor('creator')).toBe('Creator');
    expect(nameFor('relationship_rebuilder')).toBe('Relationship Rebuilder');
  });
});

/* ------------------------------------------------------------------ */
/* G — situation rules                                                */
/* ------------------------------------------------------------------ */

describe('computeHeadline — situation rules for empty firing set', () => {
  it('empty firing set + 3 past_presence yes → "Nothing reading as a pull right now."', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap({
      directions: {
        creator: { past_presence: 'yes' },
        freedom_designer: { past_presence: 'yes' },
        contributor: { past_presence: 'yes' },
      },
    });
    const h = computeHeadline(out, inp);
    expect(h.direction_names).toEqual([]);
    expect(h.situation_text).toBe('Nothing reading as a pull right now.');
  });

  it('empty firing set + 2 past_presence yes → "Directions all reading low."', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap({
      directions: {
        creator: { past_presence: 'yes' },
        freedom_designer: { past_presence: 'yes' },
      },
    });
    const h = computeHeadline(out, inp);
    expect(h.situation_text).toBe('Directions all reading low.');
  });

  it('empty firing set + 0 past_presence yes → "Directions all reading low."', () => {
    const out = makeEngineOutput();
    const h = computeHeadline(out, makeInputMap());
    expect(h.situation_text).toBe('Directions all reading low.');
  });

  it('empty firing set + 6 past_presence yes → "Nothing reading as a pull right now."', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap({
      directions: {
        contributor: { past_presence: 'yes' },
        experience_seeker: { past_presence: 'yes' },
        freedom_designer: { past_presence: 'yes' },
        growth_focused: { past_presence: 'yes' },
        creator: { past_presence: 'yes' },
        relationship_rebuilder: { past_presence: 'yes' },
      },
    });
    const h = computeHeadline(out, inp);
    expect(h.situation_text).toBe('Nothing reading as a pull right now.');
  });
});

/* ------------------------------------------------------------------ */
/* H — non-empty firing set has null situation_text                   */
/* ------------------------------------------------------------------ */

describe('computeHeadline — non-empty firing set situation_text is null', () => {
  it('any non-empty firing set → situation_text === null', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 60 }],
    });
    expect(computeHeadline(out, makeInputMap()).situation_text).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* I — top-3 alphabetical tiebreak                                    */
/* ------------------------------------------------------------------ */

describe('computeHeadline — top-3 alphabetical tiebreak', () => {
  it('three at pull=80 alphabetical, three at pull=50 → top 3 are the 80s in alphabetical order', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 80, pull_quality: ['real'] },
        { direction: 'contributor', pull: 80, pull_quality: ['real'] },
        { direction: 'relationship_rebuilder', pull: 50, pull_quality: ['real'] },
        { direction: 'growth_focused', pull: 50, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 50, pull_quality: ['real'] },
      ],
    });
    const h = computeHeadline(out, makeInputMap());
    expect(h.direction_names).toEqual([
      'Contributor',
      'Creator',
      'Freedom Designer',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* I.b — direction_engine_names parallel field                         */
/* ------------------------------------------------------------------ */

describe('computeHeadline — direction_engine_names', () => {
  it('three firing → engine names parallel-ordered to display names', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 90, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 80, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 70, pull_quality: ['real'] },
      ],
    });
    const h = computeHeadline(out, makeInputMap());
    expect(h.direction_names).toEqual([
      'Creator',
      'Freedom Designer',
      'Experience Seeker',
    ]);
    expect(h.direction_engine_names).toEqual(['creator', 'freedom_designer', 'experience_seeker']);
  });

  it('empty firing set → both arrays empty', () => {
    const h = computeHeadline(makeEngineOutput(), makeInputMap());
    expect(h.direction_names).toEqual([]);
    expect(h.direction_engine_names).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* J — purity                                                         */
/* ------------------------------------------------------------------ */

describe('computeHeadline — purity', () => {
  it('two calls with identical inputs return deep-equal results', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 90 }],
    });
    const inp = makeInputMap();
    const a = computeHeadline(out, inp);
    const b = computeHeadline(out, inp);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('does not mutate output or input', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 90 }],
    });
    const inp = makeInputMap();
    const outBefore = JSON.stringify(out);
    const inpBefore = JSON.stringify(inp);
    computeHeadline(out, inp);
    expect(JSON.stringify(out)).toBe(outBefore);
    expect(JSON.stringify(inp)).toBe(inpBefore);
  });
});
