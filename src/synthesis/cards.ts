// Direction card construction. Implements SYNTHESIS.md section 5.3, including section 7.2 per-card predicates and the first-fire rule.

import type {
  EngineOutput,
  InputMap,
  DirectionOutput,
  DirectionName,
} from '../engine';
import type { CardField, DirectionCardOutput } from './types';
import type { FiringSetEntry } from './headline';
import {
  DIRECTION_DISPLAY_NAMES,
  DIRECTION_TO_TYPE_KEY,
  PAST_PRESENCE_TOKENS,
  ANTICIPATION_TOKENS,
  PULL_QUALITY_TOKENS,
  EMPTY_PULL_QUALITY_TOKEN,
  QUADRANT_TOKENS,
  pullBand,
  feltCostBand,
} from './data/tokens';
import { directionDescriptions } from './data/recognition_sentences';
import { shapeSentences } from './data/shape_sentences';
import type { SlotContent } from './types';
import { SELF_REPORT_ITEMS } from './data/self_report_items';

type CardPredicate = (d: DirectionOutput) => boolean;

const CARD_PREDICATES: ReadonlyArray<{ id: string; predicate: CardPredicate }> = [
  // §7.2 v2 extensions — held_attributed_unexpressed on the four eligible
  // directions; fire before card_real_active_strong when applicable.
  {
    id: 'card_held_unexpressed_creator',
    predicate: (d) =>
      d.direction === 'creator' &&
      d.pull_state.includes('held_attributed_unexpressed'),
  },
  {
    id: 'card_held_unexpressed_relationship_rebuilder',
    predicate: (d) =>
      d.direction === 'relationship_rebuilder' &&
      d.pull_state.includes('held_attributed_unexpressed'),
  },
  {
    id: 'card_held_unexpressed_growth',
    predicate: (d) =>
      d.direction === 'growth_focused' &&
      d.pull_state.includes('held_attributed_unexpressed'),
  },
  {
    id: 'card_held_unexpressed_contributor',
    predicate: (d) =>
      d.direction === 'contributor' &&
      d.pull_state.includes('held_attributed_unexpressed'),
  },
  {
    id: 'card_real_active_strong',
    predicate: (d) =>
      d.pull_quality.includes('real') &&
      d.quadrant === 'active' &&
      d.pull >= 70,
  },
  {
    id: 'card_real_active_moderate',
    predicate: (d) =>
      d.pull_quality.includes('real') &&
      d.quadrant === 'active' &&
      d.pull < 70,
  },
  {
    id: 'card_real_blocked',
    predicate: (d) =>
      d.pull_quality.includes('real') && d.quadrant === 'blocked',
  },
  {
    id: 'card_real_quiet',
    predicate: (d) =>
      d.pull_quality.includes('real') && d.quadrant === 'quiet',
  },
  {
    id: 'card_real_habit',
    predicate: (d) =>
      d.pull_quality.includes('real') && d.quadrant === 'habit',
  },
  {
    id: 'card_suppressed_blocked',
    predicate: (d) =>
      d.pull_quality.includes('suppressed') && d.quadrant === 'blocked',
  },
  {
    id: 'card_suppressed_active',
    predicate: (d) =>
      d.pull_quality.includes('suppressed') && d.quadrant === 'active',
  },
  {
    id: 'card_suppressed_habit',
    predicate: (d) =>
      d.pull_quality.includes('suppressed') && d.quadrant === 'habit',
  },
  {
    id: 'card_suppressed_quiet',
    predicate: (d) =>
      d.pull_quality.includes('suppressed') && d.quadrant === 'quiet',
  },
  {
    id: 'card_phantom',
    predicate: (d) =>
      d.pull_quality.includes('phantom') ||
      d.pull_quality.includes('phantom_partial'),
  },
  {
    id: 'card_saturated',
    predicate: (d) => d.pull_quality.includes('saturated'),
  },
  {
    id: 'card_behaviourally_divergent',
    predicate: (d) => d.pull_quality.includes('behaviourally_divergent'),
  },
  {
    id: 'card_empty_habit',
    predicate: (d) => d.pull_quality.length === 0 && d.quadrant === 'habit',
  },
  {
    id: 'card_empty_quiet',
    predicate: (d) => d.pull_quality.length === 0 && d.quadrant === 'quiet',
  },
];

function cardSentenceById(id: string): string | null {
  const entry = shapeSentences.find(
    (s) => s.id === id && s.slot === 'direction_card_summary',
  );
  return entry ? entry.sentence : null;
}

function compositeQualityToken(d: DirectionOutput): string {
  const first = d.pull_quality[0];
  const qualityToken =
    first === undefined ? EMPTY_PULL_QUALITY_TOKEN : PULL_QUALITY_TOKENS[first];
  return `${qualityToken}, ${QUADRANT_TOKENS[d.quadrant]}.`;
}

function pastIntensity(value: string): number {
  switch (value) {
    case 'present':
      return 90;
    case 'mostly present':
      return 75;
    case 'partial':
      return 50;
    case 'absent':
      return 10;
    case 'none':
      return 0;
    default:
      return 0;
  }
}

function costIntensity(value: string): number {
  switch (value) {
    case 'high':
      return 85;
    case 'moderate':
      return 50;
    case 'low':
      return 20;
    case 'none':
      return 5;
    default:
      return 0;
  }
}

function anticipationIntensity(value: string): number {
  switch (value) {
    case 'quickening':
      return 80;
    case 'mild':
      return 35;
    case 'none':
      return 0;
    default:
      return 0;
  }
}

