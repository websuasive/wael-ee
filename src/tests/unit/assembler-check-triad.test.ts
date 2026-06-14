import { describe, it, expect } from 'vitest';
import { checkTriad } from '@/assembler/consistency/check-triad';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { buildInputMap } from '@/assembler/input-map';
import type { ConsistencyFlag } from '@/assembler/consistency/types';

describe('checkTriad', () => {
  describe('Branch 1 — all same direction', () => {
    it('q10=q10b=q10c=contributor -> reach_confidence high, flags []', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'contributor',
        q10b_retrospective: 'contributor',
        q10c_counterfactual: 'contributor',
      });
      const inputMap = buildInputMap('test-user', answers);
      const result = checkTriad(inputMap, answers);

      expect(result.reach_confidence).toBe('high');
      expect(result.flags).toEqual([]);
    });
  });

  describe('Branch 2 — all rest/none', () => {
    it('q10/q10b/q10c=rest -> high, []', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'rest',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const result = checkTriad(inputMap, answers);

      expect(result.reach_confidence).toBe('high');
      expect(result.flags).toEqual([]);
    });

    it('mix q10=rest,q10b=none,q10c=rest -> high, []', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'none',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const result = checkTriad(inputMap, answers);

      expect(result.reach_confidence).toBe('high');
      expect(result.flags).toEqual([]);
    });
  });

  describe('Branch 3 — tired_or_blocked_pull, BOTH note variants', () => {
    it('tired-but-not-empty: q10=rest, q10b=contributor, q10c=rest -> low, flag with tired-but-not-empty note', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'contributor',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const result = checkTriad(inputMap, answers);

      expect(result.reach_confidence).toBe('low');
      expect(result.flags).toHaveLength(1);
      const flag = result.flags[0] as ConsistencyFlag;
      expect(flag.code).toBe('tired_or_blocked_pull');
      expect(flag.severity).toBe('tension');
      expect(flag.note).toMatch(/tired-but-not-empty/);
    });

    it('filtered: q10=rest, q10b=rest, q10c=contributor -> low, flag with filtered note', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'rest',
        q10c_counterfactual: 'contributor',
      });
      const inputMap = buildInputMap('test-user', answers);
      const result = checkTriad(inputMap, answers);

      expect(result.reach_confidence).toBe('low');
      expect(result.flags).toHaveLength(1);
      const flag = result.flags[0] as ConsistencyFlag;
      expect(flag.code).toBe('tired_or_blocked_pull');
      expect(flag.severity).toBe('tension');
      expect(flag.note).toMatch(/filtered/);
    });
  });

  describe('Branch 4 — divergent', () => {
    it('q10=contributor, q10b=creator, q10c=growth_focused -> low, divergent_reach flag', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'contributor',
        q10b_retrospective: 'creator',
        q10c_counterfactual: 'growth_focused',
      });
      const inputMap = buildInputMap('test-user', answers);
      const result = checkTriad(inputMap, answers);

      expect(result.reach_confidence).toBe('low');
      expect(result.flags).toHaveLength(1);
      const flag = result.flags[0] as ConsistencyFlag;
      expect(flag.code).toBe('divergent_reach');
      expect(flag.severity).toBe('tension');
    });
  });

  describe('OTHERWISE / EXHAUSTIVENESS pin', () => {
    it('q10=contributor, q10b=contributor, q10c=rest (partial corroboration) -> low, no flag', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'contributor',
        q10b_retrospective: 'contributor',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const result = checkTriad(inputMap, answers);

      expect(result.reach_confidence).toBe('low');
      expect(result.flags).toEqual([]);
    });

    it('q10=contributor, q10b=creator, q10c=contributor (partial corroboration) -> low, no flag', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'contributor',
        q10b_retrospective: 'creator',
        q10c_counterfactual: 'contributor',
      });
      const inputMap = buildInputMap('test-user', answers);
      const result = checkTriad(inputMap, answers);

      expect(result.reach_confidence).toBe('low');
      expect(result.flags).toEqual([]);
    });
  });

  describe('FENCE — function-level', () => {
    it('checkTriad takes Readonly<InputMap> and returns {reach_confidence, flags} — no InputMap in return', () => {
      const answers = makeAnswers();
      const inputMap = buildInputMap('test-user', answers);
      const result = checkTriad(inputMap, answers);

      expect(result).toHaveProperty('reach_confidence');
      expect(result).toHaveProperty('flags');
      expect(result).not.toHaveProperty('input_map');
    });
  });
});
