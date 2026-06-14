// self_report assembly — one field, named_absences (array)
// Two engine-enforced rules: nothing_really mutual-exclusion and cap-of-3
// The answer representation is a TAGGED UNION that makes the exclusivity violation UNCOMPILABLE
// The cap can't be cleanly typed, so the assembler ASSERTS-at-boundary (throws loudly if >3)
// The engine backstops both

import type { InputMap } from '@/engine/types';
import type { QuestionnaireAnswers } from './answers';

export function buildSelfReport(
  answers: QuestionnaireAnswers
): InputMap['self_report'] {
  const q34 = answers.q34_self_report;

  if (q34.kind === 'nothing_really') {
    return { named_absences: ['nothing_really'] };
  }

  // q34.kind === 'named'
  const items = q34.items;
  // Cap boundary assertion: fail loud at the detectable point, not silent-clamp/delocalized
  if (items.length > 3) {
    throw new Error(
      `self_report cap exceeded: expected at most 3 named_absences entries, got ${items.length}`
    );
  }

  return { named_absences: [...items] };
}
