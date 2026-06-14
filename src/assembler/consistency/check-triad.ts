// CHECK 1 — Q10 triangulation (highest value; uses Q10, Q10b, Q10c)
// Triangulates the three Q10 variants into reach_confidence and an optional flag
// Q10 is read from InputMap.cross_direction.direction_chosen (interpreted value)
// Q10b/Q10c are read from answers.q10b_retrospective/q10c_counterfactual

import type { InputMap } from '@/engine/types';
import type { QuestionnaireAnswers } from '../answers';
import type { ConsistencyFlag } from './types';
import { interpretQ10 } from '../q10-interpretation';

export function checkTriad(
  inputMap: Readonly<InputMap>,
  answers: QuestionnaireAnswers
): { reach_confidence: 'high' | 'low'; flags: ConsistencyFlag[] } {
  const q10Interpretation = interpretQ10(inputMap.cross_direction.direction_chosen);
  const q10bInterpretation = interpretQ10(answers.q10b_retrospective);
  const q10cInterpretation = interpretQ10(answers.q10c_counterfactual);

  const flags: ConsistencyFlag[] = [];

  // Branch 1: all three are the same direction
  if (
    q10Interpretation.kind === 'direction' &&
    q10bInterpretation.kind === 'direction' &&
    q10cInterpretation.kind === 'direction' &&
    q10Interpretation.direction === q10bInterpretation.direction &&
    q10Interpretation.direction === q10cInterpretation.direction
  ) {
    return { reach_confidence: 'high', flags };
  }

  // Branch 2: all three in {rest, none}
  if (
    q10Interpretation.kind !== 'direction' &&
    q10bInterpretation.kind !== 'direction' &&
    q10cInterpretation.kind !== 'direction'
  ) {
    return { reach_confidence: 'high', flags };
  }

  // Branch 3: Q10 in {rest,none} AND (Q10b is a direction OR Q10c is a direction)
  if (
    q10Interpretation.kind !== 'direction' &&
    (q10bInterpretation.kind === 'direction' || q10cInterpretation.kind === 'direction')
  ) {
    // Note variant: filtered (Q10c is direction, Q10b in rest/none)
    if (
      q10cInterpretation.kind === 'direction' &&
      q10bInterpretation.kind !== 'direction'
    ) {
      flags.push({
        code: 'tired_or_blocked_pull',
        severity: 'tension',
        note: 'filtered: pull only surfaces when consequences removed',
      });
    }
    // Note variant: tired-but-not-empty (Q10b is direction)
    else if (q10bInterpretation.kind === 'direction') {
      flags.push({
        code: 'tired_or_blocked_pull',
        severity: 'tension',
        note: 'tired-but-not-empty: pull was live on the last good day',
      });
    }
    // No note for other cases
    else {
      flags.push({
        code: 'tired_or_blocked_pull',
        severity: 'tension',
      });
    }

    return { reach_confidence: 'low', flags };
  }

  // Branch 4: three different directions
  if (
    q10Interpretation.kind === 'direction' &&
    q10bInterpretation.kind === 'direction' &&
    q10cInterpretation.kind === 'direction' &&
    q10Interpretation.direction !== q10bInterpretation.direction &&
    q10Interpretation.direction !== q10cInterpretation.direction &&
    q10bInterpretation.direction !== q10cInterpretation.direction
  ) {
    flags.push({
      code: 'divergent_reach',
      severity: 'tension',
    });

    return { reach_confidence: 'low', flags };
  }

  // OTHERWISE: Q10 names a direction with partial (non-unanimous) corroboration
  // high is reserved for unanimity (branch 1) or confirmed-numbness (branch 2);
  // partial corroboration is ordinary under-determination — low, but not a tension/
  // contradiction, so no flag (flagging it would dilute the flags' signal).
  return { reach_confidence: 'low', flags };
}
