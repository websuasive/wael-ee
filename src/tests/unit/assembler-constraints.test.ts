import { describe, it, expect } from 'vitest';
import { buildConstraints } from '@/assembler/constraints';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { ENERGY_AVAILABILITY_BANDS, BODY_CAPACITY_BANDS, PERMISSION_LADDER } from '@/assembler/params';
import type { InputMap } from '@/engine/types';

describe('buildConstraints', () => {
  describe('BAND MAP pins (letter→param-number)', () => {
    it('energy_availability: a->10, b->30, c->50, d->70, e->90 (against param constants)', () => {
      const answers = makeAnswers({ q25_energy_availability: 'a' });
      const result = buildConstraints(answers);
      expect(result.energy_availability).toBe(ENERGY_AVAILABILITY_BANDS.a);

      const answersB = makeAnswers({ q25_energy_availability: 'b' });
      const resultB = buildConstraints(answersB);
      expect(resultB.energy_availability).toBe(ENERGY_AVAILABILITY_BANDS.b);

      const answersC = makeAnswers({ q25_energy_availability: 'c' });
      const resultC = buildConstraints(answersC);
      expect(resultC.energy_availability).toBe(ENERGY_AVAILABILITY_BANDS.c);

      const answersD = makeAnswers({ q25_energy_availability: 'd' });
      const resultD = buildConstraints(answersD);
      expect(resultD.energy_availability).toBe(ENERGY_AVAILABILITY_BANDS.d);

      const answersE = makeAnswers({ q25_energy_availability: 'e' });
      const resultE = buildConstraints(answersE);
      expect(resultE.energy_availability).toBe(ENERGY_AVAILABILITY_BANDS.e);
    });

    it('body_capacity: a->85, b->65, c->45, d->25 (against param constants)', () => {
      const answers = makeAnswers({ q27_body_capacity: 'a' });
      const result = buildConstraints(answers);
      expect(result.body_capacity).toBe(BODY_CAPACITY_BANDS.a);

      const answersB = makeAnswers({ q27_body_capacity: 'b' });
      const resultB = buildConstraints(answersB);
      expect(resultB.body_capacity).toBe(BODY_CAPACITY_BANDS.b);

      const answersC = makeAnswers({ q27_body_capacity: 'c' });
      const resultC = buildConstraints(answersC);
      expect(resultC.body_capacity).toBe(BODY_CAPACITY_BANDS.c);

      const answersD = makeAnswers({ q27_body_capacity: 'd' });
      const resultD = buildConstraints(answersD);
      expect(resultD.body_capacity).toBe(BODY_CAPACITY_BANDS.d);
    });
  });

  describe('PASS-THROUGH pin', () => {
    it('time_availability: q26 = number -> constraints.time_availability === that number (straight pass-through)', () => {
      const answers = makeAnswers({ q26_time_availability: 37 });
      const result = buildConstraints(answers);
      expect(result.time_availability).toBe(37);

      const answers2 = makeAnswers({ q26_time_availability: 82 });
      const result2 = buildConstraints(answers2);
      expect(result2.time_availability).toBe(82);
    });
  });

  describe('THE Q30 PAIR pins (RISK 1 — assert the PAIR per option)', () => {
    it('a -> { permission: 70, permission_sub_shape: present }', () => {
      const answers = makeAnswers({ q30_permission: 'a' });
      const result = buildConstraints(answers);
      expect(result.permission).toBe(PERMISSION_LADDER.a);
      expect(result.permission_sub_shape).toBe('present');
    });

    it('b -> { permission: 45, permission_sub_shape: act_block } (NOT 45+say_block)', () => {
      const answers = makeAnswers({ q30_permission: 'b' });
      const result = buildConstraints(answers);
      expect(result.permission).toBe(PERMISSION_LADDER.b);
      expect(result.permission_sub_shape).toBe('act_block');
      // Explicit crossing guard: b is NOT 45+say_block
      expect(result.permission_sub_shape).not.toBe('say_block');
    });

    it('c -> { permission: 40, permission_sub_shape: say_block } (NOT 40+act_block)', () => {
      const answers = makeAnswers({ q30_permission: 'c' });
      const result = buildConstraints(answers);
      expect(result.permission).toBe(PERMISSION_LADDER.c);
      expect(result.permission_sub_shape).toBe('say_block');
      // Explicit crossing guard: c is NOT 40+act_block
      expect(result.permission_sub_shape).not.toBe('act_block');
    });

    it('d -> { permission: 25, permission_sub_shape: want_block }', () => {
      const answers = makeAnswers({ q30_permission: 'd' });
      const result = buildConstraints(answers);
      expect(result.permission).toBe(PERMISSION_LADDER.d);
      expect(result.permission_sub_shape).toBe('want_block');
    });
  });

  describe('THE STRUCTURAL EXACT-SHAPE CHECK (RISK 2 — drift-catcher)', () => {
    it('key set equals the engine five-key set EXACTLY — no missing, no extra', () => {
      const answers = makeAnswers();
      const result = buildConstraints(answers);

      const engineKeys: Array<keyof InputMap['constraints']> = [
        'energy_availability',
        'time_availability',
        'body_capacity',
        'permission',
        'permission_sub_shape',
      ];

      const resultKeys = Object.keys(result) as Array<keyof InputMap['constraints']>;

      // Every engine key is present (no missing)
      for (const key of engineKeys) {
        expect(resultKeys).toContain(key);
      }

      // Key count is 5
      expect(resultKeys).toHaveLength(5);

      // No composed key outside the five (no extra)
      for (const key of resultKeys) {
        expect(engineKeys).toContain(key);
      }
    });

    it('four numerics are numbers in 0-100 and permission_sub_shape within allowed set', () => {
      const answers = makeAnswers();
      const result = buildConstraints(answers);

      expect(typeof result.energy_availability).toBe('number');
      expect(result.energy_availability).toBeGreaterThanOrEqual(0);
      expect(result.energy_availability).toBeLessThanOrEqual(100);

      expect(typeof result.time_availability).toBe('number');
      expect(result.time_availability).toBeGreaterThanOrEqual(0);
      expect(result.time_availability).toBeLessThanOrEqual(100);

      expect(typeof result.body_capacity).toBe('number');
      expect(result.body_capacity).toBeGreaterThanOrEqual(0);
      expect(result.body_capacity).toBeLessThanOrEqual(100);

      expect(typeof result.permission).toBe('number');
      expect(result.permission).toBeGreaterThanOrEqual(0);
      expect(result.permission).toBeLessThanOrEqual(100);

      expect(['present', 'want_block', 'say_block', 'act_block']).toContain(result.permission_sub_shape);
    });
  });
});
