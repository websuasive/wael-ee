// Direction signal scoring. Implements spec section 5.1 in full.

import type {
  InputMap,
  DirectionOutput,
  DirectionName,
  DomainName,
  DomainPresenceOutput,
  ExpressionSpaceValue,
  PerDirectionInputs,
  DirectionChoiceValue,
  QuadrantValue,
  PastRelationshipValue,
  PullQualityValue,
  PullStateValue,
} from '../types';
import {
  computeExpressionSpace,
  computeMovement,
  computePull,
} from '../derivations';

const DIRECTION_NAMES: readonly DirectionName[] = [
  'contributor',
  'creator',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'relationship_rebuilder',
];

const WAS_ONCE_DOMAIN_MAP: Record<DirectionName, DomainName[]> = {
  freedom_designer: ['time_as_yours'],
  creator: ['making'],
  experience_seeker: ['curiosity', 'felt_aliveness'],
  relationship_rebuilder: ['conversation_depth', 'being_known', 'friendship', 'intimacy'],
  growth_focused: [],
  contributor: ['mattering'],
};

function computeLivePull(
  rawPull: number,
  isGhost: boolean,
): number {
  // Ghost-labelled directions are suppressed from presentation: their live-pull is treated as non-surfacing/non-ranking
  if (isGhost) return 0;
  return rawPull;
}

function computeQuadrant(livePull: number, movement: number): QuadrantValue {
  const highPull = livePull >= 50;
  const highMovement = movement >= 50;
  if (highPull && highMovement) return 'active';
  if (highPull && !highMovement) return 'blocked';
  if (!highPull && highMovement) return 'habit';
  return 'quiet';
}

function computePastRelationship(
  livePull: number,
  pastPresence: 'yes' | 'no',
): PastRelationshipValue {
  const highPull = livePull >= 50;
  if (highPull && pastPresence === 'yes') return 'returning';
  if (highPull && pastPresence === 'no') return 'new';
  if (!highPull && pastPresence === 'yes') return 'was_once';
  return 'never_been_part_of_life';
}

function computePullState(
  d: PerDirectionInputs,
  livePull: number,
  capacityStrain: 'yes' | 'no',
  expressionSpace: ExpressionSpaceValue,
): PullStateValue[] {
  const states: PullStateValue[] = [];
  if (d.specificity === 'strong') {
    if (expressionSpace === 'has_space') {
      states.push('held_attributed_with_expression');
    } else {
      states.push('held_attributed_unexpressed');
    }
  }
  if (d.stopped_expecting === 'yes') states.push('stopped_expecting');
  if (capacityStrain === 'yes' && livePull >= 50) states.push('capacity_strain');
  return states;
}

function computeWasOnceRenders(
  direction: DirectionName,
  pastRelationship: PastRelationshipValue,
  domainOutputs: DomainPresenceOutput[],
): boolean {
  if (pastRelationship !== 'was_once') return false;
  if (direction === 'growth_focused') return true;
  const mappedDomains = WAS_ONCE_DOMAIN_MAP[direction];
  return mappedDomains.some((domainName) =>
    domainOutputs.some((o) => o.domain === domainName && o.fires),
  );
}

