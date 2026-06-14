// input-map assembly — composes the six sub-block builders into the full InputMap
// The real validator runs on this for the first time (World-B check deferred at sub-blocks)

import type { InputMap } from '@/engine/types';
import type { QuestionnaireAnswers } from './answers';
import { buildPerDirections } from './per-direction';
import { buildCrossDirection } from './cross-direction';
import { buildDomains } from './domains';
import { buildConstraints } from './constraints';
import { buildCrossCutting } from './cross-cutting';
import { buildSelfReport } from './self-report';

export function buildInputMap(
  targetUser: string,
  answers: QuestionnaireAnswers
): InputMap {
  return {
    directions: buildPerDirections(targetUser, answers),
    cross_direction: buildCrossDirection(answers),
    domains: buildDomains(answers),
    constraints: buildConstraints(answers),
    cross_cutting: buildCrossCutting(answers),
    self_report: buildSelfReport(answers),
  };
}
