// Experience candidate directions. Implements SYNTHESIS.md section 5.9. Output consumed by the downstream experience-suggestion layer; no consumer within synthesis itself.

import type {
  EngineOutput,
  InputMap,
  DirectionName,
} from '../engine';
import type { ExperienceCandidate } from './types';
import type { FiringSetEntry } from './headline';
import { DIRECTION_DISPLAY_NAMES } from './data/tokens';

export function computeExperienceCandidates(
  output: EngineOutput,
  input: InputMap,
  firingSet: FiringSetEntry[],
): ExperienceCandidate[] {
  const result: ExperienceCandidate[] = [];

  // 1. Firing-set entries (preserve firingSet's order — already pull-desc + alphabetical tiebreak).
  for (const entry of firingSet) {
    result.push({
      direction_name: DIRECTION_DISPLAY_NAMES[entry.direction],
      direction_engine_name: entry.direction,
      priority: 'firing',
      pull: entry.pull,
    });
  }

  // 2. Past-presence entries — defensively pull-desc sorted with alphabetical tiebreak,
  //    skipping any direction already represented in the firing set.
  const firingNames = new Set<DirectionName>(firingSet.map((e) => e.direction));
  const sorted = [...output.directions].sort(
    (a, b) => b.pull - a.pull || a.direction.localeCompare(b.direction),
  );
  for (const d of sorted) {
    if (firingNames.has(d.direction)) continue;
    if (input.directions[d.direction].past_presence !== 'yes') continue;
    result.push({
      direction_name: DIRECTION_DISPLAY_NAMES[d.direction],
      direction_engine_name: d.direction,
      priority: 'past_presence_only',
      pull: d.pull,
    });
  }

  return result;
}
