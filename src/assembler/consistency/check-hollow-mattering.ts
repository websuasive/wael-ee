// CHECK 7 — hollow mattering
// Single check (not per-direction): mattering.current_state >= 70 AND felt_aliveness.current_state <= 35

import type { InputMap } from '@/engine/types';
import type { ConsistencyFlag } from './types';

export function checkHollowMattering(
  inputMap: Readonly<InputMap>
): ConsistencyFlag[] {
  if (
    inputMap.domains.mattering.current_state >= 70 &&
    inputMap.domains.felt_aliveness.current_state <= 35
  ) {
    return [
      {
        code: 'hollow_mattering',
        severity: 'tension',
      },
    ];
  }

  return [];
}
