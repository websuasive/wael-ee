// Headline computation. Implements SYNTHESIS.md section 4 and 4.1. The computeFiringSet helper is also consumed by cards.ts, chart_data.ts, experience_candidates.ts, and the pattern_paragraph token interpolation.

import type {
  EngineOutput,
  InputMap,
  DirectionOutput,
  DirectionName,
} from '../engine';
import type { HeadlineOutput } from './types';
import { DIRECTION_DISPLAY_NAMES } from './data/tokens';

export type FiringSetEntry = {
  direction: DirectionName;
  pull: number;
  source: DirectionOutput;
};

/**
 * §4 step 1 firing-set membership predicate. A direction is in the firing
 * set iff its pull_quality is non-empty (real, suppressed, saturated,
 * behaviourally_divergent, phantom, phantom_partial) OR pull >= 50. This
 * deliberately differs from engine §5.1 `surfaced` (pull >= 50 OR
 * movement >= 50): the firing set excludes empty habits and includes
 * quiet pull-quality directions below pull 50.
 */
export function isInFiringSet(d: DirectionOutput): boolean {
  return d.pull_quality.length > 0 || d.pull >= 50;
}

export function computeFiringSet(output: EngineOutput): FiringSetEntry[] {
  const entries: FiringSetEntry[] = [];
  for (const d of output.directions) {
    if (isInFiringSet(d)) {
      entries.push({ direction: d.direction, pull: d.pull, source: d });
    }
  }
  entries.sort(
    (a, b) => b.pull - a.pull || a.direction.localeCompare(b.direction),
  );
  return entries;
}

export function computeHeadline(
  output: EngineOutput,
  input: InputMap,
): HeadlineOutput {
  const firing = computeFiringSet(output);
  if (firing.length > 0) {
    const topThree = firing.slice(0, 3);
    const direction_names = topThree.map(
      (e) => DIRECTION_DISPLAY_NAMES[e.direction],
    );
    const direction_engine_names = topThree.map((e) => e.direction);
    return { direction_names, direction_engine_names, situation_text: null };
  }

  const pastPresenceCount = (
    Object.keys(input.directions) as DirectionName[]
  ).filter((name) => input.directions[name].past_presence === 'yes').length;

  const situation_text =
    pastPresenceCount >= 3
      ? 'Nothing reading as a pull right now.'
      : 'Directions all reading low.';
  return { direction_names: [], direction_engine_names: [], situation_text };
}
