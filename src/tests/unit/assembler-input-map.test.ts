import { describe, it, expect } from 'vitest';
import { buildInputMap } from '@/assembler/input-map';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { validateInputMap } from '@/engine/validation';
import type { InputMap } from '@/engine/types';

describe('buildInputMap', () => {
  describe('THE PRIZE — real-validator end-to-end pass', () => {
    it('makeAnswers() (fully-specified neutral baseline) -> buildInputMap -> validateInputMap -> VALID', () => {
      const answers = makeAnswers();
      const inputMap = buildInputMap('test-user', answers);
      const result = validateInputMap(inputMap);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(inputMap);
      }
    });

    it('second valid respondent (non-baseline but still valid) -> buildInputMap -> validateInputMap -> VALID', () => {
      const answers = makeAnswers({
        q5_recent_life_shape_change: 'b', // recent_life_shape_change: yes, replacement_structure_exists: yes
        q29_recent_reaching: 'a', // recent_reaching: recent_and_awkward
        q2_primary_load: 'a', // primary_load: paid_work
        q34_self_report: { kind: 'nothing_really' }, // named_absences: ['nothing_really']
      });
      const inputMap = buildInputMap('test-user', answers);
      const result = validateInputMap(inputMap);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(inputMap);
      }
    });
  });

  describe('TOP-LEVEL STRUCTURAL CHECK', () => {
    it('buildInputMap(makeAnswers()) has EXACTLY the six engine top-level keys', () => {
      const answers = makeAnswers();
      const result = buildInputMap('test-user', answers);

      const engineKeys: Array<keyof InputMap> = [
        'directions',
        'cross_direction',
        'domains',
        'constraints',
        'cross_cutting',
        'self_report',
      ];

      const resultKeys = Object.keys(result) as Array<keyof InputMap>;

      // Every engine key is present (no missing)
      for (const key of engineKeys) {
        expect(resultKeys).toContain(key);
      }

      // Key count is 6
      expect(resultKeys).toHaveLength(6);

      // No composed key outside the six (no extra)
      for (const key of resultKeys) {
        expect(engineKeys).toContain(key);
      }
    });
  });
});
