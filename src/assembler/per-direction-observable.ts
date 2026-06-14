import type { QuestionnaireAnswers, DirectionKey } from './answers';
import { interpretQ10 } from './q10-interpretation';

export type ObservableFields = {
  current_movement: number;
  recent_action: 'none' | 'some' | 'recent';
  anticipation: 'none' | 'mild' | 'quickening';
  specificity: 'none' | 'partial' | 'strong';
  past_presence: 'yes' | 'no';
  stopped_expecting: 'yes' | 'no';
  would_reach_for: 'yes' | 'no';
};

export function buildPerDirectionObservables(
  answers: QuestionnaireAnswers,
): Record<DirectionKey, ObservableFields> {
  const directions: DirectionKey[] = [
    'contributor',
    'experience_seeker',
    'freedom_designer',
    'growth_focused',
    'creator',
    'relationship_rebuilder',
  ];

  const result: Record<DirectionKey, ObservableFields> = {} as Record<DirectionKey, ObservableFields>;

  // Interpret Q10 once — both would_reach_for and direction_chosen project from this
  const q10Interpretation = interpretQ10(answers.q10_direction_chosen);

  for (const direction of directions) {
    const cardA = answers.per_direction_card_a[direction];
    const cardB = answers.per_direction_card_b[direction];
    const cardC = answers.per_direction_card_c[direction];

    // current_movement from card a: a=0, b=33, c=67, d=100
    const current_movement_map: Record<'a' | 'b' | 'c' | 'd', number> = {
      a: 0,
      b: 33,
      c: 67,
      d: 100,
    };
    const current_movement = current_movement_map[cardA];

    // recent_action from card a: a=none, b=some, c=recent, d=recent
    const recent_action_map: Record<'a' | 'b' | 'c' | 'd', 'none' | 'some' | 'recent'> = {
      a: 'none',
      b: 'some',
      c: 'recent',
      d: 'recent',
    };
    const recent_action = recent_action_map[cardA];

    // anticipation from card b: a=none, b=mild, c=quickening
    const anticipation_map: Record<'a' | 'b' | 'c', 'none' | 'mild' | 'quickening'> = {
      a: 'none',
      b: 'mild',
      c: 'quickening',
    };
    const anticipation = anticipation_map[cardB];

    // specificity from card c, gated by the derived anticipation: if anticipation === 'none', specificity = none regardless of card c
    // Gate on the derived none-state (anticipation === 'none'), not the raw card-b button — the spec's gate is the felt none-state; this survives a card-b redesign. Do not revert to cardB === 'a'.
    let specificity: 'none' | 'partial' | 'strong';
    if (anticipation === 'none') {
      // Gate closed: anticipation=none -> specificity=none
      specificity = 'none';
    } else {
      // Gate open: map card c
      const specificity_map: Record<'a' | 'b' | 'c' | 'skipped', 'none' | 'partial' | 'strong'> = {
        a: 'none',
        b: 'partial',
        c: 'strong',
        skipped: 'none',
      };
      specificity = specificity_map[cardC];
    }

    // past_presence from Q8: ticked -> yes, else no
    const past_presence = answers.q8_past_presence_ticked.includes(direction) ? 'yes' : 'no';

    // stopped_expecting from Q9: ticked -> yes, else no
    const stopped_expecting = answers.q9_stopped_expecting_ticked.includes(direction) ? 'yes' : 'no';

    // would_reach_for from Q10: yes for direction_chosen, no for others; g/h -> all no
    // Project from the shared Q10 interpretation
    const would_reach_for: 'yes' | 'no' =
      q10Interpretation.kind === 'direction' && q10Interpretation.direction === direction
        ? 'yes'
        : 'no';

    result[direction] = {
      current_movement,
      recent_action,
      anticipation,
      specificity,
      past_presence,
      stopped_expecting,
      would_reach_for,
    };
  }

  return result;
}
