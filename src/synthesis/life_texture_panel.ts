// Life-texture panel composition. Implements SYNTHESIS.md §5.11.

import type { EngineOutput, InputMap } from '../engine';
import type { LifeTexturePanel, SlotContent } from './types';
import { findFirstMatchingSentence } from './predicates';
import {
  LIFE_TEXTURE_BAND_LABELS,
  WEEK_SHAPE_FLAG_LABELS,
  WEEK_SHAPE_CONTENTS_FLAGS,
  loadStateLabel,
} from './data/tokens';
import { interpolate } from './interpolation';

export function computeLifeTexturePanel(
  output: EngineOutput,
  input: InputMap,
): LifeTexturePanel {
  const cross = output.cross_direction;
  const band = cross.life_texture_band;
  const band_label = LIFE_TEXTURE_BAND_LABELS[band];
  const flags_present: string[] = [];
  const flags_absent: string[] = [];
  for (const flag of WEEK_SHAPE_CONTENTS_FLAGS) {
    const label = WEEK_SHAPE_FLAG_LABELS[flag];
    if (cross.week_shape[flag]) flags_present.push(label);
    else flags_absent.push(label);
  }
  const load_state_label = loadStateLabel(
    cross.week_shape.work_dominates,
    cross.week_shape.weekends_consumed,
  );

  // §5.11 summary: §7.5 shape sentences. Token fallback when no shape sentence fires:
  // "Week reads as {band_label}."
  const summaryMatch = findFirstMatchingSentence(
    'life_texture_summary',
    output,
    input,
  );
  const summary: SlotContent = {
    interpretive_text: summaryMatch !== null ? summaryMatch.sentence : null,
    token_text: summaryMatch === null ? interpolate('Week reads as {band_label}.', { band_label }) : '',
  };

  return {
    summary,
    band_label,
    flags_present,
    flags_absent,
    load_state_label,
  };
}