function buildFields(
  d: DirectionOutput,
  input: InputMap,
): CardField[] {
  const inp = input.directions[d.direction];
  const pastValue = PAST_PRESENCE_TOKENS[inp.past_presence];
  const costValue = feltCostBand(inp.felt_cost);
  const anticipationValue = ANTICIPATION_TOKENS[inp.anticipation];
  return [
    { label: 'Pull', value: pullBand(d.pull), intensity: d.pull },
    { label: 'Past', value: pastValue, intensity: pastIntensity(pastValue) },
    {
      label: 'Felt cost',
      value: costValue,
      intensity: costIntensity(costValue),
    },
    {
      label: 'Anticipation',
      value: anticipationValue,
      intensity: anticipationIntensity(anticipationValue),
    },
    { label: 'Quality', value: compositeQualityToken(d), intensity: null },
  ];
}

/** §5.3 modification — held_attributed_line dispatches on Pull state value. */
function buildHeldAttributedLine(d: DirectionOutput): string | null {
  if (d.pull_state.includes('held_attributed_with_expression')) {
    return 'Something specific held in this direction.';
  }
  if (d.pull_state.includes('held_attributed_unexpressed')) {
    return 'Something specific held in this direction, with no current room for it.';
  }
  return null;
}

/**
 * §5.3 + §7.7 — expression_space_caption per direction.
 *
 * Asymmetric by design: fires only when expression_space === "no_space" AND
 * direction materially reading (pull >= 30 OR pull_quality non-empty). The
 * has_space case (and the not-materially-reading case) produces an empty
 * SlotContent so the render layer drops the slot.
 */
function buildExpressionSpaceCaption(d: DirectionOutput): SlotContent {
  const empty: SlotContent = { interpretive_text: null, token_text: '' };
  if (d.expression_space !== 'no_space') return empty;
  const materiallyReading = d.pull >= 30 || d.pull_quality.length > 0;
  if (!materiallyReading) return empty;
  const id = `expression_space_${d.direction}_no`;
  const entry = shapeSentences.find(
    (s) => s.id === id && s.slot === 'expression_space_caption',
  );
  if (entry === undefined) return empty;
  return { interpretive_text: entry.sentence, token_text: '' };
}

function buildMeaningSentence(d: DirectionOutput): {
  interpretive_text: string | null;
  token_text: string;
} {
  const typeKey = DIRECTION_TO_TYPE_KEY[d.direction];
  const sentence = directionDescriptions[typeKey];
  return {
    interpretive_text: sentence ?? null,
    token_text: '',
  };
}

function findCardCandidate(d: DirectionOutput): string | null {
  for (const entry of CARD_PREDICATES) {
    if (entry.predicate(d)) return entry.id;
  }
  return null;
}

export function computeDirectionCards(
  output: EngineOutput,
  input: InputMap,
  firingSet: FiringSetEntry[],
): DirectionCardOutput[] {
  // Defensive sort by pull descending with alphabetical tiebreak.
  const sorted = [...output.directions].sort(
    (a, b) => b.pull - a.pull || a.direction.localeCompare(b.direction),
  );

  const namedSet = new Set<DirectionName>(
    firingSet.slice(0, 3).map((e) => e.direction),
  );
  const firingNames = new Set<DirectionName>(
    firingSet.map((e) => e.direction),
  );

  const claimed = new Set<string>();

  // Build set of directions excluded from surfaced findings (those in named list).
  // This mirrors comparison_surface.ts exclusion logic for direction anchors.
  const excludedDirections = new Set<DirectionName>();
  for (const id of input.self_report.named_absences) {
    if (id === 'nothing_really') continue;
    const item = SELF_REPORT_ITEMS.find((it) => it.id === id);
    if (item === undefined) continue;
    // Collect all direction anchors from this item
    for (const anchor of item.architectural_anchors) {
      if (anchor.kind === 'direction') {
        excludedDirections.add(anchor.name);
      }
    }
  }

  return sorted.map((d) => {
    const candidateId = findCardCandidate(d);
    let interpretive_text: string | null = null;
    if (candidateId !== null && !claimed.has(candidateId)) {
      const sentence = cardSentenceById(candidateId);
      if (sentence !== null) {
        interpretive_text = sentence;
        claimed.add(candidateId);
      }
    }

    // When no authored sentence fires (or the predicate id was claimed by a
    // higher-pull sibling under the first-fire rule), suppress token_text so
    // shouldRenderSlot drops the summary slot entirely. This avoids visible
    // duplication with the Quality field (which carries the same composite
    // quality string in its own row). When a sentence is present, token_text
    // continues to carry the composite as graceful-degradation backup.
    const token_text =
      interpretive_text !== null ? compositeQualityToken(d) : '';

    const visual_state: DirectionCardOutput['visual_state'] = namedSet.has(
      d.direction,
    )
      ? 'named'
      : firingNames.has(d.direction)
        ? 'firing_not_named'
        : 'not_firing';

    // §7.17 surfaced finding: populate when direction is surfaced (in firing set)
    // AND not in the man's named list (not excluded by direction anchors).
    const isSurfaced = d.surfaced && !excludedDirections.has(d.direction);
    const surfaced_finding = isSurfaced
      ? 'You didn\'t name this one, but the architecture reads it firing.'
      : undefined;

    const card: DirectionCardOutput = {
      direction_name: DIRECTION_DISPLAY_NAMES[d.direction],
      direction_engine_name: d.direction,
      summary: { interpretive_text, token_text },
      meaning_sentence: buildMeaningSentence(d),
      fields: buildFields(d, input),
      expression_space_caption: buildExpressionSpaceCaption(d),
      held_attributed_line: buildHeldAttributedLine(d),
      visual_state,
    };

    // Only add surfaced_finding if it has a value
    if (surfaced_finding !== undefined) {
      card.surfaced_finding = surfaced_finding;
    }

    return card;
  });
}
