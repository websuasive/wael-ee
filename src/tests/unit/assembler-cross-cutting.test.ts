import { describe, it, expect } from 'vitest';
import { buildCrossCutting } from '@/assembler/cross-cutting';
import { makeAnswers } from '@/tests/helpers/make-answers';
import type { InputMap } from '@/engine/types';

describe('buildCrossCutting', () => {
  describe('THE Q5 PAIR pins (RISK 1 — assert the PAIR per option)', () => {
    it("q5='a' -> { recent_life_shape_change: 'no', replacement_structure_exists: 'no' }", () => {
      const answers = makeAnswers({ q5_recent_life_shape_change: 'a' });
      const result = buildCrossCutting(answers);
      expect(result.recent_life_shape_change).toBe('no');
      expect(result.replacement_structure_exists).toBe('no');
    });

    it("q5='b' -> { recent_life_shape_change: 'yes', replacement_structure_exists: 'yes' }", () => {
      const answers = makeAnswers({ q5_recent_life_shape_change: 'b' });
      const result = buildCrossCutting(answers);
      expect(result.recent_life_shape_change).toBe('yes');
      expect(result.replacement_structure_exists).toBe('yes');
    });

    it("q5='c' -> { recent_life_shape_change: 'yes', replacement_structure_exists: 'no' } (differing-pair guard)", () => {
      const answers = makeAnswers({ q5_recent_life_shape_change: 'c' });
      const result = buildCrossCutting(answers);
      expect(result.recent_life_shape_change).toBe('yes');
      expect(result.replacement_structure_exists).toBe('no');
      // Explicit guard: c is NOT 'yes' for replacement_structure_exists (the differing-pair case)
      expect(result.replacement_structure_exists).not.toBe('yes');
    });
  });


  describe('recent_reaching pin (reuse)', () => {
    it("q29='a' -> 'recent_and_awkward'", () => {
      const answers = makeAnswers({ q29_recent_reaching: 'a' });
      const result = buildCrossCutting(answers);
      expect(result.recent_reaching).toBe('recent_and_awkward');
    });
  });

  describe('THE STRUCTURAL EXACT-SHAPE CHECK (RISK 2 — drift-catcher)', () => {
    it('key set equals the engine four-key set EXACTLY — no missing, no extra', () => {
      const answers = makeAnswers();
      const result = buildCrossCutting(answers);

      const engineKeys: Array<keyof InputMap['cross_cutting']> = [
        'recent_life_shape_change',
        'replacement_structure_exists',
        'recent_reaching',
      ];

      const resultKeys = Object.keys(result) as Array<keyof InputMap['cross_cutting']>;

      // Every engine key is present (no missing)
      for (const key of engineKeys) {
        expect(resultKeys).toContain(key);
      }

      // Key count is 3
      expect(resultKeys).toHaveLength(3);

      // No composed key outside the four (no extra)
      for (const key of resultKeys) {
        expect(engineKeys).toContain(key);
      }
    });

    it('each field within its allowed set', () => {
      const answers = makeAnswers();
      const result = buildCrossCutting(answers);

      expect(['yes', 'no']).toContain(result.recent_life_shape_change);
      expect(['yes', 'no']).toContain(result.replacement_structure_exists);
      expect(['recent_and_awkward', 'mid_stream', 'long_established', 'no_current_reaching']).toContain(
        result.recent_reaching
      );
    });
  });

  describe('ALWAYS-EMIT pin', () => {
    it("with q5='a' (recent_life_shape_change='no'), replacement_structure_exists is STILL PRESENT and equals 'no'", () => {
      const answers = makeAnswers({ q5_recent_life_shape_change: 'a' });
      const result = buildCrossCutting(answers);
      expect(result.recent_life_shape_change).toBe('no');
      // Key exists (not omitted)
      expect('replacement_structure_exists' in result).toBe(true);
      expect(result.replacement_structure_exists).toBe('no');
    });
  });
});
