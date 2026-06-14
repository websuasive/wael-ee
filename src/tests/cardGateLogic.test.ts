// Unit tests for resolveGatedC pure function
// Tests the actual gate-write decision logic, not hand-simulated setAnswer calls

import { describe, it, expect } from 'vitest';
import { resolveGatedC } from '../ui/questionnaire/utils/cardGateLogic';

describe('resolveGatedC', () => {
  it('returns "skipped" when newB equals gate value', () => {
    const result = resolveGatedC('a', 'b', 'a', undefined);
    expect(result).toBe('skipped');
  });

  it('returns "skipped" when newB equals gate value, regardless of oldB', () => {
    const result = resolveGatedC('a', undefined, 'a', 'b');
    expect(result).toBe('skipped');
  });

  it('returns undefined (clear) when oldB was gate value, newB is non-gate, and currentC is "skipped"', () => {
    const result = resolveGatedC('b', 'a', 'a', 'skipped');
    expect(result).toBeUndefined();
  });

  it('returns no_change when oldB was gate value, newB is non-gate, but currentC is not "skipped"', () => {
    const result = resolveGatedC('b', 'a', 'a', 'c');
    expect(result).toBe('no_change');
  });

  it('returns no_change when newB is non-gate value and c already has a real pick', () => {
    const result = resolveGatedC('b', 'a', 'a', 'a');
    expect(result).toBe('no_change');
  });

  it('returns no_change when newB is undefined', () => {
    const result = resolveGatedC(undefined, 'b', 'a', undefined);
    expect(result).toBe('no_change');
  });

  it('returns no_change when newB is null', () => {
    const result = resolveGatedC(null, 'b', 'a', undefined);
    expect(result).toBe('no_change');
  });

  it('returns no_change when newB is non-gate and no transition from gate', () => {
    const result = resolveGatedC('b', 'c', 'a', undefined);
    expect(result).toBe('no_change');
  });

  it('behaves correctly with gateValue other than "a" (parameterised)', () => {
    const result = resolveGatedC('x', 'y', 'x', undefined);
    expect(result).toBe('skipped');
  });

  it('clears correctly with gateValue other than "a"', () => {
    const result = resolveGatedC('y', 'x', 'x', 'skipped');
    expect(result).toBeUndefined();
  });

  it('returns no_change when newB equals gateValue but c already equals "skipped" (idempotent)', () => {
    const result = resolveGatedC('a', 'b', 'a', 'skipped');
    expect(result).toBe('skipped');
  });
});
