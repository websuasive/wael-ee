import type { QuestionnaireAnswers, DirectionKey } from './answers';
import type { LifeStageValue } from '@/engine/types';
import {
  mapLifeShapeDuration,
  mapRecentLifeShapeChange,
  mapRecentReaching,
} from './answer-maps';

const DIRECTION_KEYS: DirectionKey[] = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
];

function mapCardBToAnticipation(cardB: 'a' | 'b' | 'c'): 'none' | 'mild' | 'quickening' {
  switch (cardB) {
    case 'a':
      return 'none';
    case 'b':
      return 'mild';
    case 'c':
      return 'quickening';
  }
}

export function deriveLifeStage(answers: QuestionnaireAnswers): LifeStageValue {
  const lifeShapeDuration = mapLifeShapeDuration(answers.q4_life_shape_duration);
  const recentLifeShapeChange = mapRecentLifeShapeChange(answers.q5_recent_life_shape_change);
  const recentReaching = mapRecentReaching(answers.q29_recent_reaching);

  // Derive per-direction anticipation from card_b
  const anticipations: Record<DirectionKey, 'none' | 'mild' | 'quickening'> = {
    contributor: mapCardBToAnticipation(answers.per_direction_card_b.contributor),
    experience_seeker: mapCardBToAnticipation(answers.per_direction_card_b.experience_seeker),
    freedom_designer: mapCardBToAnticipation(answers.per_direction_card_b.freedom_designer),
    growth_focused: mapCardBToAnticipation(answers.per_direction_card_b.growth_focused),
    creator: mapCardBToAnticipation(answers.per_direction_card_b.creator),
    relationship_rebuilder: mapCardBToAnticipation(answers.per_direction_card_b.relationship_rebuilder),
  };

  const hasQuickening = Object.values(anticipations).some((a) => a === 'quickening');
  const directionChosenIsOneOfSix = DIRECTION_KEYS.includes(answers.q10_direction_chosen as DirectionKey);

  // Rule 1: life_shape_duration == recent AND recent_life_shape_change == yes -> transitioning
  if (lifeShapeDuration === 'recent' && recentLifeShapeChange === 'yes') {
    return 'transitioning';
  }

  // Rule 2: recent_reaching == recent_and_awkward -> transitioning
  if (recentReaching === 'recent_and_awkward') {
    return 'transitioning';
  }

  // Rule 3: recent_reaching == long_established -> consolidating
  if (recentReaching === 'long_established') {
    return 'consolidating';
  }

  // Rule 4: anticipation == quickening in any direction OR direction_chosen is one of the six -> consolidating
  if (hasQuickening || directionChosenIsOneOfSix) {
    return 'consolidating';
  }

  // Rule 5: recent_reaching == no_current_reaching -> enduring
  if (recentReaching === 'no_current_reaching') {
    return 'enduring';
  }

  // Rule 6: otherwise -> drifting
  return 'drifting';
}
