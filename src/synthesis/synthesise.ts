// Synthesis layer entry point. Orchestrates SYNTHESIS.md section 8's 12-step computation order. Recognition_paragraph and pattern_paragraph slot fills (sections 5.2.1 and 5.2.2) live here as integration logic; cross_cutting_panel construction (section 5.7) is also inlined as three lines of mechanical assembly.

import type { EngineOutput, InputMap, DirectionName } from '../engine';
import type {
  RenderingInstructions,
  SlotContent,
  CrossCuttingPanel,
  CrossCuttingPanelEntry,
} from './types';
import { computeFiringSet, computeHeadline } from './headline';
import type { FiringSetEntry } from './headline';
import { findFirstMatchingSentence } from './predicates';
import { computeDirectionCards } from './cards';
import { computeChartData } from './chart_data';
import { computeDomainsPanel } from './domains_panel';
import { computeConstraintsPanel } from './constraints_panel';
import { computeExperienceCandidates } from './experience_candidates';
import { computeLifeTexturePanel } from './life_texture_panel';
import { computeLifeContextPanel } from './life_context_panel';
import { computeComparisonSurfacePanel } from './comparison_surface';
import { computeTheNarrowingsPanel } from './the_narrowings_panel';
import { interpolate } from './interpolation';
import {
  DIRECTION_DISPLAY_NAMES,
  DIRECTION_TO_TYPE_KEY,
  sciBand,
} from './data/tokens';
import { recognitionSentences } from './data/recognition_sentences';
import { calibrationLines } from './data/calibration_lines';

const CROSS_CUTTING_DISPLAY_NAMES: Record<
  'between_shapes' | 'mid_process',
  string
> = {
  between_shapes: 'Between shapes',
  mid_process: 'Mid-process',
};

function buildRecognitionParagraph(firingSet: FiringSetEntry[]): SlotContent {
  const top = firingSet.slice(0, 3);
  const typeKeys = top.map((e) => DIRECTION_TO_TYPE_KEY[e.direction]);
  const displayNames = top.map((e) => DIRECTION_DISPLAY_NAMES[e.direction]);

  // Section 3.2 fallback chain: full → primary+secondary → primary alone → null.
  let interpretive_text: string | null = null;
  for (let len = typeKeys.length; len >= 1; len--) {
    const key = typeKeys.slice(0, len).join(',');
    const sentence = recognitionSentences[key];
    if (sentence !== undefined) {
      interpretive_text = sentence;
      break;
    }
  }

  // Section 5.2.3 token templates.
  let token_text = '';
  if (displayNames.length === 1) {
    token_text = interpolate('{name1}.', { name1: displayNames[0]! });
  } else if (displayNames.length === 2) {
    token_text = interpolate('{name1} and {name2}.', {
      name1: displayNames[0]!,
      name2: displayNames[1]!,
    });
  } else if (displayNames.length >= 3) {
    token_text = interpolate('{name1}, {name2}, and {name3}.', {
      name1: displayNames[0]!,
      name2: displayNames[1]!,
      name3: displayNames[2]!,
    });
  }

  return { interpretive_text, token_text };
}

