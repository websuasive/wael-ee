// Direction evidence chart data. Implements SYNTHESIS.md section 5.4.

import type {
  EngineOutput,
  InputMap,
  DirectionOutput,
  SpecificityValue,
} from '../engine';
import type { ChartData, ChartBubble } from './types';
import type { FiringSetEntry } from './headline';
import { DIRECTION_DISPLAY_NAMES } from './data/tokens';
import { findFirstMatchingSentence } from './predicates';
import { interpolate } from './interpolation';

const SPECIFICITY_SIZE: Record<SpecificityValue, number> = {
  none: 0.3,
  partial: 0.6,
  strong: 1.0,
};

function buildBubble(
  d: DirectionOutput,
  namedInHeadline: Set<DirectionOutput['direction']>,
): ChartBubble {
  return {
    direction_name: DIRECTION_DISPLAY_NAMES[d.direction],
    direction_engine_name: d.direction,
    pull: d.pull,
    movement: d.movement,
    specificity_size: SPECIFICITY_SIZE[d.specificity],
    surfaced: d.surfaced,
    pull_quality_state: d.pull_quality[0] ?? 'empty',
    is_desired_direction:
      d.pull_quality.includes('phantom') ||
      d.pull_quality.includes('phantom_partial'),
    is_named_in_headline: namedInHeadline.has(d.direction),
  };
}

export function computeChartData(
  output: EngineOutput,
  input: InputMap,
  firingSet: FiringSetEntry[],
): ChartData {
  // Headline names the top-3 of the firing set (alphabetical tiebreak applied
  // by computeFiringSet). The chart marks those same three with the accent
  // treatment so visual emphasis matches editorial emphasis.
  const namedInHeadline = new Set(
    firingSet.slice(0, 3).map((e) => e.direction),
  );
  const sorted = [...output.directions].sort(
    (a, b) => b.pull - a.pull || a.direction.localeCompare(b.direction),
  );
  const bubbles = sorted.map((d) => buildBubble(d, namedInHeadline));

  const context = { n: firingSet.length };
  const tokenTemplate =
    '{n} directions reading materially. Movement varies.';
  const token_text = interpolate(tokenTemplate, context);

  const match = findFirstMatchingSentence('chart_caption', output, input);
  const interpretive_text =
    match !== null ? interpolate(match.sentence, context) : null;

  return { bubbles, caption: { interpretive_text, token_text } };
}
