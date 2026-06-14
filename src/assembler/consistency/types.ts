// Consistency check types — flags-only layer, never mutates InputMap
// All 9 checks emit ConsistencyFlag objects; the code union is closed and typo-proof

import type { DirectionKey } from '../answers';

export type ConsistencyFlagCode =
  | 'tired_or_blocked_pull'
  | 'divergent_reach'
  | 'stopped_expecting_without_history'
  | 'active_but_no_history'
  | 'gave_up_but_still_keenly_wants'
  | 'chose_direction_he_doesnt_want'
  | 'reaching_without_trace'
  | 'hollow_mattering'
  | 'specific_want_never_surfaces';

export type Severity = 'contradiction' | 'tension' | 'low_confidence';
// low_confidence is defined-but-never-emitted — only CHECK 8, which is INERT

export type ConsistencyFlag = {
  code: ConsistencyFlagCode;
  severity: Severity;
  direction?: DirectionKey;
  note?: string;
};