function buildPatternParagraph(
  output: EngineOutput,
  input: InputMap,
  firingSet: FiringSetEntry[],
  patternMatch: ReturnType<typeof findFirstMatchingSentence>,
): SlotContent {
  const n = firingSet.length;
  const sci = output.constraints.sustained_constraint_intensity;
  const duration_band = input.cross_direction.life_shape_duration;
  const sci_band = sciBand(sci, duration_band);

  const primaryDirection: DirectionName | null =
    firingSet.length > 0 ? firingSet[0]!.direction : null;
  const primaryDisplay =
    primaryDirection !== null
      ? DIRECTION_DISPLAY_NAMES[primaryDirection]
      : '';

  const top = firingSet.slice(0, 3).map((e) => DIRECTION_DISPLAY_NAMES[e.direction]);
  
  // Matched-direction dispatch per SYNTHESIS.md §7.1 for the four sentence IDs
  // that interpolate {direction_display} based on their predicate's firing condition
  // rather than the highest-pull direction overall.
  const matchedDirectionIds = new Set([
    'held_unexpressed_strong',
    'held_unexpressed_moderate',
    'depleted_band_with_held',
    'empty_band_with_phantom',
  ]);
  
  let directionForDisplay: string = primaryDisplay;
  if (patternMatch !== null && matchedDirectionIds.has(patternMatch.id)) {
    const matchedDir = patternMatch.matched_direction;
    // Defensive fallback: if matched direction is null (should not happen in practice,
    // as the predicate's firing condition put the sentence on the matched list),
    // fall back to firingSet[0].direction to keep the dashboard renderable.
    directionForDisplay = matchedDir !== null
      ? DIRECTION_DISPLAY_NAMES[matchedDir]
      : primaryDisplay;
  }
  
  const interpretiveContext: Record<string, string | number> = {
    direction_display: directionForDisplay,
    n,
    sci_band,
    duration_band,
    name1: top[0] ?? '',
    name2: top[1] ?? '',
    name3: top[2] ?? '',
  };

  let interpretive_text: string | null = null;
  if (patternMatch !== null) {
    interpretive_text = interpolate(patternMatch.sentence, interpretiveContext);
    // Calibration line forward-hook: prepend any firing calibration sentence(s) + ' '.
    for (const cal of calibrationLines) {
      if (cal.predicate(output, input)) {
        interpretive_text = `${cal.sentence} ${interpretive_text}`;
      }
    }
  }

  // Section 5.2.4 token templates.
  let template: string;
  if (n === 0) {
    template =
      'No directions reading materially. Constraint pattern: {sci_band}. Life shape duration: {duration_band}.';
  } else if (n === 1) {
    template =
      'One direction reading materially. Constraint pattern: {sci_band}. Life shape duration: {duration_band}.';
  } else {
    template =
      '{n} directions reading materially. Constraint pattern: {sci_band}. Life shape duration: {duration_band}.';
  }
  const token_text = interpolate(template, { n, sci_band, duration_band });

  return { interpretive_text, token_text };
}

function buildCrossCuttingPanel(output: EngineOutput): CrossCuttingPanel {
  const outputs: CrossCuttingPanelEntry[] = output.cross_cutting.map((c) => ({
    name: CROSS_CUTTING_DISPLAY_NAMES[c.output],
    output_engine_name: c.output,
    fires: c.fires,
  }));
  return { outputs };
}

export function synthesise(
  output: EngineOutput,
  input: InputMap,
): RenderingInstructions {
  // Step 1 — firing set
  const firingSet = computeFiringSet(output);

  // Step 2 — headline
  const headline = computeHeadline(output, input);

  // Step 3 — recognition paragraph
  const recognition_paragraph = buildRecognitionParagraph(firingSet);

  // Step 4 — pattern paragraph (cross-step state begins here)
  const patternMatch = findFirstMatchingSentence('pattern_paragraph', output, input);
  const pattern_paragraph = buildPatternParagraph(
    output,
    input,
    firingSet,
    patternMatch,
  );

  // Step 5 — direction cards
  const direction_cards = computeDirectionCards(output, input, firingSet);

  // Step 6 — direction evidence chart
  const direction_evidence_chart = computeChartData(output, input, firingSet);

  // Step 7 — domains panel
  const domains_panel = computeDomainsPanel(output, input);

  // Step 8 — constraints panel
  const constraints_panel = computeConstraintsPanel(output, input);

  // Step 9 — cross-cutting panel
  const cross_cutting_panel = buildCrossCuttingPanel(output);

  // Step 10 — experience candidate directions
  const experience_candidate_directions = computeExperienceCandidates(
    output,
    input,
    firingSet,
  );

  // Step 12 — life_texture_panel (§5.11)
  const life_texture_panel = computeLifeTexturePanel(output, input);

  // Step 13 — life_context_panel (§5.12)
  const life_context_panel = computeLifeContextPanel(
    output,
    input,
    patternMatch,
  );

  // Step 14 — comparison_surface_panel (§5.10); may be null.
  const comparison_surface_panel = computeComparisonSurfacePanel(output, input);

  // Step 15 (v4) — the_narrowings_panel (§5.13)
  const the_narrowings_panel = computeTheNarrowingsPanel(output, input);

  // Step 16 — return assembled RenderingInstructions
  return {
    headline,
    recognition_paragraph,
    pattern_paragraph,
    direction_cards,
    direction_evidence_chart,
    domains_panel,
    constraints_panel,
    cross_cutting_panel,
    experience_candidate_directions,
    life_texture_panel,
    life_context_panel,
    comparison_surface_panel,
    the_narrowings_panel,
  };
}
