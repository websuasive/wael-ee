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
  pullBand,
} from './data/tokens';
import { directionDescriptions } from './data/recognition_sentences';
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

function cardSentenceById(): string | null {
  // Tier 2: summary slot stays empty (interpretive lines removed).
  // State-sentence now in Quality field via cardStateSentence.
  return null;
}

// CARD DISPLAY IS DELIBERATELY MINIMAL.
// These engine fields are computed but intentionally NOT shown on the card:
//   - felt_cost (cost band)      - reserved for the planned LLM content layer
//   - anticipation               - reserved for the LLM layer
//   - quadrant movement nuance   - card shows the quality state-sentence only; finer
//                                  active/quiet/habit shades are for the LLM to express
//   - expression_space captions, held_attributed lines - cut (see SYNTHESIS.md)
// These are NOT dropped or broken - they are inputs the planned LLM personalisation layer
// is intended to use. Do NOT re-surface them as terse on-card tokens (that was tried and
// proved unreadable). See SYNTHESIS.md, "LLM content layer (planned)".

/**
 * Card state-sentence: maps quality x quadrant to plain explanatory sentence.
 * Replaces Tier 2 one-word token with human-readable state description.
 */
function cardStateSentence(d: DirectionOutput): string {
  const first = d.pull_quality[0];
  const quadrant = d.quadrant;

  // Empty quality
  if (first === undefined) {
    return 'Not really reading as one of yours.';
  }

  // real - quadrant selects among four
  if (first === 'real') {
    if (quadrant === 'active') {
      return "A real want, and you're acting on it.";
    }
    if (quadrant === 'blocked') {
      return "A real want, but there's no room for it right now.";
    }
    if (quadrant === 'quiet') {
      return "A real want that's gone quiet - there, but not pushing.";
    }
    if (quadrant === 'habit') {
      return "A real want, though it's running on habit now.";
    }
  }

  // suppressed - two variants
  if (first === 'suppressed') {
    if (quadrant === 'active' || quadrant === 'habit') {
      return 'Still going through the motions, but the wanting underneath has gone quiet.';
    }
    if (quadrant === 'blocked' || quadrant === 'quiet') {
      return "You've pushed this one down - you've had it before, but it's low now.";
    }
  }

  // saturated - same sentence regardless of quadrant
  if (first === 'saturated') {
    return "This one's gone stale - the wanting's worn out.";
  }

  // behaviourally_divergent - same sentence regardless of quadrant
  if (first === 'behaviourally_divergent') {
    return 'You name this one, but your energy actually goes elsewhere.';
  }

  // phantom / phantom_partial - same sentence regardless of quadrant
  if (first === 'phantom' || first === 'phantom_partial') {
    return "Wanted, but it hasn't turned into anything yet.";
  }

  // ghost - suppressed from display, should not reach here
  if (first === 'ghost') {
    return 'ghost';
  }

  // Fallback for any unexpected quality
  return 'Not really reading as one of yours.';
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

function buildFields(
  d: DirectionOutput,
  input: InputMap,
): CardField[] {
  const inp = input.directions[d.direction];
  const pastValue = PAST_PRESENCE_TOKENS[inp.past_presence];
  return [
    { label: 'Pull', value: pullBand(d.pull), intensity: d.pull },
    { label: 'Past', value: pastValue, intensity: pastIntensity(pastValue) },
    { label: 'Quality', value: cardStateSentence(d), intensity: null },
  ];
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
      const sentence = cardSentenceById();
      if (sentence !== null) {
        interpretive_text = sentence;
        claimed.add(candidateId);
      }
    }

    // Summary slot stays empty (Tier 2: interpretive lines removed).
    // State-sentence now in Quality field via cardStateSentence.
    const token_text = '';

    const visual_state: DirectionCardOutput['visual_state'] = namedSet.has(
      d.direction,
    )
      ? 'named'
      : firingNames.has(d.direction)
        ? 'firing_not_named'
        : 'not_firing';

    const card: DirectionCardOutput = {
      direction_name: DIRECTION_DISPLAY_NAMES[d.direction],
      direction_engine_name: d.direction,
      summary: { interpretive_text, token_text },
      meaning_sentence: buildMeaningSentence(d),
      fields: buildFields(d, input),
      visual_state,
    };

    return card;
  });
}
