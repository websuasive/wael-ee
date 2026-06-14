// Q10 interpretation — interprets q10_direction_chosen into a tagged union
// This is the single interpretation that both would_reach_for and direction_chosen project from
// The union forces exhaustive direction-vs-rest/none handling at the type level

import type { DirectionKey } from './answers';

export type Q10Interpretation =
  | { kind: 'direction'; direction: DirectionKey }
  | { kind: 'rest' }
  | { kind: 'none' };

export function interpretQ10(
  q10: DirectionKey | 'rest' | 'none'
): Q10Interpretation {
  if (q10 === 'rest') {
    return { kind: 'rest' };
  }
  if (q10 === 'none') {
    return { kind: 'none' };
  }
  return { kind: 'direction', direction: q10 };
}
