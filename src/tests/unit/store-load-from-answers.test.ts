import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useActiveReadingStore } from '@/ui/stores/activeReading';
import { validateInputMap } from '@/engine';

describe('useActiveReadingStore.loadFromAnswers', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Mock localStorage to avoid side effects
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    global.localStorage = localStorageMock as unknown as Storage;
  });

  describe('WIRING PARITY — same shape as loadFixture', () => {
    it('after loadFromAnswers("alan"), the store has inputMap, engineOutput, renderingInstructions populated', async () => {
      const store = useActiveReadingStore();

      await store.loadFromAnswers('alan');

      expect(store.inputMap).not.toBeNull();
      expect(store.engineOutput).not.toBeNull();
      expect(store.renderingInstructions).not.toBeNull();
      expect(store.source).toBe('answers');
      expect(store.sourceId).toBe('alan');
    });
  });

  describe('THE INPUTMAP IS ENGINE-VALID', () => {
    it('the stored inputMap passes validateInputMap', async () => {
      const store = useActiveReadingStore();

      await store.loadFromAnswers('alan');

      const check = validateInputMap(store.inputMap);
      expect(check.ok).toBe(true);
      if (!check.ok) return;
      expect(check.value).toBeDefined();
    });
  });

  describe('FLAGS PARKED — present in store, separate from inputMap', () => {
    it('the store has reach_confidence and consistency_flags populated from assembler emit', async () => {
      const store = useActiveReadingStore();

      await store.loadFromAnswers('alan');

      expect(store.reach_confidence).toBeDefined();
      expect(store.reach_confidence).toMatch(/^(high|low)$/);
      expect(store.consistency_flags).toBeDefined();
      expect(Array.isArray(store.consistency_flags)).toBe(true);
    });
  });

  describe('FLAGS NOT IN INPUTMAP — the fence: engine stays pure', () => {
    it('the stored inputMap has exactly the 6 InputMap top-level keys', async () => {
      const store = useActiveReadingStore();

      await store.loadFromAnswers('alan');

      const inputMap = store.inputMap;
      expect(inputMap).not.toBeNull();

      const keys = Object.keys(inputMap!);
      expect(keys).toHaveLength(6);
      expect(keys).toContain('directions');
      expect(keys).toContain('cross_direction');
      expect(keys).toContain('domains');
      expect(keys).toContain('constraints');
      expect(keys).toContain('cross_cutting');
      expect(keys).toContain('self_report');

      // Flags are NOT keys on the InputMap
      expect(keys).not.toContain('reach_confidence');
      expect(keys).not.toContain('consistency_flags');
    });
  });

  describe('VALIDATION FAIL-LOUD — throws before pipeline', () => {
    it('loadFromAnswers with invalid answers sets error and does NOT populate state', async () => {
      const store = useActiveReadingStore();

      // The action sets error when the loader returns !ok (doesn't throw, stores error in state)
      await store.loadFromAnswers('nonexistent');
      
      // State should not be populated with a half-result
      expect(store.inputMap).toBeNull();
      expect(store.engineOutput).toBeNull();
      expect(store.renderingInstructions).toBeNull();
      expect(store.error).not.toBeNull();
      expect(store.error?.message).toContain('not found');
    });
  });

  describe('PERSISTENCE MODE — distinguishes answers from input', () => {
    it('after loadFromAnswers, the store source is set to "answers"', async () => {
      const store = useActiveReadingStore();

      await store.loadFromAnswers('alan');

      // The store source distinguishes the mode
      expect(store.source).toBe('answers');
      expect(store.sourceId).toBe('alan');
    });
  });
});
