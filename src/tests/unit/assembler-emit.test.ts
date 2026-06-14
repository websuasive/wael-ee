import { describe, it, expect } from 'vitest';
import { assembleFor } from '@/assembler/index';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { buildInputMap } from '@/assembler/input-map';
import { DEFAULT_DOMAIN_STATES } from '@/tests/helpers/make-answers';

describe('assembleFor', () => {
  it('EMIT SHAPE: assembleFor(baseline) returns an object with exactly keys { input_map, reach_confidence, consistency_flags }', () => {
    const answers = makeAnswers();
    const result = assembleFor('test-user', answers);

    expect(result).toHaveProperty('input_map');
    expect(result).toHaveProperty('reach_confidence');
    expect(result).toHaveProperty('consistency_flags');
    expect(Object.keys(result)).toEqual(['input_map', 'reach_confidence', 'consistency_flags']);
  });

  it('EMIT SHAPE: input_map is an InputMap (has the six top-level keys), reach_confidence is string, consistency_flags is array', () => {
    const answers = makeAnswers();
    const result = assembleFor('test-user', answers);

    expect(result.input_map).toHaveProperty('directions');
    expect(result.input_map).toHaveProperty('cross_direction');
    expect(result.input_map).toHaveProperty('domains');
    expect(result.input_map).toHaveProperty('constraints');
    expect(result.input_map).toHaveProperty('cross_cutting');
    expect(result.input_map).toHaveProperty('self_report');
    expect(typeof result.reach_confidence).toBe('string');
    expect(Array.isArray(result.consistency_flags)).toBe(true);
  });

  it('reach_confidence wired: divergent-triad answers -> emit.reach_confidence === "low"', () => {
    const answers = makeAnswers({
      q10_direction_chosen: 'contributor',
      q10b_retrospective: 'creator',
      q10c_counterfactual: 'experience_seeker',
    });
    const result = assembleFor('test-user', answers);

    expect(result.reach_confidence).toBe('low');
  });

  it('consistency_flags wired: the multi-trigger answers -> emit.consistency_flags contains the expected flag codes', () => {
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
    const result = assembleFor('test-user', answers);

    expect(result.consistency_flags.some((f: { code: string }) => f.code === 'stopped_expecting_without_history')).toBe(true);
    expect(result.consistency_flags.some((f: { code: string }) => f.code === 'hollow_mattering')).toBe(true);
    expect(result.consistency_flags.some((f: { code: string }) => f.code === 'divergent_reach')).toBe(true);
  });

  it('THE FENCE PIN: assembleFor(answers).input_map deep-equals buildInputMap(targetUser, answers) (checks fired, but input_map unchanged)', () => {
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
    const targetUser = 'test-user';

    const result = assembleFor(targetUser, answers);
    const freshInputMap = buildInputMap(targetUser, answers);

    expect(result.input_map).toEqual(freshInputMap);
  });
});
