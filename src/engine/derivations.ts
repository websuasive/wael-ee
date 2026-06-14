// Derivations. Sourced verbatim from architecture spec section 4. Weights are first-pass and subject to calibration.

import type {
  ConstraintsOutput,
  DirectionName,
  ExpressionSpaceValue,
  InputMap,
  LifeTextureBand,
  NarrowingBand,
  PerDirectionInputs,
  WeekShapeFlags,
  DirectionChoiceValue,
} from './types';

/* ------------------------------------------------------------------ */
/* Internal categorical-to-numeric mappings (section 4.2)             */
/* ------------------------------------------------------------------ */

function anticipationToNumeric(value: PerDirectionInputs['anticipation']): number {
  switch (value) {
    case 'none':
      return 0;
    case 'mild':
      return 50;
    case 'quickening':
      return 100;
  }
}

function recentActionToNumeric(value: PerDirectionInputs['recent_action']): number {
  switch (value) {
    case 'none':
      return 0;
    case 'some':
      return 50;
    case 'recent':
      return 100;
  }
}

function specificityToNumeric(value: PerDirectionInputs['specificity']): number {
  switch (value) {
    case 'none':
      return 0;
    case 'partial':
      return 50;
    case 'strong':
      return 100;
  }
}

/* ------------------------------------------------------------------ */
/* 4.1 sustained_constraint_intensity (G3)                            */
/* ------------------------------------------------------------------ */

export function computeSustainedConstraintIntensity(
  constraints: InputMap['constraints'],
): number {
  return (
    0.2 * (100 - constraints.energy_availability) +
    0.2 * (100 - constraints.time_availability) +
    0.15 * (100 - constraints.body_capacity) +
    0.45 * (100 - constraints.permission)
  );
}

/* ------------------------------------------------------------------ */
/* 4.2 pull[d] (per direction)                                        */
/* ------------------------------------------------------------------ */

export function computePull(d: PerDirectionInputs): number {
  return (
    0.3 * d.stated_strength +
    0.2 * d.felt_cost +
    0.2 * anticipationToNumeric(d.anticipation) +
    0.2 * recentActionToNumeric(d.recent_action) +
    0.1 * specificityToNumeric(d.specificity)
  );
}

/* ------------------------------------------------------------------ */
/* 4.3 movement[d] (per direction) — identity                         */
/* ------------------------------------------------------------------ */

export function computeMovement(d: PerDirectionInputs): number {
  return d.current_movement;
}

/* ------------------------------------------------------------------ */
/* 4.4 life_texture_band (system-level, derived from week_shape)       */
/* ------------------------------------------------------------------ */

const TEXTURE_FLAGS: readonly (keyof WeekShapeFlags)[] = [
  'weekly_activity',
  'sees_people',
  'makes_things',
  'active_body',
  'belongs_to_group',
  'solo_practice',
];

const LOAD_FLAGS: readonly (keyof WeekShapeFlags)[] = [
  'work_dominates',
  'weekends_consumed',
];

export function computeLifeTextureBand(week: WeekShapeFlags): LifeTextureBand {
  const textureCount = TEXTURE_FLAGS.reduce(
    (n, flag) => (week[flag] ? n + 1 : n),
    0,
  );
  const pressureCount = LOAD_FLAGS.reduce(
    (n, flag) => (week[flag] ? n + 1 : n),
    0,
  );
  if (textureCount === 0 && pressureCount === 0) return 'empty';
  if (textureCount === 0 && pressureCount >= 1) return 'depleted';
  if (textureCount >= 4) return 'textured';
  // 1 <= textureCount <= 3
  return 'mixed';
}

/* ------------------------------------------------------------------ */
/* 4.5 expression_space[d] (per direction, derived from week_shape)    */
/* ------------------------------------------------------------------ */

export function computeExpressionSpace(
  direction: DirectionName,
  week: WeekShapeFlags,
): ExpressionSpaceValue {
  let has = false;
  switch (direction) {
    case 'creator':
      has = week.makes_things;
      break;
    case 'relationship_rebuilder':
      has = week.sees_people;
      break;
    case 'experience_seeker':
      has = week.weekly_activity && week.varied_week;
      break;
    case 'freedom_designer':
      has =
        week.solo_practice ||
        (!week.work_dominates && !week.weekends_consumed);
      break;
    case 'growth_focused':
      has = week.active_body || week.weekly_activity;
      break;
    case 'contributor':
      has = week.belongs_to_group || week.sees_people;
      break;
  }
  return has ? 'has_space' : 'no_space';
}