function computePullQuality(
  d: PerDirectionInputs,
  direction: DirectionName,
  pull: number,
  directionChosen: DirectionChoiceValue,
  lifeShapeDuration: InputMap['cross_direction']['life_shape_duration'],
  sustainedConstraintIntensity: number,
  reachRetrospective: DirectionChoiceValue | undefined,
  reachCounterfactual: DirectionChoiceValue | undefined,
): PullQualityValue[] {
  // PROVISIONAL: Phantom thresholds for stated_allocation (B1).
  // Set against the spec's described £70 normalisation (£X/70×100, single-direction ceiling ~57),
  // NOT against real respondent data. No £70 producer exists yet.
  // Recalibrate against real allocation distributions when the £70 question ships.
  // Phantom thresholds must stay BELOW the ~57 reachable ceiling.
  const ALLOCATION_PHANTOM_HIGH = 50; // dominant single-direction claim (~£35+)
  const ALLOCATION_PHANTOM_PARTIAL = 35; // meaningful non-dominant claim (~£25)
  const ALLOCATION_PHANTOM_FLOOR = 30; // gate-admission floor (~£21 stake)

  const preA = pull >= 30 || d.stated_strength >= 50 || (d.stated_allocation ?? 0) >= ALLOCATION_PHANTOM_FLOOR;
  const preB =
    d.stated_strength < 50 &&
    d.past_presence === 'yes' &&
    sustainedConstraintIntensity >= 70 &&
    lifeShapeDuration === 'long';

  if (!preA && !preB) return [];

  // Only (b) holds: only the deep sub-branch of Suppressed is evaluated.
  // (b) and the deep branch share identical conditions, so deep necessarily fires.
  if (!preA && preB) return ['suppressed' as PullQualityValue];

  // preA holds (with or without preB). All branches evaluated.
  const result: PullQualityValue[] = [];

  const saturated = d.saturation === 'yes';

  const phantom =
    (d.stated_allocation ?? 0) >= ALLOCATION_PHANTOM_HIGH &&
    d.felt_cost < 30 &&
    (d.anticipation === 'none' || d.anticipation === 'mild') &&
    d.recent_action === 'none' &&
    d.would_reach_for === 'no' &&
    d.past_presence === 'no' &&
    sustainedConstraintIntensity < 50;

  const phantomPartial =
    (d.stated_allocation ?? 0) >= ALLOCATION_PHANTOM_PARTIAL &&
    (d.stated_allocation ?? 0) < ALLOCATION_PHANTOM_HIGH &&
    d.felt_cost < 30 &&
    (d.anticipation === 'none' || d.anticipation === 'mild') &&
    d.recent_action === 'none' &&
    d.would_reach_for === 'no' &&
    d.past_presence === 'no' &&
    sustainedConstraintIntensity < 50;

  const suppressedStandard =
    d.stated_strength < 50 &&
    (d.felt_cost >= 50 || d.anticipation === 'quickening') &&
    d.past_presence === 'yes' &&
    sustainedConstraintIntensity >= 60 &&
    (lifeShapeDuration === 'sustained' || lifeShapeDuration === 'long');

  const suppressedDeep =
    d.stated_strength < 50 &&
    d.past_presence === 'yes' &&
    sustainedConstraintIntensity >= 70 &&
    lifeShapeDuration === 'long';

  const behaviourallyDivergent =
    d.stated_strength >= 60 &&
    directionChosen !== direction &&
    directionChosen !== 'none' &&
    !phantom &&
    !phantomPartial;

  // Ghost label (Step 5 — ghost build)
  // Guard: triad must be complete (both optional fields defined)
  const triadComplete =
    reachRetrospective !== undefined && reachCounterfactual !== undefined;
  const ghost =
    triadComplete &&
    d.anticipation === 'quickening' &&
    d.specificity === 'strong' &&
    direction !== directionChosen &&
    direction !== reachRetrospective &&
    direction !== reachCounterfactual;

  // Saturated is incoherent when co-firing with phantom/phantom_partial
  // (worn out on something never had). Suppress saturated in that pairing;
  // phantom is the coherent reading and survives.
  if (saturated && !phantom && !phantomPartial) result.push('saturated');
  if (phantom) result.push('phantom');
  if (phantomPartial) result.push('phantom_partial');
  if (suppressedStandard || suppressedDeep) result.push('suppressed');
  if (behaviourallyDivergent) result.push('behaviourally_divergent');
  if (ghost) result.push('ghost');

  if (result.length === 0) result.push('real');

  return result;
}

