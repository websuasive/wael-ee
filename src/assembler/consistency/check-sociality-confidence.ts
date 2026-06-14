// CHECK 8 — Q7 sociality low-confidence marker
// INERT as written: no "inferred/low-evidence" signal exists in real questionnaire input
// (this trigger came from synthetic-avatar tooling). The assembler receives only Q7's a/b/c answer,
// with no inferred/low-evidence affordance, so this check cannot fire unless Q7 gains an explicit
// low-confidence affordance. Implement as a documented no-op until/unless that affordance exists.
//
// From ASSEMBLER.md lines 530-533:
// "no 'inferred/low-evidence' signal exists in real questionnaire input (this trigger came from
// synthetic-avatar tooling). The assembler receives only Q7's a/b/c answer, with no
// inferred/low-evidence affordance, so this check cannot fire unless Q7 gains an explicit
// low-confidence affordance."

import type { InputMap } from '@/engine/types';
import type { ConsistencyFlag } from './types';

export function checkSocialityConfidence(
  _inputMap: Readonly<InputMap>
): ConsistencyFlag[] {
  // INERT: no-op — documented no-op until/unless Q7 gains a low-confidence affordance
  return [];
}
