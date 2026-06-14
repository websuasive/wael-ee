import type { ObservableFields } from './per-direction-observable';
import { SATURATION_MOVEMENT_FLOOR } from './params';

export function deriveSaturation(direction: ObservableFields): 'yes' | 'no' {
  if (direction.current_movement >= SATURATION_MOVEMENT_FLOOR && direction.anticipation === 'none') {
    return 'yes';
  }
  return 'no';
}