function compareByPullDesc(a: DirectionOutput, b: DirectionOutput): number {
  // Sort by live-pull (suppressed for ghost directions)
  const aLivePull = a.pull_quality.indexOf('ghost') !== -1 ? 0 : a.pull;
  const bLivePull = b.pull_quality.indexOf('ghost') !== -1 ? 0 : b.pull;
  if (bLivePull !== aLivePull) return bLivePull - aLivePull;
  return a.direction.localeCompare(b.direction);
}

function pickHighestPullAlpha(entries: DirectionOutput[]): DirectionName {
  let best = entries[0]!;
  for (const e of entries) {
    const bestLivePull = best.pull_quality.indexOf('ghost') !== -1 ? 0 : best.pull;
    const eLivePull = e.pull_quality.indexOf('ghost') !== -1 ? 0 : e.pull;
    if (eLivePull > bestLivePull) {
      best = e;
    } else if (eLivePull === bestLivePull && e.direction.localeCompare(best.direction) < 0) {
      best = e;
    }
  }
  return best.direction;
}

export function computeDirectionOutputs(
  input: InputMap,
  domainOutputs: DomainPresenceOutput[],
  sustainedConstraintIntensity: number,
): DirectionOutput[] {
  const capacityStrain = input.cross_direction.capacity_strain;
  const directionChosen = input.cross_direction.direction_chosen;
  const lifeShapeDuration = input.cross_direction.life_shape_duration;
  const reachRetrospective = input.cross_direction.reach_retrospective;
  const reachCounterfactual = input.cross_direction.reach_counterfactual;

  // First pass: compute per-direction outputs except `surfaced`.
  const partials: DirectionOutput[] = DIRECTION_NAMES.map((name) => {
    const d = input.directions[name];
    const pull = computePull(d);
    const movement = computeMovement(d);
    const pullQuality = computePullQuality(
      d,
      name,
      pull,
      directionChosen,
      lifeShapeDuration,
      sustainedConstraintIntensity,
      reachRetrospective,
      reachCounterfactual,
    );
    // Compute isGhost using the same logic as in computePullQuality
    const triadComplete =
      reachRetrospective !== undefined && reachCounterfactual !== undefined;
    const isGhost =
      triadComplete &&
      d.anticipation === 'quickening' &&
      d.specificity === 'strong' &&
      name !== directionChosen &&
      name !== reachRetrospective &&
      name !== reachCounterfactual;
    const livePull = computeLivePull(pull, isGhost);
    const quadrant = computeQuadrant(livePull, movement);
    const pastRelationship = computePastRelationship(livePull, d.past_presence);
    const wasOnceRenders = computeWasOnceRenders(
      name,
      pastRelationship,
      domainOutputs,
    );
    const expressionSpace = computeExpressionSpace(
      name,
      input.cross_direction.week_shape,
    );
    const pullState = computePullState(d, livePull, capacityStrain, expressionSpace);
    return {
      direction: name,
      surfaced: false,
      pull,
      movement,
      quadrant,
      past_relationship: pastRelationship,
      was_once_renders: wasOnceRenders,
      specificity: d.specificity,
      pull_quality: pullQuality,
      pull_state: pullState,
      expression_space: expressionSpace,
    };
  });

  // Surfacing rule (uses live-pull for ghost suppression).
  const anyOverThreshold = partials.some(
    (p) => {
      const livePull = p.pull_quality.indexOf('ghost') !== -1 ? 0 : p.pull;
      return livePull >= 50 || p.movement >= 50;
    },
  );
  if (anyOverThreshold) {
    for (const p of partials) {
      const livePull = p.pull_quality.indexOf('ghost') !== -1 ? 0 : p.pull;
      p.surfaced = livePull >= 50 || p.movement >= 50;
    }
  } else {
    const winner = pickHighestPullAlpha(partials);
    for (const p of partials) {
      p.surfaced = p.direction === winner;
    }
  }

  return partials.sort(compareByPullDesc);
}
