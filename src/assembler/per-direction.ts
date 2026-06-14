import type { QuestionnaireAnswers, DirectionKey } from './answers';
import type { PerDirectionInputs } from '@/engine/types';
import { buildPerDirectionObservables } from './per-direction-observable';
import { deriveStatedStrength } from './stated-strength';
import { deriveFeltCost } from './felt-cost';
import { deriveSaturation } from './saturation';

export function buildPerDirections(
  _targetUser: string,
  answers: QuestionnaireAnswers,
): Record<DirectionKey, PerDirectionInputs> {
  // Compute vitality ONCE: mean of all twelve domain current_state values
  const domainValues = Object.values(answers.domain_current_state);
  const vitality = domainValues.reduce((sum, val) => sum + val, 0) / domainValues.length;

  // Get observable fields for all six directions
  const observables = buildPerDirectionObservables(answers);

  // Compose full PerDirectionInputs for each direction
  const result: Record<DirectionKey, PerDirectionInputs> = {} as Record<DirectionKey, PerDirectionInputs>;

  const directions: DirectionKey[] = [
    'contributor',
    'experience_seeker',
    'freedom_designer',
    'growth_focused',
    'creator',
    'relationship_rebuilder',
  ];

  for (const direction of directions) {
    const obs = observables[direction];

    // Compute the three derived fields from the observable slice
    const stated_strength = deriveStatedStrength(obs);
    const felt_cost = deriveFeltCost(obs, vitality);
    const saturation = deriveSaturation(obs);

    // Normalise q70_allocation to stated_allocation (£/70×100 scale)
    const rawAllocation = answers.q70_allocation[direction] ?? 0;
    const stated_allocation = (rawAllocation / 70) * 100;

    // Assemble the full PerDirectionInputs in one object literal
    result[direction] = {
      stated_strength,
      felt_cost,
      anticipation: obs.anticipation,
      current_movement: obs.current_movement,
      recent_action: obs.recent_action,
      past_presence: obs.past_presence,
      specificity: obs.specificity,
      would_reach_for: obs.would_reach_for,
      saturation,
      stopped_expecting: obs.stopped_expecting,
      stated_allocation,
    };
  }

  return result;
}
