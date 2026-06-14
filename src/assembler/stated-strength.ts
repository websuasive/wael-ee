import type { ObservableFields } from './per-direction-observable';
import {
  STATED_STRENGTH_NONE,
  STATED_STRENGTH_QUICKENING,
  STATED_STRENGTH_MILD_SATURATED,
  STATED_STRENGTH_MILD_LIVE,
  STATED_STRENGTH_SPECIFICITY_BONUS,
  STATED_STRENGTH_MOVEMENT_FLOOR,
} from './params';

export function deriveStatedStrength(direction: ObservableFields): number {
  // Rule 1: anticipation == none -> 0
  if (direction.anticipation === 'none') {
    return STATED_STRENGTH_NONE;
  }

  // Rule 2: anticipation == quickening -> 64
  if (direction.anticipation === 'quickening') {
    return STATED_STRENGTH_QUICKENING;
  }

  // Rule 3: anticipation == mild AND current_movement >= 60 -> 0
  if (direction.anticipation === 'mild' && direction.current_movement >= STATED_STRENGTH_MOVEMENT_FLOOR) {
    return STATED_STRENGTH_MILD_SATURATED;
  }

  // Rule 4: anticipation == mild AND current_movement < 60 -> 30 (add 6 if specificity == strong)
  if (direction.anticipation === 'mild' && direction.current_movement < STATED_STRENGTH_MOVEMENT_FLOOR) {
    const base = STATED_STRENGTH_MILD_LIVE;
    if (direction.specificity === 'strong') {
      return base + STATED_STRENGTH_SPECIFICITY_BONUS;
    }
    return base;
  }

  // Fallback (should not reach here given the enum coverage)
  return STATED_STRENGTH_NONE;
}
