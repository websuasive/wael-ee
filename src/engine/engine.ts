// Engine entry point. Validates input then orchestrates the four scoring modules per spec section 7's computation order.

import type { EngineOutput, InputMap } from './types';
import type { ValidationError } from './validation';
import { validateInputMap } from './validation';
import {
  computeAttentionNarrowingBand,
  computeEnergeticNarrowingBand,
  computeExperientialNarrowingBand,
  computeIdentityNarrowingBand,
  computeLifeTextureBand,
  computePsychologicalNarrowingBand,
  computeReachConfidence,
  computeReachState,
  computeRelationalNarrowingBand,
  computeStructuralNarrowingBand,
  computeSustainedConstraintIntensity,
} from './derivations';
import { computeDomainPresenceOutputs } from './scoring/domainPresence';
import { computeDirectionOutputs } from './scoring/direction';
import { computeRealisticConstraintsOutputs } from './scoring/realisticConstraints';
import { computeCrossCuttingOutputs } from './scoring/crossCutting';

export type EngineResult =
  | { ok: true; output: EngineOutput }
  | { ok: false; errors: ValidationError[] };

function runEngineOnValidatedInput(input: InputMap): EngineOutput {
  // §7 step 2.
  const sci = computeSustainedConstraintIntensity(input.constraints);
  // §7 step 3a: cross-direction architectural inputs read directly (pass-through below).
  // §7 step 3b: life_texture_band derived from week_shape.
  const lifeTextureBand = computeLifeTextureBand(input.cross_direction.week_shape);
  // §7 step 3c: expression_space[d] derived inside computeDirectionOutputs.
  // §7 step 3d: self_report read directly; engine performs no further computation
  // over it after validation. (Validation performed in validateInputMap.)
  const domains = computeDomainPresenceOutputs(input);
  const constraints = computeRealisticConstraintsOutputs(input, sci);
  // §7 step 6: direction signal (now reads expression_space).
  const directions = computeDirectionOutputs(input, domains, sci);
  // §7 step 7: cross-cutting outputs.
  const cross_cutting = computeCrossCuttingOutputs(input, directions);
  // §7 steps 6b-6h: seven narrowing band leaf derivations (any order).
  const cd = input.cross_direction;
  const experienceDirInput = input.directions.experience_seeker;
  const experienceDirOutput = directions.find((d) => d.direction === 'experience_seeker');
  const experiencePull = experienceDirOutput ? experienceDirOutput.pull : 0;
  // direction_specificity_none_count: directions where input specificity == 'none'.
  const directionNames = ['contributor', 'creator', 'experience_seeker', 'freedom_designer', 'growth_focused', 'relationship_rebuilder'] as const;
  let specificityNoneCount = 0;
  for (const name of directionNames) {
    const d = input.directions[name];
    if (d.specificity === 'none') specificityNoneCount += 1;
  }
  // direction_suppressed_count: directions whose engine pull_quality contains 'suppressed'.
  let suppressedCount = 0;
  for (const d of directions) {
    if (d.pull_quality.includes('suppressed')) suppressedCount += 1;
  }
  // Domain fires lookups.
  const findDomain = (n: string) => domains.find((d) => d.domain === n);
  const feltAlivenessFires = findDomain('felt_aliveness')?.fires === true;
  const energyAsResourceFires = findDomain('energy_as_resource')?.fires === true;
  const curiosityFires = findDomain('curiosity')?.fires === true;
  const friendshipFires = findDomain('friendship')?.fires === true;
  const intimacyFires = findDomain('intimacy')?.fires === true;
  const conversationDepthFires = findDomain('conversation_depth')?.fires === true;
  const beingKnownFires = findDomain('being_known')?.fires === true;
  void experienceDirInput;

  const structural_narrowing_band = computeStructuralNarrowingBand({
    week_shape: cd.week_shape,
    primary_load: cd.primary_load,
    life_stage: cd.life_stage,
    life_shape_duration: cd.life_shape_duration,
    time_band: constraints.time.band,
    permission_sub_shape: input.constraints.permission_sub_shape,
  });
  const experiential_narrowing_band = computeExperientialNarrowingBand({
    week_shape: cd.week_shape,
    life_texture_band: lifeTextureBand,
    experience_pull: experiencePull,
  });
  const psychological_narrowing_band = computePsychologicalNarrowingBand({
    psychological_filtering: cd.psychological_filtering,
    permission_sub_shape: input.constraints.permission_sub_shape,
    direction_specificity_none_count: specificityNoneCount,
    direction_suppressed_count: suppressedCount,
    curiosity_fires: curiosityFires,
  });
  const identity_narrowing_band = computeIdentityNarrowingBand({
    role_consolidation: cd.role_consolidation,
    paid_work_relationship: cd.paid_work_relationship,
    life_stage: cd.life_stage,
    life_shape_duration: cd.life_shape_duration,
  });
  const energetic_narrowing_band = computeEnergeticNarrowingBand({
    energy_band: constraints.energy.band,
    body_band: constraints.body_capacity.band,
    felt_aliveness_fires: feltAlivenessFires,
    energy_as_resource_fires: energyAsResourceFires,
    life_texture_band: lifeTextureBand,
  });
  const relational_narrowing_band = computeRelationalNarrowingBand({
    friendship_fires: friendshipFires,
    intimacy_fires: intimacyFires,
    conversation_depth_fires: conversationDepthFires,
    being_known_fires: beingKnownFires,
    sociality_default: cd.sociality_default,
    sees_people: cd.week_shape.sees_people,
    belongs_to_group: cd.week_shape.belongs_to_group,
    relational_presence: cd.relational_presence,
  });
  const attention_narrowing_band = computeAttentionNarrowingBand({
    attention_pattern: cd.attention_pattern,
    felt_aliveness_fires: feltAlivenessFires,
    varied_week: cd.week_shape.varied_week,
    experience_pull: experiencePull,
  });

  // §6.1a: cross_direction output (pass-through architectural inputs + life_texture_band + bands).
  // Step 5 — ghost build: compute reach_confidence and reach_state from triad fields.
  const reach_confidence = computeReachConfidence(
    cd.direction_chosen,
    cd.reach_retrospective,
    cd.reach_counterfactual,
  );
  const reach_state = computeReachState(
    cd.direction_chosen,
    cd.reach_retrospective,
    cd.reach_counterfactual,
  );

  const cross_direction = {
    life_stage: cd.life_stage,
    sociality_default: cd.sociality_default,
    paid_work_relationship: cd.paid_work_relationship,
    primary_load: cd.primary_load,
    psychological_filtering: cd.psychological_filtering,
    role_consolidation: cd.role_consolidation,
    attention_pattern: cd.attention_pattern,
    relational_presence: cd.relational_presence,
    week_shape: cd.week_shape,
    life_texture_band: lifeTextureBand,
    structural_narrowing_band,
    experiential_narrowing_band,
    psychological_narrowing_band,
    identity_narrowing_band,
    energetic_narrowing_band,
    relational_narrowing_band,
    attention_narrowing_band,
    reach_state,
    reach_confidence,
  };
  return { directions, domains, constraints, cross_cutting, cross_direction };
}

export function runEngine(input: unknown): EngineResult {
  const validation = validateInputMap(input);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }
  return { ok: true, output: runEngineOnValidatedInput(validation.value) };
}
