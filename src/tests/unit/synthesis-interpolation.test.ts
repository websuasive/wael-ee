// Unit tests for the synthesis-layer interpolation utility (SYNTHESIS.md section 6.10).

import { describe, it, expect } from 'vitest';
import { interpolate } from '@/synthesis/interpolation';

describe('interpolate — basic substitution', () => {
  it('substitutes a single placeholder', () => {
    expect(interpolate('Hello {name}', { name: 'world' })).toBe('Hello world');
  });

  it('substitutes multiple placeholders', () => {
    expect(interpolate('{a} and {b}', { a: 'x', b: 'y' })).toBe('x and y');
  });

  it('returns plain text unchanged when no placeholders', () => {
    expect(interpolate('plain text', {})).toBe('plain text');
  });
});

describe('interpolate — numeric values', () => {
  it('stringifies numeric values', () => {
    expect(interpolate('{n} directions', { n: 3 })).toBe('3 directions');
  });

  it('stringifies zero (not falsy-skipped)', () => {
    expect(interpolate('{x}', { x: 0 })).toBe('0');
  });
});

describe('interpolate — missing keys (visible-bug behaviour)', () => {
  it('leaves placeholder intact when key absent from context', () => {
    expect(interpolate('{name}', {})).toBe('{name}');
  });

  it('partially substitutes when only some keys present', () => {
    expect(interpolate('{a} {b}', { a: 'x' })).toBe('x {b}');
  });
});

describe('interpolate — repeated placeholders', () => {
  it('substitutes all occurrences of a repeated placeholder', () => {
    expect(interpolate('{x} and {x}', { x: 'one' })).toBe('one and one');
  });
});

describe('interpolate — adjacent and back-to-back patterns', () => {
  it('handles adjacent placeholders', () => {
    expect(interpolate('{a}{b}', { a: 'x', b: 'y' })).toBe('xy');
  });

  it('handles repeated adjacent placeholders', () => {
    expect(interpolate('{a}{a}', { a: 'x' })).toBe('xx');
  });
});

describe('interpolate — edge cases', () => {
  it('returns empty template unchanged', () => {
    expect(interpolate('', {})).toBe('');
  });

  it('leaves empty placeholder {} intact (regex requires identifier)', () => {
    expect(interpolate('{}', {})).toBe('{}');
  });

  it('leaves {whitespace-padded} placeholders intact', () => {
    expect(interpolate('{ name }', { name: 'world' })).toBe('{ name }');
  });

  it('does not match keys containing whitespace', () => {
    expect(
      interpolate('{name with space}', { 'name with space': 'x' }),
    ).toBe('{name with space}');
  });

  it('does not match keys with hyphens (identifier set only)', () => {
    expect(interpolate('{a-b}', { 'a-b': 'x' })).toBe('{a-b}');
  });
});

describe('interpolate — purity', () => {
  it('returns identical output for identical inputs across calls', () => {
    const tpl = '{a} {b} {a}';
    const ctx = { a: 'x', b: 'y' };
    expect(interpolate(tpl, ctx)).toBe(interpolate(tpl, ctx));
  });

  it('does not mutate the context object', () => {
    const ctx = { a: 'x', b: 'y' };
    const before = JSON.stringify(ctx);
    interpolate('{a} {b}', ctx);
    expect(JSON.stringify(ctx)).toBe(before);
  });
});
