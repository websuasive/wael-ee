// Engine type contract. Sourced verbatim from architecture spec sections 3.1 (InputMap) and 6.6 (EngineOutput). Do not modify without updating the spec.

/* ------------------------------------------------------------------ */
/* Input contract — section 3.1                                       */
/* ------------------------------------------------------------------ */

/** Section 3.1 — Input map structure. */
export type InputMap = {
  directions: {
    contributor: PerDirectionInputs;
    creator: PerDirectionInputs;
    experience_seeker: PerDirectionInputs;
    freedom_designer: PerDirectionInputs;
    growth_focused: PerDirectionInputs;
    relationship_rebuilder: PerDirectionInputs;
  };
  cross_direction: {
    direction_chosen: DirectionChoiceValue;
    capacity_strain: 'no' | 'yes';
    life_shape_duration: 'recent' | 'sustained' | 'long';
    week_shape: WeekShapeFlags;
    life_stage: LifeStageValue;
    sociality_default: SocialityValue;
    paid_work_relationship: PaidWorkRelationshipValue;
    primary_load: PrimaryLoadValue;
    psychological_filtering: 'does_not_filter' | 'filters_some' | 'filters_pervasively';
    role_consolidation: 'holds_other_selves' | 'role_inflected' | 'role_consolidated';
    attention_pattern: 'engaged' | 'intermittent' | 'autopilot';
    relational_presence: 'present' | 'partial' | 'mostly_absent' | 'no_close_relationship';
    reach_retrospective?: DirectionChoiceValue; // optional: Q10b observation
    reach_counterfactual?: DirectionChoiceValue; // optional: Q10c observation
  };
  domains: {
    time_as_yours: PerDomainInputs;
    energy_as_resource: PerDomainInputs;
    felt_aliveness: PerDomainInputs;
    body_physical_aliveness: PerDomainInputs;
    curiosity: PerDomainInputs;
    making: PerDomainInputs;
    conversation_depth: PerDomainInputs;
    being_known: PerDomainInputs;
    friendship: PerDomainInputs;
    intimacy: PerDomainInputs;
    mattering: PerDomainInputs;
    spiritual: PerDomainInputs;
  };
  constraints: {
    energy_availability: number;
    time_availability: number;
    body_capacity: number;
    permission: number;
    permission_sub_shape: 'present' | 'want_block' | 'say_block' | 'act_block';
  };
  cross_cutting: {
    recent_life_shape_change: 'yes' | 'no';
    replacement_structure_exists: 'yes' | 'no';
    recent_reaching:
      | 'recent_and_awkward'
      | 'mid_stream'
      | 'long_established'
      | 'no_current_reaching';
  };
  self_report: SelfReport;
};

/** Section 3.1 (amendment) — week_shape flags. */
export type WeekShapeFlags = {
  work_dominates: boolean;
  weekends_consumed: boolean;
  weekly_activity: boolean;
  sees_people: boolean;
  makes_things: boolean;
  active_body: boolean;
  belongs_to_group: boolean;
  solo_practice: boolean;
  varied_week: boolean;
};

/** Section 3.4.3 — life_stage enum. */
export type LifeStageValue =
  | 'building'
  | 'consolidating'
  | 're_evaluating'
  | 'transitioning'
  | 'settled'
  | 'drifting'
  | 'enduring';

/** Section 3.4 — sociality_default enum. */
export type SocialityValue =
  | 'solitary_by_default'
  | 'balanced'
  | 'social_by_default';

/** Section 3.4.2 — paid_work_relationship enum. */
export type PaidWorkRelationshipValue =
  | 'defining'
  | 'consuming'
  | 'functional'
  | 'peripheral'
  | 'between'
  | 'chosen'
  | 'endured';

/** Section 3.4.2 — primary_load enum. */
export type PrimaryLoadValue =
  | 'paid_work'
  | 'caregiving'
  | 'household_admin'
  | 'none';

/** Section 3.1 (amendment) — self-report channel. Engine reads for validation only. */
export type SelfReport = {
  named_absences: SelfReportItemId[];
};

export type SelfReportItemId =
  | 'more_friends'
  | 'more_time_to_myself'
  | 'something_just_for_me'
  | 'more_energy'
  | 'getting_back_in_shape'
  | 'something_to_look_forward_to'
  | 'proper_conversation'
  | 'building_or_making'
  | 'something_im_part_of'
  | 'nothing_really';

/** Section 3.1 — Per-direction inputs. */
export type PerDirectionInputs = {
  stated_strength: number;
  felt_cost: number;
  anticipation: 'none' | 'mild' | 'quickening';
  current_movement: number;
  recent_action: 'none' | 'some' | 'recent';
  past_presence: 'yes' | 'no';
  specificity: 'none' | 'partial' | 'strong';
  would_reach_for: 'yes' | 'no';
  saturation: 'yes' | 'no';
  stopped_expecting: 'yes' | 'no';
  stated_allocation?: number; // optional: proportional allocation (0-100)
};

/** Section 3.1 — Per-domain inputs. `wanting` is optional for the four universal-wanting domains. */
export type PerDomainInputs = {
  current_state: number;
  past_presence: 'yes' | 'no';
  wanting?: 'wants' | 'doesnt_want';
  peace_discriminator?: 'made_peace' | 'still_misses'; // optional: B9 field for with-history reduced domains
};

