// Unit tests for experience candidate directions (SYNTHESIS.md section 5.9).

import { describe, it, expect } from 'vitest';
import type { DirectionName } from '@/engine';
import { computeExperienceCandidates } from '@/synthesis/experience_candidates';
import { computeFiringSet } from '@/synthesis/headline';
import {
  makeEngineOutput,
  makeInputMap,
} from './synthesis-test-helpers';

const ALL_DIRECTIONS: DirectionName[] = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
];

/* ------------------------------------------------------------------ */
/* A — empty                                                          */
/* ------------------------------------------------------------------ */

describe('computeExperienceCandidates — empty', () => {
  it('baseline (no firing, no past_presence) → []', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap();
    expect(
      computeExperienceCandidates(out, inp, computeFiringSet(out)),
    ).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* B — firing entries only                                            */
/* ------------------------------------------------------------------ */

describe('computeExperienceCandidates — firing entries only', () => {
  it('one firing direction, no past_presence', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 60, pull_quality: ['real'] }],
    });
    const inp = makeInputMap();
    const result = computeExperienceCandidates(out, inp, computeFiringSet(out));
    expect(result).toEqual([
      {
        direction_name: 'Creator',
        direction_engine_name: 'creator',
        priority: 'firing',
        pull: 60,
      },
    ]);
  });

  it('three firing directions in pull-desc order', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 60, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 50, pull_quality: ['real'] },
      ],
    });
    const result = computeExperienceCandidates(
      out,
      makeInputMap(),
      computeFiringSet(out),
    );
    expect(result.map((r) => r.direction_name)).toEqual([
      'Creator',
      'Freedom Designer',
      'Experience Seeker',
    ]);
    expect(result.every((r) => r.priority === 'firing')).toBe(true);
  });

  it('all six firing → six firing entries', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 95, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 85, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 75, pull_quality: ['real'] },
        { direction: 'contributor', pull: 65, pull_quality: ['real'] },
        { direction: 'growth_focused', pull: 55, pull_quality: ['real'] },
        { direction: 'relationship_rebuilder', pull: 50, pull_quality: ['real'] },
      ],
    });
    const result = computeExperienceCandidates(
      out,
      makeInputMap(),
      computeFiringSet(out),
    );
    expect(result).toHaveLength(6);
    expect(result.every((r) => r.priority === 'firing')).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* C — past-presence only                                             */
/* ------------------------------------------------------------------ */

describe('computeExperienceCandidates — past-presence only', () => {
  it('three past_presence directions, no firing → three past_presence_only entries pull-desc', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 30 },
        { direction: 'freedom_designer', pull: 20 },
        { direction: 'experience_seeker', pull: 10 },
      ],
    });
    const inp = makeInputMap({
      directions: {
        creator: { past_presence: 'yes' },
        freedom_designer: { past_presence: 'yes' },
        experience_seeker: { past_presence: 'yes' },
      },
    });
    const result = computeExperienceCandidates(out, inp, computeFiringSet(out));
    expect(result.map((r) => r.direction_name)).toEqual([
      'Creator',
      'Freedom Designer',
      'Experience Seeker',
    ]);
    expect(result.every((r) => r.priority === 'past_presence_only')).toBe(
      true,
    );
  });

  it('all six past_presence yes, none firing → six past_presence_only entries', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap({
      directions: Object.fromEntries(
        ALL_DIRECTIONS.map((d) => [d, { past_presence: 'yes' }]),
      ) as never,
    });
    const result = computeExperienceCandidates(out, inp, computeFiringSet(out));
    expect(result).toHaveLength(6);
    expect(result.every((r) => r.priority === 'past_presence_only')).toBe(
      true,
    );
  });

  it('one past_presence yes → one entry', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap({
      directions: { creator: { past_presence: 'yes' } },
    });
    const result = computeExperienceCandidates(out, inp, computeFiringSet(out));
    expect(result).toEqual([
      {
        direction_name: 'Creator',
        direction_engine_name: 'creator',
        priority: 'past_presence_only',
        pull: 0,
      },
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* D — mixed firing + past-presence                                   */
/* ------------------------------------------------------------------ */

describe('computeExperienceCandidates — mixed', () => {
  it('two firing + two past-presence-only → ordered firing-first, pull-desc within each group', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 70, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 60, pull_quality: ['real'] },
        { direction: 'growth_focused', pull: 20 },
        { direction: 'contributor', pull: 10 },
      ],
    });
    const inp = makeInputMap({
      directions: {
        growth_focused: { past_presence: 'yes' },
        contributor: { past_presence: 'yes' },
      },
    });
    const result = computeExperienceCandidates(out, inp, computeFiringSet(out));
    expect(result).toEqual([
      {
        direction_name: 'Creator',
        direction_engine_name: 'creator',
        priority: 'firing',
        pull: 70,
      },
      {
        direction_name: 'Freedom Designer',
        direction_engine_name: 'freedom_designer',
        priority: 'firing',
        pull: 60,
      },
      {
        direction_name: 'Growth Focused',
        direction_engine_name: 'growth_focused',
        priority: 'past_presence_only',
        pull: 20,
      },
      {
        direction_name: 'Contributor',
        direction_engine_name: 'contributor',
        priority: 'past_presence_only',
        pull: 10,
      },
    ]);
  });

  it('firing direction with past_presence: yes appears only as firing (no duplication)', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const inp = makeInputMap({
      directions: { creator: { past_presence: 'yes' } },
    });
    const result = computeExperienceCandidates(out, inp, computeFiringSet(out));
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      direction_name: 'Creator',
      direction_engine_name: 'creator',
      priority: 'firing',
      pull: 80,
    });
  });
});

