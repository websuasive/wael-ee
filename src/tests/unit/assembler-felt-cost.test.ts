import { describe, it, expect } from 'vitest';
import type { PerDirectionInputs } from '@/engine/types';
import { deriveFeltCost } from '@/assembler/felt-cost';
import {
  FELT_COST_STRONG_QUICKENING,
  FELT_COST_STRONG,
  FELT_COST_EMERGING_NEVER_HELD,
  FELT_COST_NEVER_HELD_FLOOR,
  FELT_COST_ANTICIPATION_NONE,
  FELT_COST_MILD_STOPPED,
  FELT_COST_MILD_ACTIVE,
  FELT_COST_MILD_VITAL,
  FELT_COST_DEFAULT,
  FELT_COST_VITALITY_FLOOR,
  FELT_COST_MOVEMENT_FLOOR,
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

describe('deriveFeltCost', () => {
  describe('GROUP A — Precedence cases (earlier rule wins)', () => {
    it('A1: past_presence=no, anticipation=mild, stopped_expecting=yes -> matches 4 and 6 -> MUST return 15 (rule 4 before 6)', () => {
      const direction = makeDirection({
        past_presence: 'no',
        anticipation: 'mild',
        stopped_expecting: 'yes',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_NEVER_HELD_FLOOR);
    });

    it('A2: specificity=strong, past_presence=no, anticipation=mild -> matches 2 and 4 -> MUST return 70 (rules 1–2 above never-held floor)', () => {
      const direction = makeDirection({
        specificity: 'strong',
        past_presence: 'no',
        anticipation: 'mild',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_STRONG);
    });

    it('A3: specificity=strong, anticipation=quickening, past_presence=no -> matches 1, 3, 4 -> MUST return 80 (rule 1 above all)', () => {
      const direction = makeDirection({
        specificity: 'strong',
        anticipation: 'quickening',
        past_presence: 'no',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_STRONG_QUICKENING);
    });

    it('A4: past_presence=no, anticipation=quickening, specificity=partial -> matches 3 and 4 -> MUST return 55 (rule 3 before 4)', () => {
      const direction = makeDirection({
        past_presence: 'no',
        anticipation: 'quickening',
        specificity: 'partial',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_EMERGING_NEVER_HELD);
    });

    it('A5: past_presence=no, anticipation=mild, current_movement=60, stopped_expecting=no -> matches 4 and 7 -> MUST return 15 (rule 4 before 7)', () => {
      const direction = makeDirection({
        past_presence: 'no',
        anticipation: 'mild',
        current_movement: 60,
        stopped_expecting: 'no',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_NEVER_HELD_FLOOR);
    });

    it('A6: past_presence=no, anticipation=mild, stopped_expecting=no, current_movement=0, vitality=45 -> matches 4 and 8 -> MUST return 15 (rule 4 before 8)', () => {
      const direction = makeDirection({
        past_presence: 'no',
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: 0,
      });
      const result = deriveFeltCost(direction, FELT_COST_VITALITY_FLOOR);
      expect(result).toBe(FELT_COST_NEVER_HELD_FLOOR);
    });

    it('A7: anticipation=mild, stopped_expecting=yes, current_movement=60, past_presence=yes -> matches 6 and 7 -> MUST return 50 (rule 6 before 7)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'yes',
        current_movement: 60,
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_MILD_STOPPED);
    });

    it('A8: anticipation=mild, stopped_expecting=yes, past_presence=yes, current_movement=0, vitality=45 -> matches 6 and 8 -> MUST return 50 (rule 6 before 8)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'yes',
        past_presence: 'yes',
        current_movement: 0,
      });
      const result = deriveFeltCost(direction, FELT_COST_VITALITY_FLOOR);
      expect(result).toBe(FELT_COST_MILD_STOPPED);
    });

    it('A9: anticipation=mild, stopped_expecting=no, current_movement=60, past_presence=yes, vitality=45 -> matches 7 and 8 -> MUST return 35 (rule 7 before 8)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: 60,
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, FELT_COST_VITALITY_FLOOR);
      expect(result).toBe(FELT_COST_MILD_ACTIVE);
    });

    it('A10: past_presence=no, anticipation=none -> matches 4 and 5 -> MUST return 15 (rule 4 before 5)', () => {
      const direction = makeDirection({
        past_presence: 'no',
        anticipation: 'none',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_NEVER_HELD_FLOOR);
    });
  });

  describe('GROUP B — Single-rule reachability', () => {
    it('B1 rule 1: specificity=strong, anticipation=quickening, past_presence=yes -> 80', () => {
      const direction = makeDirection({
        specificity: 'strong',
        anticipation: 'quickening',
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_STRONG_QUICKENING);
    });

    it('B2 rule 2: specificity=strong, anticipation=mild, past_presence=yes -> 70', () => {
      const direction = makeDirection({
        specificity: 'strong',
        anticipation: 'mild',
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_STRONG);
    });

    it('B3 rule 3: past_presence=no, anticipation=quickening, specificity=partial -> 55', () => {
      const direction = makeDirection({
        past_presence: 'no',
        anticipation: 'quickening',
        specificity: 'partial',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_EMERGING_NEVER_HELD);
    });

    it('B4 rule 4: past_presence=no, anticipation=mild, stopped_expecting=no, current_movement=0, vitality=0, specificity=partial -> 15', () => {
      const direction = makeDirection({
        past_presence: 'no',
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: 0,
        specificity: 'partial',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_NEVER_HELD_FLOOR);
    });

    it('B5 rule 5: anticipation=none, past_presence=yes, specificity=partial -> 25', () => {
      const direction = makeDirection({
        anticipation: 'none',
        past_presence: 'yes',
        specificity: 'partial',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_ANTICIPATION_NONE);
    });

    it('B6 rule 6: anticipation=mild, stopped_expecting=yes, past_presence=yes, current_movement=0, vitality=0 -> 50', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'yes',
        past_presence: 'yes',
        current_movement: 0,
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_MILD_STOPPED);
    });

    it('B7 rule 7: anticipation=mild, stopped_expecting=no, current_movement=60, past_presence=yes, vitality=0 -> 35', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: 60,
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_MILD_ACTIVE);
    });

    it('B8 rule 8: anticipation=mild, stopped_expecting=no, current_movement=0, vitality=45, past_presence=yes -> 55', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: 0,
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, FELT_COST_VITALITY_FLOOR);
      expect(result).toBe(FELT_COST_MILD_VITAL);
    });

    it('B9 rule 9: anticipation=mild, stopped_expecting=no, current_movement=0, vitality=0, past_presence=yes, specificity=partial -> 40', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: 0,
        past_presence: 'yes',
        specificity: 'partial',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_DEFAULT);
    });
  });

  describe('GROUP C — Boundary pins (strict/inclusive edges)', () => {
    it('C1 rule 7 inclusive: current_movement=60 (mild, stopped_expecting=no, past_presence=yes, vitality=0) -> 35', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: FELT_COST_MOVEMENT_FLOOR,
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_MILD_ACTIVE);
    });

    it('C2 rule 7 just-below: current_movement=59 (same else) -> 40 (falls to rule 9)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: FELT_COST_MOVEMENT_FLOOR - 1,
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, 0);
      expect(result).toBe(FELT_COST_DEFAULT);
    });

    it('C3 rule 8 inclusive: vitality=45 (mild, stopped_expecting=no, current_movement=0, past_presence=yes) -> 55', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: 0,
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, FELT_COST_VITALITY_FLOOR);
      expect(result).toBe(FELT_COST_MILD_VITAL);
    });

    it('C4 rule 8 just-below: vitality=44 (same else) -> 40 (falls to rule 9)', () => {
      const direction = makeDirection({
        anticipation: 'mild',
        stopped_expecting: 'no',
        current_movement: 0,
        past_presence: 'yes',
      });
      const result = deriveFeltCost(direction, FELT_COST_VITALITY_FLOOR - 1);
      expect(result).toBe(FELT_COST_DEFAULT);
    });
  });
});