/* ------------------------------------------------------------------ */
/* 4.6 Narrowing bands (v4 — seven leaf derivations)                  */
/* ------------------------------------------------------------------ */
/* Convention (per §4.6 note): domain.fires === true means reduced;   */
/* domain.fires === false means intact. Default for every band is     */
/* 'moderate' if neither high nor low predicates fire.                */

function countLoadFlags(week: WeekShapeFlags): number {
  return (week.work_dominates ? 1 : 0) + (week.weekends_consumed ? 1 : 0);
}

/** §4.6.1 — structural_narrowing_band. */
export function computeStructuralNarrowingBand(args: {
  week_shape: WeekShapeFlags;
  primary_load: InputMap['cross_direction']['primary_load'];
  life_stage: InputMap['cross_direction']['life_stage'];
  life_shape_duration: InputMap['cross_direction']['life_shape_duration'];
  time_band: ConstraintsOutput['time']['band'];
  permission_sub_shape: InputMap['constraints']['permission_sub_shape'];
}): NarrowingBand {
  const load_flag_count = countLoadFlags(args.week_shape);
  const isLoadPrimary =
    args.primary_load === 'paid_work' ||
    args.primary_load === 'caregiving' ||
    args.primary_load === 'household_admin';
  const enduringLong =
    args.life_stage === 'enduring' && args.life_shape_duration === 'long';

  const high =
    load_flag_count === 2 &&
    args.time_band === 'heavy_time_pressure' &&
    isLoadPrimary &&
    (args.permission_sub_shape === 'act_block' || enduringLong);

  if (high) return 'high';

  const low =
    load_flag_count === 0 &&
    args.time_band === 'open' &&
    args.primary_load === 'none';

  if (low) return 'low';

  // moderate: explicit per spec; the OR-NOT-high clause covers any case
  // where some structural load exists but the high compound has not fired.
  const moderateExplicit =
    load_flag_count >= 1 &&
    (args.time_band === 'moderate' || args.time_band === 'heavy_time_pressure') &&
    args.primary_load !== 'none';
  const moderateFallback = load_flag_count >= 1 || args.primary_load !== 'none';

  if (moderateExplicit || moderateFallback) return 'moderate';
  return 'moderate';
}

const CONTENTS_FLAGS: readonly (keyof WeekShapeFlags)[] = [
  'weekly_activity',
  'sees_people',
  'makes_things',
  'active_body',
  'belongs_to_group',
  'solo_practice',
];

function countContentsFlags(week: WeekShapeFlags): number {
  return CONTENTS_FLAGS.reduce((n, f) => (week[f] ? n + 1 : n), 0);
}

/** §4.6.2 — experiential_narrowing_band. */
export function computeExperientialNarrowingBand(args: {
  week_shape: WeekShapeFlags;
  life_texture_band: LifeTextureBand;
  experience_pull: number;
}): NarrowingBand {
  const contents_flag_count = countContentsFlags(args.week_shape);
  const varied = args.week_shape.varied_week;

  const high =
    (args.life_texture_band === 'empty' || args.life_texture_band === 'depleted') &&
    contents_flag_count <= 1 &&
    varied === false &&
    args.experience_pull < 30;

  if (high) return 'high';

  // Lock-time Option B: moderate gates on varied_week === false.
  const moderate =
    varied === false &&
    (args.life_texture_band === 'mixed' ||
      (contents_flag_count >= 2 && contents_flag_count <= 3) ||
      args.experience_pull < 50);

  if (moderate) return 'moderate';

  const low =
    args.life_texture_band === 'textured' ||
    contents_flag_count >= 4 ||
    varied === true;

  if (low) return 'low';
  return 'moderate';
}

/** §4.6.3 — psychological_narrowing_band. The two count inputs (specificity_none,
 *  suppressed) are computed by the caller from raw direction inputs + direction
 *  outputs, because direction_specificity_none_count reads `would_reach_for` from
 *  the InputMap and direction_suppressed_count reads `pull_quality` from the
 *  DirectionOutput. */