/** Section 3.1 — Direction choice value. */
export type DirectionChoiceValue =
  | 'contributor'
  | 'creator'
  | 'experience_seeker'
  | 'freedom_designer'
  | 'growth_focused'
  | 'relationship_rebuilder'
  | 'rest'
  | 'none';

/* ------------------------------------------------------------------ */
/* Output contract — section 6.6                                      */
/* ------------------------------------------------------------------ */

/** Section 6.6 — Engine output object structure. */
export type EngineOutput = {
  directions: DirectionOutput[];
  domains: DomainPresenceOutput[];
  constraints: ConstraintsOutput;
  cross_cutting: CrossCuttingOutput[];
  cross_direction: CrossDirectionOutput;
};

/** Section 6.1a (amendment) — cross-direction output (architectural inputs + life_texture_band). */
export type CrossDirectionOutput = {
  life_stage: LifeStageValue;
  sociality_default: SocialityValue;
  paid_work_relationship: PaidWorkRelationshipValue;
  primary_load: PrimaryLoadValue;
  psychological_filtering: 'does_not_filter' | 'filters_some' | 'filters_pervasively';
  role_consolidation: 'holds_other_selves' | 'role_inflected' | 'role_consolidated';
  attention_pattern: 'engaged' | 'intermittent' | 'autopilot';
  relational_presence: 'present' | 'partial' | 'mostly_absent' | 'no_close_relationship';
  week_shape: WeekShapeFlags;
  life_texture_band: LifeTextureBand;
  structural_narrowing_band: NarrowingBand;
  experiential_narrowing_band: NarrowingBand;
  psychological_narrowing_band: NarrowingBand;
  identity_narrowing_band: NarrowingBand;
  energetic_narrowing_band: NarrowingBand;
  relational_narrowing_band: NarrowingBand;
  attention_narrowing_band: NarrowingBand;
  reach_state?: 'numb' | 'buried_but_alive' | 'surfaced' | null;
  reach_confidence?: 'high' | 'low' | null;
};

export type NarrowingBand = 'low' | 'moderate' | 'high';

export type LifeTextureBand = 'empty' | 'depleted' | 'mixed' | 'textured';

/** Section 6.6 — Direction output entry. */
export type DirectionOutput = {
  direction: DirectionName;
  surfaced: boolean;
  pull: number;
  movement: number;
  quadrant: QuadrantValue;
  past_relationship: PastRelationshipValue;
  was_once_renders: boolean;
  specificity: SpecificityValue;
  pull_quality: PullQualityValue[];
  pull_state: PullStateValue[];
  expression_space: ExpressionSpaceValue;
};

export type ExpressionSpaceValue = 'has_space' | 'no_space';

export type DirectionName =
  | 'contributor'
  | 'creator'
  | 'experience_seeker'
  | 'freedom_designer'
  | 'growth_focused'
  | 'relationship_rebuilder';

export type QuadrantValue = 'active' | 'blocked' | 'habit' | 'quiet';

export type PastRelationshipValue =
  | 'returning'
  | 'new'
  | 'was_once'
  | 'never_been_part_of_life';

export type SpecificityValue = 'none' | 'partial' | 'strong';

export type PullQualityValue =
  | 'real'
  | 'saturated'
  | 'phantom'
  | 'phantom_partial'
  | 'suppressed'
  | 'behaviourally_divergent'
  | 'ghost';

export type PullStateValue =
  | 'held_attributed_with_expression'
  | 'held_attributed_unexpressed'
  | 'stopped_expecting'
  | 'capacity_strain';

/** Section 6.6 — Domain presence output entry. */
export type DomainPresenceOutput = {
  domain: DomainName;
  current_state: number;
  fires: boolean;
  value: DomainPresenceValue;
};

export type DomainName =
  | 'time_as_yours'
  | 'energy_as_resource'
  | 'felt_aliveness'
  | 'body_physical_aliveness'
  | 'curiosity'
  | 'making'
  | 'conversation_depth'
  | 'being_known'
  | 'friendship'
  | 'intimacy'
  | 'mattering'
  | 'spiritual';

export type DomainPresenceValue =
  | 'intact'
  | 'reduced_wants_back'
  | 'reduced_at_peace'
  | 'wants_but_never_had'
  | 'never_been_part_of_his_life';

/** Section 6.6 — Constraints output. */
export type ConstraintsOutput = {
  sustained_constraint_intensity: number;
  energy: { value: number; band: EnergyBand; fires: boolean };
  time: { value: number; band: TimeBand; fires: boolean };
  body_capacity: { value: number; band: BodyBand; fires: boolean };
  permission: {
    value: number;
    band: PermissionBand;
    sub_shape: PermissionSubShape;
    fires: boolean;
  };
};

export type EnergyBand = 'full' | 'moderate' | 'heavy_depletion';
export type TimeBand = 'open' | 'moderate' | 'heavy_time_pressure';
export type BodyBand = 'full' | 'shifted' | 'limited';
export type PermissionBand = 'present' | 'partial' | 'blocked';
export type PermissionSubShape =
  | 'present'
  | 'want_block'
  | 'say_block'
  | 'act_block';

/** Section 6.6 — Cross-cutting output entry. */
export type CrossCuttingOutput = {
  output: CrossCuttingName;
  fires: boolean;
};

export type CrossCuttingName =
  | 'between_shapes'
  | 'mid_process';
