// CHECK 9 — a strong specific want that never surfaces in the triad (per direction)
// Reads InputMap + answers (Q10b/Q10c), reuses interpretQ10 for all three triad values

import type { InputMap } from '@/engine/types';
import type { ConsistencyFlag } from './types';
import type { DirectionKey } from '../answers';
import type { QuestionnaireAnswers } from '../answers';
import { interpretQ10 } from '../q10-interpretation';

const DIRECTIONS: DirectionKey[] = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
];

export function checkSpecificWantNeverSurfaces(
  inputMap: Readonly<InputMap>,
  answers: QuestionnaireAnswers
): ConsistencyFlag[] {
  const flags: ConsistencyFlag[] = [];

  // Build the triad-set: interpret Q10, Q10b, Q10c via interpretQ10
  // Collect the direction keys among the three interpretations (rest/none contribute none)
  const triadSet = new Set<DirectionKey>();

  const q10Interpretation = interpretQ10(inputMap.cross_direction.direction_chosen);
  if (q10Interpretation.kind === 'direction') {
    triadSet.add(q10Interpretation.direction);
  }

  const q10bInterpretation = interpretQ10(answers.q10b_retrospective);
  if (q10bInterpretation.kind === 'direction') {
    triadSet.add(q10bInterpretation.direction);
  }

  const q10cInterpretation = interpretQ10(answers.q10c_counterfactual);
  if (q10cInterpretation.kind === 'direction') {
    triadSet.add(q10cInterpretation.direction);
  }

  // For each direction: if quickening+strong AND not in triad-set -> flag
  for (const direction of DIRECTIONS) {
    const dir = inputMap.directions[direction];
    if (
      dir.anticipation === 'quickening' &&
      dir.specificity === 'strong' &&
      !triadSet.has(direction)
    ) {
      flags.push({
        code: 'specific_want_never_surfaces',
        severity: 'tension',
        direction,
      });
    }
  }

  return flags;
}
