// Placeholder for real user identity type
export type UserId = string;

import type { QuestionnaireAnswers } from './answers';
import type { InputMap } from '@/engine/types';
import type { ConsistencyFlag } from './consistency/types';
import { buildInputMap } from './input-map';
import { runChecks } from './consistency/run-checks';

export type { QuestionnaireAnswers } from './answers';

// Assembler entry point — takes target user as explicit parameter
// Composes the six sub-block builders into the full InputMap, runs all nine consistency checks,
// and emits { input_map, reach_confidence, consistency_flags }
export function assembleFor(
  targetUser: UserId,
  answers: QuestionnaireAnswers,
): { input_map: InputMap; reach_confidence: 'high' | 'low'; consistency_flags: ConsistencyFlag[] } {
  const inputMap = buildInputMap(targetUser, answers);
  const { reach_confidence, flags } = runChecks(inputMap, answers);
  return {
    input_map: inputMap,
    reach_confidence,
    consistency_flags: flags,
  };
}