/* ------------------------------------------------------------------ */
/* E — past presence gate                                             */
/* ------------------------------------------------------------------ */

describe('computeExperienceCandidates — past_presence gate', () => {
  it('past_presence: no AND not firing → skipped', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 30 }], // not firing (pull < 50, empty quality)
    });
    const inp = makeInputMap(); // past_presence defaults to 'no'
    expect(
      computeExperienceCandidates(out, inp, computeFiringSet(out)),
    ).toEqual([]);
  });

  it('past_presence: yes AND firing → emitted as firing only (single entry)', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 60, pull_quality: ['real'] }],
    });
    const inp = makeInputMap({
      directions: { creator: { past_presence: 'yes' } },
    });
    const result = computeExperienceCandidates(out, inp, computeFiringSet(out));
    expect(result).toHaveLength(1);
    expect(result[0]!.priority).toBe('firing');
  });
});

/* ------------------------------------------------------------------ */
/* F — display name sweep                                             */
/* ------------------------------------------------------------------ */

describe('computeExperienceCandidates — display name mapping', () => {
  it('all six directions map to canonical display names', () => {
    const expectedNames: Record<DirectionName, string> = {
      contributor: 'Contributor',
      experience_seeker: 'Experience Seeker',
      freedom_designer: 'Freedom Designer',
      growth_focused: 'Growth Focused',
      creator: 'Creator',
      relationship_rebuilder: 'Relationship Rebuilder',
    };
    for (const d of ALL_DIRECTIONS) {
      const out = makeEngineOutput({
        directions: [{ direction: d, pull: 80, pull_quality: ['real'] }],
      });
      const result = computeExperienceCandidates(
        out,
        makeInputMap(),
        computeFiringSet(out),
      );
      expect(result[0]!.direction_name).toBe(expectedNames[d]);
    }
  });
});

/* ------------------------------------------------------------------ */
/* G — pull passthrough                                               */
/* ------------------------------------------------------------------ */

describe('computeExperienceCandidates — pull passthrough', () => {
  it('non-integer pull preserved exactly', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 47.5, pull_quality: ['real'] }],
    });
    const result = computeExperienceCandidates(
      out,
      makeInputMap(),
      computeFiringSet(out),
    );
    expect(result[0]!.pull).toBe(47.5);
  });
});

/* ------------------------------------------------------------------ */
/* H — purity                                                         */
/* ------------------------------------------------------------------ */

describe('computeExperienceCandidates — purity', () => {
  it('two calls with identical inputs return deep-equal results', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 70, pull_quality: ['real'] }],
    });
    const inp = makeInputMap({
      directions: { freedom_designer: { past_presence: 'yes' } },
    });
    const fs = computeFiringSet(out);
    const a = computeExperienceCandidates(out, inp, fs);
    const b = computeExperienceCandidates(out, inp, fs);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('does not mutate output, input, or firingSet', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 70, pull_quality: ['real'] }],
    });
    const inp = makeInputMap({
      directions: { freedom_designer: { past_presence: 'yes' } },
    });
    const fs = computeFiringSet(out);
    const outBefore = JSON.stringify(out);
    const inpBefore = JSON.stringify(inp);
    const fsBefore = JSON.stringify(fs);
    computeExperienceCandidates(out, inp, fs);
    expect(JSON.stringify(out)).toBe(outBefore);
    expect(JSON.stringify(inp)).toBe(inpBefore);
    expect(JSON.stringify(fs)).toBe(fsBefore);
  });
});
