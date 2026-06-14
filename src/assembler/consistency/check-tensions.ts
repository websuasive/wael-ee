// Tension checks (CHECKS 4, 6) — InputMap-only reads, emit 0-or-1 (or 0-to-6 for per-direction) ConsistencyFlag
// CHECK 4: stopped_expecting vs a live want (per direction)
// CHECK 6: recent_reaching vs behavioural trace (cross-direction aggregate, banded range)

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

export function checkGaveUpButStillWants(
  inputMap: Readonly<InputMap>
): ConsistencyFlag[] {
  const flags: ConsistencyFlag[] = [];

  for (const direction of DIRECTIONS) {
    const dir = inputMap.directions[direction];
    if (dir.stopped_expecting === 'yes' && dir.anticipation === 'quickening') {
      flags.push({
        code: 'gave_up_but_still_keenly_wants',
        severity: 'tension',
        direction,
      });
    }
  }

  return flags;
}

export function checkReachingWithoutTrace(
  inputMap: Readonly<InputMap>
): ConsistencyFlag[] {
  // Guard: only fires when recent_reaching is recent_and_awkward
  if (inputMap.cross_cutting.recent_reaching !== 'recent_and_awkward') {
    return [];
  }

  // Compute reaching_trace: EXISTS a direction with anticipation in {mild, quickening}
  // AND current_movement in the banded range 34..67 (collapses to exactly {67} against reachable bands)
  const reaching_trace = DIRECTIONS.some((direction) => {
    const dir = inputMap.directions[direction];
    return (
      (dir.anticipation === 'mild' || dir.anticipation === 'quickening') &&
      dir.current_movement >= 34 &&
      dir.current_movement <= 67
    );
  });

  // If no trace exists, flag once
  if (!reaching_trace) {
    return [
      {
        code: 'reaching_without_trace',
        severity: 'tension',
      },
    ];
  }

  return [];
}
