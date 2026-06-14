// runChecks — aggregates all nine consistency checks into reach_confidence and flags
// Calls checkTriad once (produces reach_confidence + flags), calls the other eight, concatenates all flags

import type { InputMap } from '@/engine/types';
import type { QuestionnaireAnswers } from '../answers';
import type { ConsistencyFlag } from './types';
import { checkTriad } from './check-triad';
import { checkStoppedExpectingWithoutHistory } from './check-integrity';
import { checkActiveButNoHistory } from './check-integrity';
import { checkChoseDirectionHeDoesntWant } from './check-integrity';
import { checkGaveUpButStillWants } from './check-tensions';
import { checkReachingWithoutTrace } from './check-tensions';
import { checkHollowMattering } from './check-hollow-mattering';
import { checkSocialityConfidence } from './check-sociality-confidence';
import { checkSpecificWantNeverSurfaces } from './check-triad-surface';

export function runChecks(
  inputMap: Readonly<InputMap>,
  answers: QuestionnaireAnswers
): { reach_confidence: 'high' | 'low'; flags: ConsistencyFlag[] } {
  // Call checkTriad once -> reach_confidence + its flags
  const { reach_confidence, flags: triadFlags } = checkTriad(inputMap, answers);

  // Call the other eight, concatenate all flags
  const integrityFlags = checkStoppedExpectingWithoutHistory(inputMap);
  const activeButNoHistoryFlags = checkActiveButNoHistory(inputMap);
  const choseDirectionHeDoesntWantFlags = checkChoseDirectionHeDoesntWant(inputMap);
  const gaveUpButStillWantsFlags = checkGaveUpButStillWants(inputMap);
  const reachingWithoutTraceFlags = checkReachingWithoutTrace(inputMap);
  const hollowMatteringFlags = checkHollowMattering(inputMap);
  const socialityConfidenceFlags = checkSocialityConfidence(inputMap);
  const specificWantNeverSurfacesFlags = checkSpecificWantNeverSurfaces(inputMap, answers);

  const allFlags = [
    ...triadFlags,
    ...integrityFlags,
    ...activeButNoHistoryFlags,
    ...choseDirectionHeDoesntWantFlags,
    ...gaveUpButStillWantsFlags,
    ...reachingWithoutTraceFlags,
    ...hollowMatteringFlags,
    ...socialityConfidenceFlags,
    ...specificWantNeverSurfacesFlags,
  ];

  return { reach_confidence, flags: allFlags };
}
