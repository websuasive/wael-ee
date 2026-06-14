import { describe, it, expect } from 'vitest';
import { listAvailableAnswers, loadAnswersInput } from '@/ui/render/answers_loader';
import { validateQuestionnaireAnswers } from '@/assembler/validate-answers';
import { assembleFor } from '@/assembler';
import { validateInputMap } from '@/engine';

describe('answers_loader', () => {
  describe('LOADER — mirroring fixture_loader', () => {
    it('listAvailableAnswers() includes the new fixture id (alan)', () => {
      const available = listAvailableAnswers();
      expect(available).toContain('alan');
    });

    it('loadAnswersInput("alan") -> { ok:true, fixtureId:"alan", answers: <parsed> }', () => {
      const result = loadAnswersInput('alan');

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fixtureId).toBe('alan');
      expect(result.answers).toBeDefined();
    });

    it('loadAnswersInput("does_not_exist") -> { ok:false, reason: ... }', () => {
      const result = loadAnswersInput('does_not_exist');

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.fixtureId).toBe('does_not_exist');
      expect(result.reason).toContain('not found');
    });
  });

  describe('END-TO-END PIN — production-shaped chain, headless', () => {
    it('load the fixture answers -> validateQuestionnaireAnswers is ok:true', () => {
      const loaded = loadAnswersInput('alan');
      expect(loaded.ok).toBe(true);
      if (!loaded.ok) return;

      const validated = validateQuestionnaireAnswers(loaded.answers);
      expect(validated.ok).toBe(true);
      if (!validated.ok) return;

      // The on-disk answers.json is well-formed
      expect(validated.value).toBeDefined();
    });

    it('assembleFor(targetUser, validated answers).input_map -> validateInputMap is ok:true', () => {
      const loaded = loadAnswersInput('alan');
      expect(loaded.ok).toBe(true);
      if (!loaded.ok) return;

      const validated = validateQuestionnaireAnswers(loaded.answers);
      expect(validated.ok).toBe(true);
      if (!validated.ok) return;

      const targetUser = 'test-user';
      const assembled = assembleFor(targetUser, validated.value);

      const engineValid = validateInputMap(assembled.input_map);
      expect(engineValid.ok).toBe(true);
      if (!engineValid.ok) return;

      // The file → in-memory InputMap is engine-valid
      expect(engineValid.value).toBeDefined();
    });

    it('reach_confidence and consistency_flags are present on the emit', () => {
      const loaded = loadAnswersInput('alan');
      expect(loaded.ok).toBe(true);
      if (!loaded.ok) return;

      const validated = validateQuestionnaireAnswers(loaded.answers);
      expect(validated.ok).toBe(true);
      if (!validated.ok) return;

      const targetUser = 'test-user';
      const assembled = assembleFor(targetUser, validated.value);

      expect(assembled.reach_confidence).toBeDefined();
      expect(assembled.reach_confidence).toMatch(/^(high|low)$/);
      expect(assembled.consistency_flags).toBeDefined();
      expect(Array.isArray(assembled.consistency_flags)).toBe(true);
    });

    it('IN-MEMORY confirmation: the chain produces an InputMap object in memory (no file written)', () => {
      const loaded = loadAnswersInput('alan');
      expect(loaded.ok).toBe(true);
      if (!loaded.ok) return;

      const validated = validateQuestionnaireAnswers(loaded.answers);
      expect(validated.ok).toBe(true);
      if (!validated.ok) return;

      const targetUser = 'test-user';
      const assembled = assembleFor(targetUser, validated.value);

      // The InputMap is in memory - no fs write, no input.json generated
      expect(assembled.input_map).toBeDefined();
      expect(typeof assembled.input_map).toBe('object');
      expect(assembled.input_map).not.toBeNull();

      // Verify it has the expected top-level structure
      expect(assembled.input_map).toHaveProperty('directions');
      expect(assembled.input_map).toHaveProperty('domains');
      expect(assembled.input_map).toHaveProperty('cross_direction');
      expect(assembled.input_map).toHaveProperty('constraints');
      expect(assembled.input_map).toHaveProperty('cross_cutting');
      expect(assembled.input_map).toHaveProperty('self_report');
    });
  });
});
