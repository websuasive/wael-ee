// Unit tests for the render-layer term scanner. Pins the four behavioural
// pillars per RENDER.md section 5.4: case-sensitive, word-boundary-anchored,
// longest-match-wins, first-occurrence-per-string.

import { describe, it, expect } from 'vitest';
import {
  scanTermsInString,
  type TermScanSegment,
} from '@/ui/render/term_scanner';

function reconstruct(segments: TermScanSegment[]): string {
  return segments.map((s) => s.value).join('');
}

/* ------------------------------------------------------------------ */
/* A — Empty / trivial                                                 */
/* ------------------------------------------------------------------ */

describe('scanTermsInString — empty / trivial', () => {
  it('empty string → []', () => {
    expect(scanTermsInString('')).toEqual([]);
  });

  it('plain text with no matches → single text segment', () => {
    const input = 'nothing of note here';
    expect(scanTermsInString(input)).toEqual([{ kind: 'text', value: input }]);
  });
});

/* ------------------------------------------------------------------ */
/* B — Direct match                                                    */
/* ------------------------------------------------------------------ */

describe('scanTermsInString — direct match', () => {
  it('term at start: "capacity strain firing"', () => {
    expect(scanTermsInString('capacity strain firing')).toEqual([
      { kind: 'term', value: 'capacity strain' },
      { kind: 'text', value: ' firing' },
    ]);
  });

  it('term in middle: "some capacity strain in here"', () => {
    expect(scanTermsInString('some capacity strain in here')).toEqual([
      { kind: 'text', value: 'some ' },
      { kind: 'term', value: 'capacity strain' },
      { kind: 'text', value: ' in here' },
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* C — Case-sensitivity                                                */
/* ------------------------------------------------------------------ */

describe('scanTermsInString — case-sensitivity', () => {
  it('"Capacity Strain firing" → no match (uppercase)', () => {
    expect(scanTermsInString('Capacity Strain firing')).toEqual([
      { kind: 'text', value: 'Capacity Strain firing' },
    ]);
  });

  it('"making builds" → no match (display name not in targets)', () => {
    expect(scanTermsInString('making builds')).toEqual([
      { kind: 'text', value: 'making builds' },
    ]);
  });

  it('case-insensitive first character: "Attention moving without much registering" matches (clause-initial)', () => {
    const input = 'Attention moving without much registering, he opens the email.';
    expect(scanTermsInString(input)).toEqual([
      { kind: 'term', value: 'Attention moving without much registering' },
      { kind: 'text', value: ', he opens the email.' },
    ]);
  });

  it('case-insensitive first character: "attention moving without much registering" matches (mid-sentence)', () => {
    const input = 'His attention moving without much registering this morning.';
    expect(scanTermsInString(input)).toEqual([
      { kind: 'text', value: 'His ' },
      { kind: 'term', value: 'attention moving without much registering' },
      { kind: 'text', value: ' this morning.' },
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* D — Word boundary                                                   */
/* ------------------------------------------------------------------ */

describe('scanTermsInString — word boundary', () => {
  it('"suppressedish" → no match (word char after)', () => {
    expect(scanTermsInString('suppressedish')).toEqual([
      { kind: 'text', value: 'suppressedish' },
    ]);
  });

  it('"unsuppressed" → no match (word char before)', () => {
    expect(scanTermsInString('unsuppressed')).toEqual([
      { kind: 'text', value: 'unsuppressed' },
    ]);
  });

  it('boundary at start: "suppressed wanting"', () => {
    expect(scanTermsInString('suppressed wanting')).toEqual([
      { kind: 'term', value: 'suppressed' },
      { kind: 'text', value: ' wanting' },
    ]);
  });

  it('boundary at end: "is suppressed"', () => {
    expect(scanTermsInString('is suppressed')).toEqual([
      { kind: 'text', value: 'is ' },
      { kind: 'term', value: 'suppressed' },
    ]);
  });

  it('punctuation after as boundary: "is suppressed."', () => {
    expect(scanTermsInString('is suppressed.')).toEqual([
      { kind: 'text', value: 'is ' },
      { kind: 'term', value: 'suppressed' },
      { kind: 'text', value: '.' },
    ]);
  });

  it('hyphen inside candidate: "mid-process firing"', () => {
    expect(scanTermsInString('mid-process firing')).toEqual([
      { kind: 'term', value: 'mid-process' },
      { kind: 'text', value: ' firing' },
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* E — Longest match wins                                              */
/* ------------------------------------------------------------------ */

describe('scanTermsInString — longest match wins', () => {
  it('"desired direction (partial evidence)" wins over "desired direction"', () => {
    const input = 'desired direction (partial evidence) in his profile';
    expect(scanTermsInString(input)).toEqual([
      { kind: 'term', value: 'desired direction (partial evidence)' },
      { kind: 'text', value: ' in his profile' },
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* F — First occurrence per string                                     */
/* ------------------------------------------------------------------ */

describe('scanTermsInString — first occurrence per string', () => {
  it('same term recurring: only first fires', () => {
    expect(scanTermsInString('suppressed and suppressed again')).toEqual([
      { kind: 'term', value: 'suppressed' },
      { kind: 'text', value: ' and suppressed again' },
    ]);
  });

  it('different terms in same string: each fires (per-term first-occurrence)', () => {
    expect(scanTermsInString('capacity strain and suppressed')).toEqual([
      { kind: 'term', value: 'capacity strain' },
      { kind: 'text', value: ' and ' },
      { kind: 'term', value: 'suppressed' },
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* G — Reconstruction invariant                                        */
/* ------------------------------------------------------------------ */

describe('scanTermsInString — reconstruction invariant', () => {
  const samples = [
    '',
    'no matches at all',
    'capacity strain firing',
    'some capacity strain in here',
    'desired direction (partial evidence) in his profile',
    'suppressed and suppressed again',
    'capacity strain and suppressed and capacity strain again',
    'mid-process firing alongside between shapes signal',
    'is suppressed.',
  ];
  it.each(samples)(
    'concatenated segment values reproduce input: %s',
    (input) => {
      expect(reconstruct(scanTermsInString(input))).toBe(input);
    },
  );
});

/* ------------------------------------------------------------------ */
/* H — Pure function                                                   */
/* ------------------------------------------------------------------ */

describe('scanTermsInString — purity', () => {
  it('two calls with identical input return deep-equal output', () => {
    const input = 'capacity strain and suppressed';
    expect(scanTermsInString(input)).toEqual(scanTermsInString(input));
  });
});
