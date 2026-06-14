// The Narrowings Panel composition. Implements SYNTHESIS.md §5.13.

import type { EngineOutput, InputMap } from '../engine';
import type { TheNarrowingsPanel, NarrowingBandEntry, SlotContent } from './types';
import { NARROWING_BAND_METADATA } from './data/tokens';
import { NARROWINGS_OBSERVATIONS } from './data/narrowings_observations';
import { findFirstMatchingSentence } from './predicates';

export function computeTheNarrowingsPanel(
  output: EngineOutput,
  input: InputMap,
): TheNarrowingsPanel {
  const bands: NarrowingBandEntry[] = NARROWING_BAND_METADATA.map((metadata) => {
    const bandValue = output.cross_direction[
      metadata.engine_field as keyof typeof output.cross_direction
    ] as 'low' | 'moderate' | 'high';
    const observationKey = `${metadata.band_field}_${bandValue}`;
    const observation = NARROWINGS_OBSERVATIONS[observationKey];
    if (!observation) {
      throw new Error(`Missing observation for key: ${observationKey}`);
    }
    return {
      band_field: metadata.band_field,
      display_name: metadata.display_name,
      full_name: metadata.full_name,
      character_name: metadata.character_name,
      band: bandValue,
      intensity: bandToIntensity(bandValue),
      observation,
    };
  });

  const summary = composeNarrowingSummary(output, input);

  return { bands, summary };
}

function bandToIntensity(band: 'low' | 'moderate' | 'high'): 33 | 66 | 100 {
  if (band === 'low') return 33;
  if (band === 'moderate') return 66;
  return 100;
}

function composeNarrowingSummary(
  output: EngineOutput,
  input: InputMap,
): SlotContent {
  // §7.15 narrowing_summary slot. Token fallback per §5.13.1.
  const summaryMatch = findFirstMatchingSentence(
    'narrowing_summary',
    output,
    input,
  );
  const summary: SlotContent = {
    interpretive_text: summaryMatch !== null ? summaryMatch.sentence : null,
    token_text: buildNarrowingSummaryToken(output),
  };
  return summary;
}

function buildNarrowingSummaryToken(output: EngineOutput): string {
  const counts = countBandsByValue(output);
  const clauses: string[] = [];
  if (counts.high > 0) clauses.push(`${counts.high} high`);
  if (counts.moderate > 0) clauses.push(`${counts.moderate} moderate`);
  if (counts.low > 0) clauses.push(`${counts.low} low`);
  return `Bands reading: ${clauses.join(', ')}.`;
}

function countBandsByValue(output: EngineOutput): {
  high: number;
  moderate: number;
  low: number;
} {
  const cd = output.cross_direction;
  const bands = [
    cd.structural_narrowing_band,
    cd.experiential_narrowing_band,
    cd.psychological_narrowing_band,
    cd.identity_narrowing_band,
    cd.energetic_narrowing_band,
    cd.relational_narrowing_band,
    cd.attention_narrowing_band,
  ];
  return {
    high: bands.filter((b) => b === 'high').length,
    moderate: bands.filter((b) => b === 'moderate').length,
    low: bands.filter((b) => b === 'low').length,
  };
}
