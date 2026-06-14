import { describe, it, expect } from 'vitest';
import { checkSocialityConfidence } from '@/assembler/consistency/check-sociality-confidence';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { buildInputMap } from '@/assembler/input-map';

describe('checkSocialityConfidence (CHECK 8 — INERT)', () => {
  it('INERT: for any input (baseline) -> returns [] (it does nothing — that IS its spec)', () => {
    const answers = makeAnswers();
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkSocialityConfidence(inputMap);

    expect(flags).toEqual([]);
  });

  it('INERT: for a varied input -> returns [] (documented no-op)', () => {
    const answers = makeAnswers({
      q7_sociality_default: 'a', // vary the sociality input
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkSocialityConfidence(inputMap);

    expect(flags).toEqual([]);
  });

  describe('FENCE — function-level', () => {
    it('signature takes Readonly<InputMap>, returns ConsistencyFlag[] — no InputMap in return', () => {
      const answers = makeAnswers();
      const inputMap = buildInputMap('test-user', answers);

      const flags = checkSocialityConfidence(inputMap);

      expect(Array.isArray(flags)).toBe(true);
    });
  });
});