export function computePsychologicalNarrowingBand(args: {
  psychological_filtering: InputMap['cross_direction']['psychological_filtering'];
  permission_sub_shape: InputMap['constraints']['permission_sub_shape'];
  direction_specificity_none_count: number;
  direction_suppressed_count: number;
  curiosity_fires: boolean;
}): NarrowingBand {
  const pf = args.psychological_filtering;
  const noneCount = args.direction_specificity_none_count;
  const suppCount = args.direction_suppressed_count;

  // Note: if pf === 'filters_pervasively' the first clause fires; the third
  // clause only matters for pf === 'filters_some' (TS narrows accordingly).
  const high =
    pf === 'filters_pervasively' ||
    args.permission_sub_shape === 'want_block' ||
    (noneCount >= 4 && pf === 'filters_some');

  if (high) return 'high';

  const moderate =
    pf === 'filters_some' ||
    (args.permission_sub_shape === 'say_block' && suppCount >= 2) ||
    args.curiosity_fires === true ||
    (noneCount >= 3 && pf === 'does_not_filter');

  if (moderate) return 'moderate';

  // Project-lead-authorised narrow correction (Chunk 1D-finalise, Option D):
  // the original spec text excluded both want_block and say_block from low.
  // Architecturally, want_block blocks wanting at the want-formation level
  // (contradicts low psychological narrowing); say_block blocks articulation
  // rather than wanting itself, so does_not_filter + say_block + low outcome
  // signal reads as low psychological narrowing (the wanting is not running
  // through a filter; he is simply not saying it). Resolves the Hugh §4.6.3
  // worked-example internal inconsistency surfaced at Chunk 1D verification.
  const low =
    pf === 'does_not_filter' &&
    args.permission_sub_shape !== 'want_block' &&
    noneCount < 3;

  if (low) return 'low';
  return 'moderate';
}

/** §4.6.4 — identity_narrowing_band. */
export function computeIdentityNarrowingBand(args: {
  role_consolidation: InputMap['cross_direction']['role_consolidation'];
  paid_work_relationship: InputMap['cross_direction']['paid_work_relationship'];
  life_stage: InputMap['cross_direction']['life_stage'];
  life_shape_duration: InputMap['cross_direction']['life_shape_duration'];
}): NarrowingBand {
  const rc = args.role_consolidation;
  const pwr = args.paid_work_relationship;

  // Note: rc === 'role_consolidated' already fires high via the first clause;
  // the compound branch only needs to read rc === 'role_inflected'.
  const high =
    rc === 'role_consolidated' ||
    (pwr === 'defining' && rc === 'role_inflected');

  if (high) return 'high';

  const enduringLong =
    args.life_stage === 'enduring' && args.life_shape_duration === 'long';
  const pwrCompound =
    pwr === 'defining' || pwr === 'consuming' || pwr === 'endured';

  const moderate = rc === 'role_inflected' || (pwrCompound && enduringLong);

  if (moderate) return 'moderate';

  const stageOk =
    args.life_stage === 'transitioning' ||
    args.life_stage === 're_evaluating' ||
    args.life_stage === 'drifting' ||
    args.life_stage === 'building';

  const low = rc === 'holds_other_selves' && (pwr !== 'defining' || stageOk);

  if (low) return 'low';
  return 'moderate';
}

/** §4.6.5 — energetic_narrowing_band. */
export function computeEnergeticNarrowingBand(args: {
  energy_band: ConstraintsOutput['energy']['band'];
  body_band: ConstraintsOutput['body_capacity']['band'];
  felt_aliveness_fires: boolean;
  energy_as_resource_fires: boolean;
  life_texture_band: LifeTextureBand;
}): NarrowingBand {
  const high =
    args.energy_band === 'heavy_depletion' &&
    args.felt_aliveness_fires === true &&
    args.energy_as_resource_fires === true;

  if (high) return 'high';

  const moderate =
    (args.energy_band === 'moderate' &&
      (args.felt_aliveness_fires === true ||
        args.energy_as_resource_fires === true)) ||
    args.life_texture_band === 'depleted' ||
    (args.body_band === 'limited' && args.felt_aliveness_fires === false);

  if (moderate) return 'moderate';

  const low =
    args.energy_band === 'full' &&
    args.felt_aliveness_fires === false &&
    args.body_band !== 'limited';

  if (low) return 'low';
  return 'moderate';
}

/** §4.6.6 — relational_narrowing_band. */
export function computeRelationalNarrowingBand(args: {
  friendship_fires: boolean;
  intimacy_fires: boolean;
  conversation_depth_fires: boolean;
  being_known_fires: boolean;
  sociality_default: InputMap['cross_direction']['sociality_default'];
  sees_people: boolean;
  belongs_to_group: boolean;
  relational_presence: InputMap['cross_direction']['relational_presence'];
}): NarrowingBand {
  const reducedCount =
    (args.friendship_fires ? 1 : 0) +
    (args.intimacy_fires ? 1 : 0) +
    (args.conversation_depth_fires ? 1 : 0) +
    (args.being_known_fires ? 1 : 0);

  const high =
    reducedCount >= 3 &&
    (args.sees_people === false || args.relational_presence === 'mostly_absent');

  if (high) return 'high';

  const moderate =
    (reducedCount >= 1 && reducedCount <= 2) ||
    args.relational_presence === 'partial' ||
    (args.sees_people === false && reducedCount >= 1);

  if (moderate) return 'moderate';

  const low = reducedCount === 0 && args.relational_presence === 'present';

  if (low) return 'low';
  return 'moderate';
}

