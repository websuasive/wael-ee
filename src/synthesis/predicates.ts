// Predicate iteration and matched-direction extraction. Implements SYNTHESIS.md section 7.0's first-match-wins rule and section 8's cross-step state for per-direction-suppression sentences.

import type { EngineOutput, InputMap, DirectionName } from '../engine';
import type { SlotName } from './types';
import { shapeSentences } from './data/shape_sentences';

export type ShapeSentenceMatch = {
  id: string;
  sentence: string;
  matched_direction: DirectionName | null;
};

export function findFirstMatchingSentence(
  slot: SlotName,
  output: EngineOutput,
  input: InputMap,
): ShapeSentenceMatch | null {
  for (const entry of shapeSentences) {
    if (entry.slot !== slot) continue;
    if (entry.predicate(output, input)) {
      return {
        id: entry.id,
        sentence: entry.sentence,
        matched_direction: extractMatchedDirection(entry.id, output, input),
      };
    }
  }
  return null;
}

export function extractMatchedDirection(
  id: string,
  output: EngineOutput,
  _input: InputMap,
): DirectionName | null {
  void _input;

  // Defensive sort: highest pull first, alphabetical tiebreak. Mirrors the
  // convention used in headline.ts, cards.ts, and chart_data.ts so that
  // selection here aligns with the direction the pattern_paragraph sentence
  // actually names (primary firing direction per spec section 7.1).
  const sorted = [...output.directions].sort(
    (a, b) => b.pull - a.pull || a.direction.localeCompare(b.direction),
  );

  switch (id) {
    case 'active_with_tension': {
      const match = sorted.find(
        (d) =>
          d.quadrant === 'active' &&
          d.pull >= 70 &&
          d.pull_state.includes('capacity_strain'),
      );
      return match ? match.direction : null;
    }
    case 'desired_direction_partial': {
      const match = sorted.find((d) =>
        d.pull_quality.includes('phantom_partial'),
      );
      return match ? match.direction : null;
    }
    case 'desired_direction_full': {
      const match = sorted.find((d) =>
        d.pull_quality.includes('phantom'),
      );
      return match ? match.direction : null;
    }
    case 'held_unexpressed_strong':
    case 'held_unexpressed_moderate': {
      const match = sorted.find((d) =>
        d.pull_state.includes('held_attributed_unexpressed'),
      );
      return match ? match.direction : null;
    }
    case 'depleted_band_with_held': {
      const match = sorted.find(
        (d) =>
          d.pull_state.includes('held_attributed_unexpressed') &&
          d.specificity === 'strong',
      );
      return match ? match.direction : null;
    }
    case 'empty_band_with_phantom': {
      const match = sorted.find(
        (d) =>
          d.pull_quality.includes('phantom') ||
          d.pull_quality.includes('phantom_partial'),
      );
      return match ? match.direction : null;
    }
    default:
      return null;
  }
}

/**
 * v4 predicate helper (SYNTHESIS_V4.md §7.0). Returns true if all seven
 * narrowing bands equal the given value; false otherwise. Used by compression-
 * point shape sentences (§7.1) and narrowing-summary shape sentences (§7.15).
 */
export function allBandsAt(
  output: EngineOutput,
  value: 'low' | 'moderate' | 'high',
): boolean {
  return (
    output.cross_direction.structural_narrowing_band === value &&
    output.cross_direction.experiential_narrowing_band === value &&
    output.cross_direction.psychological_narrowing_band === value &&
    output.cross_direction.identity_narrowing_band === value &&
    output.cross_direction.energetic_narrowing_band === value &&
    output.cross_direction.relational_narrowing_band === value &&
    output.cross_direction.attention_narrowing_band === value
  );
}
