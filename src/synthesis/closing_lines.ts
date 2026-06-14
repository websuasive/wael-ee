// Closing line construction. Implements SYNTHESIS.md section 5.8: fixed-order firing across six closing-line types, per-direction iteration for three of them, and four-pair deduplication against the matched pattern_paragraph sentence.

import type {
  EngineOutput,
  InputMap,
  DirectionOutput,
  DirectionName,
} from '../engine';
import type { ClosingLine, ClosingLineId, SlotContent } from './types';
import type { ShapeSentenceMatch } from './predicates';
import { shapeSentences } from './data/shape_sentences';
import { CLOSING_LINE_TOKENS } from './data/closing_line_tokens';
import {
  DIRECTION_DISPLAY_NAMES,
  DIRECTION_LOWERCASE_FORM,
} from './data/tokens';
import { interpolate } from './interpolation';

function crossCuttingFires(
  output: EngineOutput,
  name: 'between_shapes' | 'mid_process',
): boolean {
  const entry = output.cross_cutting.find((c) => c.output === name);
  return entry !== undefined && entry.fires;
}

function isInFiringSet(d: DirectionOutput): boolean {
  return d.pull_quality.length > 0 || d.pull >= 50;
}

function sortedByPullDesc(directions: readonly DirectionOutput[]): DirectionOutput[] {
  return [...directions].sort(
    (a, b) => b.pull - a.pull || a.direction.localeCompare(b.direction),
  );
}

function sentenceForId(id: ClosingLineId): string | null {
  const slot = `closing_line_${id}` as const;
  const entry = shapeSentences.find((s) => s.id === id && s.slot === slot);
  return entry ? entry.sentence : null;
}

function buildLine(
  id: ClosingLineId,
  context: Record<string, string | number>,
  output: EngineOutput,
  input: InputMap,
  direction_engine_name: DirectionName | null,
): ClosingLine {
  const tokenTemplate = CLOSING_LINE_TOKENS[id];
  const token_text = interpolate(tokenTemplate, context);

  const sentenceTemplate = sentenceForId(id);
  let interpretive_text: string | null = null;
  if (sentenceTemplate !== null) {
    const slotEntry = shapeSentences.find(
      (s) => s.id === id && s.slot === `closing_line_${id}`,
    );
    if (slotEntry !== undefined && slotEntry.predicate(output, input)) {
      interpretive_text = interpolate(sentenceTemplate, context);
    }
  }

  const text: SlotContent = { interpretive_text, token_text };
  return { id, direction_engine_name, text };
}

function perDirectionContext(d: DirectionOutput): Record<string, string> {
  return {
    direction_display: DIRECTION_DISPLAY_NAMES[d.direction],
    direction_lower: DIRECTION_LOWERCASE_FORM[d.direction],
  };
}

export function computeClosingLines(
  output: EngineOutput,
  input: InputMap,
  patternParagraphMatch: ShapeSentenceMatch | null,
): ClosingLine[] {
  const result: ClosingLine[] = [];
  const matchId = patternParagraphMatch?.id ?? null;
  const matchedDirection = patternParagraphMatch?.matched_direction ?? null;

  // 1. closing_between_shapes
  if (
    crossCuttingFires(output, 'between_shapes') &&
    matchId !== 'between_shapes_clean'
  ) {
    result.push(buildLine('closing_between_shapes', {}, output, input, null));
  }

  // 2. closing_mid_process
  if (
    crossCuttingFires(output, 'mid_process') &&
    matchId !== 'active_going_through_motions'
  ) {
    result.push(buildLine('closing_mid_process', {}, output, input, null));
  }

  // 3. closing_capacity_strain — per-direction, regardless of firing-set membership
  for (const d of sortedByPullDesc(output.directions)) {
    if (!d.pull_state.includes('capacity_strain')) continue;
    const suppressed =
      matchId === 'active_with_tension' && matchedDirection === d.direction;
    if (suppressed) continue;
    result.push(
      buildLine(
        'closing_capacity_strain',
        perDirectionContext(d),
        output,
        input,
        d.direction,
      ),
    );
  }

  // 4. closing_stopped_expecting — combined into one line for all directions
  const stoppedExpectingDirections = sortedByPullDesc(output.directions)
    .filter((d) => d.pull_state.includes('stopped_expecting'))
    .map((d) => d.direction);
  if (stoppedExpectingDirections.length > 0) {
    let context: Record<string, string>;
    if (stoppedExpectingDirections.length === 1) {
      // Single direction: use display name for byte-identical output
      const dir = stoppedExpectingDirections[0]!;
      context = {
        direction_lower: DIRECTION_LOWERCASE_FORM[dir],
        direction_display: DIRECTION_DISPLAY_NAMES[dir],
      };
    } else {
      // Multiple directions: use lowercase list for both sentence and token
      const directionLabels = stoppedExpectingDirections.map(
        (dir) => DIRECTION_LOWERCASE_FORM[dir],
      );
      let directionList: string;
      if (directionLabels.length === 2) {
        directionList = `${directionLabels[0]!} and ${directionLabels[1]!}`;
      } else {
        const last = directionLabels[directionLabels.length - 1]!;
        const rest = directionLabels.slice(0, -1).join(', ');
        directionList = `${rest} and ${last}`;
      }
      context = {
        direction_lower: directionList,
        direction_display: directionList,
      };
    }
    result.push(
      buildLine(
        'closing_stopped_expecting',
        context,
        output,
        input,
        null,
      ),
    );
  }

  // 5. closing_phantom — per-direction, firing-set-gated
  for (const d of sortedByPullDesc(output.directions)) {
    const isPhantom =
      d.pull_quality.includes('phantom') ||
      d.pull_quality.includes('phantom_partial');
    if (!isPhantom) continue;
    if (!isInFiringSet(d)) continue;
    const suppressed =
      (matchId === 'desired_direction_partial' ||
        matchId === 'desired_direction_full') &&
      matchedDirection === d.direction;
    if (suppressed) continue;
    result.push(
      buildLine(
        'closing_phantom',
        perDirectionContext(d),
        output,
        input,
        d.direction,
      ),
    );
  }

  return result;
}
