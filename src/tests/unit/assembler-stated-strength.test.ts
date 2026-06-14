import { describe, it, expect } from 'vitest';
import type { PerDirectionInputs } from '@/engine/types';
import { deriveStatedStrength } from '@/assembler/stated-strength';
import {
  STATED_STRENGTH_NONE,
  STATED_STRENGTH_QUICKENING,
  STATED_STRENGTH_MILD_SATURATED,
  STATED_STRENGTH_MILD_LIVE,
  STATED_STRENGTH_SPECIFICITY_BONUS,
  STATED_STRENGTH_MOVEMENT_FLOOR,
} from '@/assembler/params';

function makeDirection(overrides: Partial<PerDirectionInputs>): PerDirectionInputs {
  return {
    stated_strength: 0,
    felt_cost: 0,
    anticipation: 'mild',
    current_movement: 0,
    recent_action: 'none',
    past_presence: 'yes',
    specificity: 'partial',
    would_reach_for: 'no',
    saturation: 'no',
    stopped_expecting: 'no',
    ...overrides,
  };
}

describe('deriveStatedStrength', () => {
  describe('GROUP A — Precedence (the one genuine adjacency)', () => {
    it('A1: anticipation=mild, current_movement=60 -> matches rule 3 (0) and rule 4 (30) -> MUST return 0 (rule 3 before 4)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        current_movement: 60,
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_MILD_SATURATED);
    });
  });

  describe('GROUP B — Single-rule reachability (isolated)', () => {
    it('B1 rule 1: anticipation=none -> 0', () => {
      const direction = makeDirection({
        anticipation: 'none',
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_NONE);
    });

    it('B2 rule 2: anticipation=quickening -> 64', () => {
      const direction = makeDirection({
        anticipation: 'quickening',
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_QUICKENING);
    });

    it('B3 rule 3: anticipation=mild, current_movement=60 -> 0', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        current_movement: 60,
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_MILD_SATURATED);
    });

    it('B4 rule 4: anticipation=mild, current_movement=59, specificity=partial -> 30 (modifier NOT applied: not strong)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        current_movement: 59,
        specificity: 'partial',
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_MILD_LIVE);
    });
  });

  describe('GROUP C — Boundary + modifier scoping (load-bearing)', () => {
    it('C1 movement boundary inclusive: anticipation=mild, current_movement=60 -> 0 (>= floor fires at 60 -> rule 3)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        current_movement: STATED_STRENGTH_MOVEMENT_FLOOR,
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_MILD_SATURATED);
    });

    it('C2 movement just-below: anticipation=mild, current_movement=59, specificity=partial -> 30 (rule 4)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        current_movement: STATED_STRENGTH_MOVEMENT_FLOOR - 1,
        specificity: 'partial',
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_MILD_LIVE);
    });

    it('C3 +6 on rule-4 path: anticipation=mild, current_movement=59, specificity=strong -> 36 (30 + 6)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        current_movement: 59,
        specificity: 'strong',
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_MILD_LIVE + STATED_STRENGTH_SPECIFICITY_BONUS);
    });

    it('C4 modifier does NOT apply to rule 3: anticipation=mild, current_movement=60, specificity=strong -> 0 (bonus rides rule 4 only)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        current_movement: STATED_STRENGTH_MOVEMENT_FLOOR,
        specificity: 'strong',
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_MILD_SATURATED);
    });

    it('C5 modifier does NOT apply to rule 2: anticipation=quickening, specificity=strong -> 64 (not 70)', () => {
      const direction = makeDirection({
        anticipation: 'quickening',
        specificity: 'strong',
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_QUICKENING);
    });

    it('C6 modifier does NOT apply to rule 1: anticipation=none, specificity=strong -> 0', () => {
      const direction = makeDirection({
        anticipation: 'none',
        specificity: 'strong',
      });
      const result = deriveStatedStrength(direction);
      expect(result).toBe(STATED_STRENGTH_NONE);
    });
  });
});
