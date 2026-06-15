// Life-context panel composition. Implements SYNTHESIS.md §5.12 across three sub-slots.

import type { EngineOutput, InputMap } from '../engine';
import type { LifeContextPanel, SlotContent } from './types';
import type { ShapeSentenceMatch } from './predicates';
import { findFirstMatchingSentence } from './predicates';
import { shapeSentences } from './data/shape_sentences';
import {
  LIFE_STAGE_LABELS,
  PAID_WORK_RELATIONSHIP_LABELS,
  PRIMARY_LOAD_LABELS,
  SOCIALITY_LABELS,
} from './data/tokens';
import { interpolate } from './interpolation';

function crossCuttingFires(
  output: EngineOutput,
  name: 'between_shapes' | 'mid_process',
): boolean {
  const entry = output.cross_cutting.find((c) => c.output === name);
  return entry !== undefined && entry.fires;
}

function sentenceForId(id: 'closing_between_shapes' | 'closing_mid_process'): string | null {
  const slot = `closing_line_${id}` as const;
  const entry = shapeSentences.find((s) => s.id === id && s.slot === slot);
  return entry ? entry.sentence : null;
}

function composeSubSlot(
  slotName:
    | 'life_stage_summary'
    | 'work_load_summary'
    | 'sociality_summary',
  tokenTemplate: string,
  tokenContext: Record<string, string>,
  output: EngineOutput,
  input: InputMap,
): SlotContent {
  const match = findFirstMatchingSentence(slotName, output, input);
  return {
    interpretive_text: match !== null ? match.sentence : null,
    token_text: match === null ? interpolate(tokenTemplate, tokenContext) : '',
  };
}

export function computeLifeContextPanel(
  output: EngineOutput,
  input: InputMap,
  patternParagraphMatch: ShapeSentenceMatch | null,
): LifeContextPanel {
  const cross = output.cross_direction;
  const matchId = patternParagraphMatch?.id ?? null;

  // §5.12.1 life_stage_summary — token fallback per §5.12.1 / §6.16.
  const life_stage_summary = composeSubSlot(
    'life_stage_summary',
    'Life-stage reading: {life_stage_label}.',
    { life_stage_label: LIFE_STAGE_LABELS[cross.life_stage] },
    output,
    input,
  );

  // §5.12.2 work_load_summary — token fallback per §7.12 / §6.17+§6.18.
  const work_load_summary = composeSubSlot(
    'work_load_summary',
    'Paid work reading: {paid_work_relationship_label}. Primary load: {primary_load_label}.',
    {
      paid_work_relationship_label:
        PAID_WORK_RELATIONSHIP_LABELS[cross.paid_work_relationship],
      primary_load_label: PRIMARY_LOAD_LABELS[cross.primary_load],
    },
    output,
    input,
  );

  // §5.12.3 sociality_summary — token fallback per §5.12.3 / §6.19.
  const sociality_summary = composeSubSlot(
    'sociality_summary',
    'Sociality reading: {sociality_label}.',
    { sociality_label: SOCIALITY_LABELS[cross.sociality_default] },
    output,
    input,
  );

  // Whole-situation closing lines (relocated from computeClosingLines)
  // 1. closing_between_shapes — suppressed when matchId is 'between_shapes_clean'
  let closing_between_shapes: SlotContent | null = null;
  if (
    crossCuttingFires(output, 'between_shapes') &&
    matchId !== 'between_shapes_clean'
  ) {
    const sentence = sentenceForId('closing_between_shapes');
    if (sentence !== null) {
      closing_between_shapes = {
        interpretive_text: sentence,
        token_text: '',
      };
    }
  }

  // 2. closing_mid_process — suppressed when matchId is 'active_going_through_motions'
  let closing_mid_process: SlotContent | null = null;
  if (
    crossCuttingFires(output, 'mid_process') &&
    matchId !== 'active_going_through_motions'
  ) {
    const sentence = sentenceForId('closing_mid_process');
    if (sentence !== null) {
      closing_mid_process = {
        interpretive_text: sentence,
        token_text: '',
      };
    }
  }

  return {
    life_stage_summary,
    work_load_summary,
    sociality_summary,
    closing_between_shapes,
    closing_mid_process,
  };
}
