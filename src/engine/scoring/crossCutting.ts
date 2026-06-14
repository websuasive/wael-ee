// Cross-cutting outputs scoring. Implements spec section 5.4.

import type {
  InputMap,
  CrossCuttingOutput,
  DirectionOutput,
} from '../types';

export function computeCrossCuttingOutputs(
  input: InputMap,
  directionOutputs: DirectionOutput[],
): CrossCuttingOutput[] {
  const cc = input.cross_cutting;

  const betweenShapes =
    cc.recent_life_shape_change === 'yes' &&
    cc.replacement_structure_exists === 'no';

  const anyActive = directionOutputs.some((d) => d.quadrant === 'active');
  const midProcess = anyActive && cc.recent_reaching === 'recent_and_awkward';

  return [
    { output: 'between_shapes', fires: betweenShapes },
    { output: 'mid_process', fires: midProcess },
  ];
}
