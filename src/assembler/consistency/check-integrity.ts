// Integrity checks (CHECKS 2, 3, 5) — InputMap-only reads, emit 0-or-1 (or 0-to-6 for per-direction) ConsistencyFlag
// CHECK 2: stopped_expecting requires past_presence
// CHECK 3: high movement implies past_presence (banded threshold: >=60 -> {67,100} fire)
// CHECK 5: Q10 direction vs its Part C card

import type { InputMap } from '@/engine/types';
import type { ConsistencyFlag } from './types';
import type { DirectionKey } from '../answers';

const DIRECTIONS: DirectionKey[] = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
];

export function checkStoppedExpectingWithoutHistory(
  inputMap: Readonly<InputMap>
): ConsistencyFlag[] {
  const flags: ConsistencyFlag[] = [];

  for (const direction of DIRECTIONS) {
    const dir = inputMap.directions[direction];
    if (dir.stopped_expecting === 'yes' && dir.past_presence === 'no') {
      flags.push({
        code: 'stopped_expecting_without_history',
        severity: 'contradiction',
        direction,
      });
    }
  }

  return flags;
}

export function checkActiveButNoHistory(
  inputMap: Readonly<InputMap>
): ConsistencyFlag[] {
  const flags: ConsistencyFlag[] = [];

  for (const direction of DIRECTIONS) {
    const dir = inputMap.directions[direction];
    // >=60 against the banded values {0,33,67,100} -> {67,100} fire
    if (dir.current_movement >= 60 && dir.past_presence === 'no') {
      flags.push({
        code: 'active_but_no_history',
        severity: 'tension',
        direction,
      });
    }
  }

  return flags;
}

export function checkChoseDirectionHeDoesntWant(
  inputMap: Readonly<InputMap>
): ConsistencyFlag[] {
  const flags: ConsistencyFlag[] = [];

  const directionChosen = inputMap.cross_direction.direction_chosen;

  // Guard: only fires when a direction was chosen (not rest/none)
  if (
    directionChosen === 'contributor' ||
    directionChosen === 'experience_seeker' ||
    directionChosen === 'freedom_designer' ||
    directionChosen === 'growth_focused' ||
    directionChosen === 'creator' ||
    directionChosen === 'relationship_rebuilder'
  ) {
    const dir = inputMap.directions[directionChosen];
    if (dir.anticipation === 'none') {
      flags.push({
        code: 'chose_direction_he_doesnt_want',
        severity: 'contradiction',
      });
    }
  }

  return flags;
}
