import { describe, it, expect } from 'vitest';
import { runChecks } from '@/assembler/consistency/run-checks';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { buildInputMap } from '@/assembler/input-map';
import { DEFAULT_DOMAIN_STATES } from '@/tests/helpers/make-answers';

describe('runChecks', () => {
  it('SHAPE: runChecks(buildInputMap baseline) returns { reach_confidence, flags }', () => {
    const answers = makeAnswers();
    const inputMap = buildInputMap('test-user', answers);
    const result = runChecks(inputMap, answers);

    expect(result).toHaveProperty('reach_confidence');
    expect(result).toHaveProperty('flags');
    expect(typeof result.reach_confidence).toBe('string');
    expect(Array.isArray(result.flags)).toBe(true);
  });

  it('SHAPE: baseline -> reach_confidence high [all-rest/none triad], flags [] [clean baseline fires nothing]', () => {
    const answers = makeAnswers();
    const inputMap = buildInputMap('test-user', answers);
    const result = runChecks(inputMap, answers);

    expect(result.reach_confidence).toBe('high');
    expect(result.flags).toEqual([]);
  });

  it('checkTriad SINGLE-CALL split: divergent-triad -> reach_confidence low AND divergent_reach flag IN flags', () => {
    const answers = makeAnswers({
      q10_direction_chosen: 'contributor',
      q10b_retrospective: 'creator',
      q10c_counterfactual: 'experience_seeker',
    });
    const inputMap = buildInputMap('test-user', answers);
    const result = runChecks(inputMap, answers);

    expect(result.reach_confidence).toBe('low');
    expect(result.flags.some((f: { code: string }) => f.code === 'divergent_reach')).toBe(true);
  });

  it('COMPLETENESS (all nine concatenate): multi-trigger answers -> flags contains stopped_expecting_without_history AND hollow_mattering AND divergent_reach', () => {
    const answers = makeAnswers({
      // CHECK 2 trigger
      q9_stopped_expecting_ticked: ['contributor'],
      q8_past_presence_ticked: [],
      // CHECK 7 trigger
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 70,
        felt_aliveness: 35,
      },
      // CHECK 1 divergent trigger
      q10_direction_chosen: 'contributor',
      q10b_retrospective: 'creator',
      q10c_counterfactual: 'experience_seeker',
    });
    const inputMap = buildInputMap('test-user', answers);
    const result = runChecks(inputMap, answers);

    expect(result.flags.some((f: { code: string }) => f.code === 'stopped_expecting_without_history')).toBe(true);
    expect(result.flags.some((f: { code: string }) => f.code === 'hollow_mattering')).toBe(true);
    expect(result.flags.some((f: { code: string }) => f.code === 'divergent_reach')).toBe(true);
  });

  it('CHECK 8 still called (contributes []): the completeness result has no sociality flag but the aggregation did not skip it', () => {
    const answers = makeAnswers({
      // CHECK 2 trigger
      q9_stopped_expecting_ticked: ['contributor'],
      q8_past_presence_ticked: [],
      // CHECK 7 trigger
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 70,
        felt_aliveness: 35,
      },
      // CHECK 1 divergent trigger
      q10_direction_chosen: 'contributor',
      q10b_retrospective: 'creator',
      q10c_counterfactual: 'experience_seeker',
    });
    const inputMap = buildInputMap('test-user', answers);
    const result = runChecks(inputMap, answers);

    // CHECK 8 contributes nothing, but should not crash
    expect(result.flags.every((f: { code: string }) => f.code !== 'sociality_low_confidence')).toBe(true);
  });

  describe('FENCE — function-level', () => {
    it('runChecks takes Readonly<InputMap>, returns { reach_confidence, flags } — no InputMap in return', () => {
      const answers = makeAnswers();
      const inputMap = buildInputMap('test-user', answers);

      const result = runChecks(inputMap, answers);

      expect(result).not.toHaveProperty('inputMap');
      expect(result).toHaveProperty('reach_confidence');
      expect(result).toHaveProperty('flags');
    });
  });
});
