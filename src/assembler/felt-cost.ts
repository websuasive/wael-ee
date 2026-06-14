import type { ObservableFields } from './per-direction-observable';
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
} from './params';

export function deriveFeltCost(
  direction: ObservableFields,
  vitality: number,
): number {
  // Rule 1: specificity == strong AND anticipation == quickening -> 80
  if (direction.specificity === 'strong' && direction.anticipation === 'quickening') {
    return FELT_COST_STRONG_QUICKENING;
  }

  // Rule 2: specificity == strong (and not quickening) -> 70
  if (direction.specificity === 'strong') {
    return FELT_COST_STRONG;
  }

  // Rule 3: past_presence == no AND anticipation == quickening -> 55
  if (direction.past_presence === 'no' && direction.anticipation === 'quickening') {
    return FELT_COST_EMERGING_NEVER_HELD;
  }

  // Rule 4: past_presence == no -> 15
  if (direction.past_presence === 'no') {
    return FELT_COST_NEVER_HELD_FLOOR;
  }

  // Rule 5: anticipation == none -> 25
  if (direction.anticipation === 'none') {
    return FELT_COST_ANTICIPATION_NONE;
  }

  // Rule 6: anticipation == mild AND stopped_expecting == yes -> 50
  if (direction.anticipation === 'mild' && direction.stopped_expecting === 'yes') {
    return FELT_COST_MILD_STOPPED;
  }

  // Rule 7: anticipation == mild AND current_movement >= 60 -> 35
  if (direction.anticipation === 'mild' && direction.current_movement >= FELT_COST_MOVEMENT_FLOOR) {
    return FELT_COST_MILD_ACTIVE;
  }

  // Rule 8: anticipation == mild AND vitality >= 45 -> 55
  if (direction.anticipation === 'mild' && vitality >= FELT_COST_VITALITY_FLOOR) {
    return FELT_COST_MILD_VITAL;
  }

  // Rule 9: otherwise -> 40
  return FELT_COST_DEFAULT;
}