/** §4.6.7 — attention_narrowing_band. */
export function computeAttentionNarrowingBand(args: {
  attention_pattern: InputMap['cross_direction']['attention_pattern'];
  felt_aliveness_fires: boolean;
  varied_week: boolean;
  experience_pull: number;
}): NarrowingBand {
  const ap = args.attention_pattern;
  const fa = args.felt_aliveness_fires;

  const high = ap === 'autopilot' && fa === true;
  if (high) return 'high';

  const moderate =
    ap === 'intermittent' ||
    (ap === 'autopilot' && fa === false) ||
    (ap === 'engaged' && fa === true);
  if (moderate) return 'moderate';

  const low = ap === 'engaged' && fa === false;
  if (low) return 'low';
  return 'moderate';
}

/* ------------------------------------------------------------------ */
/* Reach triad computations (Step 5 — ghost build)                    */
/* ------------------------------------------------------------------ */

/** Helper: check if a DirectionChoiceValue is a direction (not rest/none). */
function isDirection(value: DirectionChoiceValue): boolean {
  return (
    value === 'contributor' ||
    value === 'creator' ||
    value === 'experience_seeker' ||
    value === 'freedom_designer' ||
    value === 'growth_focused' ||
    value === 'relationship_rebuilder'
  );
}

/** Compute reach_confidence from the three triad fields in InputMap.
 * Reproduces the assembler's checkTriad branch logic verbatim.
 * Incomplete triad (either optional field undefined) -> 'low' (under-determined).
 */
export function computeReachConfidence(
  direction_chosen: DirectionChoiceValue,
  reach_retrospective: DirectionChoiceValue | undefined,
  reach_counterfactual: DirectionChoiceValue | undefined,
): 'high' | 'low' | null {
  // Guard for incomplete triad
  if (reach_retrospective === undefined || reach_counterfactual === undefined) {
    return 'low';
  }

  // Branch 1: all three are the same direction
  if (
    isDirection(direction_chosen) &&
    isDirection(reach_retrospective) &&
    isDirection(reach_counterfactual) &&
    direction_chosen === reach_retrospective &&
    direction_chosen === reach_counterfactual
  ) {
    return 'high';
  }

  // Branch 2: all three in {rest, none}
  if (
    !isDirection(direction_chosen) &&
    !isDirection(reach_retrospective) &&
    !isDirection(reach_counterfactual)
  ) {
    return 'high';
  }

  // Branch 3: Q10a in {rest,none} AND (Q10b or Q10c is a direction)
  if (
    !isDirection(direction_chosen) &&
    (isDirection(reach_retrospective) || isDirection(reach_counterfactual))
  ) {
    return 'low';
  }

  // Branch 4: three different directions
  if (
    isDirection(direction_chosen) &&
    isDirection(reach_retrospective) &&
    isDirection(reach_counterfactual) &&
    direction_chosen !== reach_retrospective &&
    direction_chosen !== reach_counterfactual &&
    reach_retrospective !== reach_counterfactual
  ) {
    return 'low';
  }

  // OTHERWISE: Q10 names a direction with partial (non-unanimous) corroboration
  return 'low';
}

/** Compute reach_state from the three triad fields in InputMap.
 * Incomplete triad (either optional field undefined) -> null (cannot determine).
 */
export function computeReachState(
  direction_chosen: DirectionChoiceValue,
  reach_retrospective: DirectionChoiceValue | undefined,
  reach_counterfactual: DirectionChoiceValue | undefined,
): 'numb' | 'buried_but_alive' | 'surfaced' | null {
  // Guard for incomplete triad
  if (reach_retrospective === undefined || reach_counterfactual === undefined) {
    return null;
  }

  // all three in {rest, none} -> 'numb'
  if (
    !isDirection(direction_chosen) &&
    !isDirection(reach_retrospective) &&
    !isDirection(reach_counterfactual)
  ) {
    return 'numb';
  }

  // Q10a in {rest, none} but reach_retrospective OR reach_counterfactual names a direction
  // -> 'buried_but_alive'
  if (
    !isDirection(direction_chosen) &&
    (isDirection(reach_retrospective) || isDirection(reach_counterfactual))
  ) {
    return 'buried_but_alive';
  }

  // otherwise -> 'surfaced'
  return 'surfaced';
}
