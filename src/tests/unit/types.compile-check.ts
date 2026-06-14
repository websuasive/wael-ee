// Compile-time smoke check for engine types. Not a runtime test. Exists so pnpm typecheck exercises the type surface.

import type {
  InputMap,
  PerDirectionInputs,
  PerDomainInputs,
  EngineOutput,
  DirectionOutput,
  DomainPresenceOutput,
  ConstraintsOutput,
  CrossCuttingOutput,
} from '@/engine/types';

const sampleDirection: PerDirectionInputs = {
  stated_strength: 60,
  felt_cost: 30,
  anticipation: 'mild',
  current_movement: 40,
  recent_action: 'some',
  past_presence: 'yes',
  specificity: 'partial',
  would_reach_for: 'yes',
  saturation: 'no',
  stopped_expecting: 'no',
};

// Universal-wanting domain: `wanting` omitted (defaults to "wants" per spec).
const universalDomain: PerDomainInputs = {
  current_state: 55,
  past_presence: 'yes',
};

// Non-universal domain: `wanting` present.
const wantingDomain: PerDomainInputs = {
  current_state: 70,
  past_presence: 'yes',
  wanting: 'wants',
};

const exampleInput: InputMap = {
  directions: {
    contributor: sampleDirection,
    experience_seeker: sampleDirection,
    freedom_designer: sampleDirection,
    growth_focused: sampleDirection,
    creator: sampleDirection,
    relationship_rebuilder: sampleDirection,
  },
  cross_direction: {
    direction_chosen: 'experience_seeker',
    capacity_strain: 'no',
    life_shape_duration: 'sustained',
    week_shape: {
      work_dominates: false,
      weekends_consumed: false,
      weekly_activity: false,
      sees_people: false,
      makes_things: false,
      active_body: false,
      belongs_to_group: false,
      solo_practice: false,
      varied_week: false,
    },
    life_stage: 'drifting',
    sociality_default: 'balanced',
    paid_work_relationship: 'functional',
    primary_load: 'none',
    psychological_filtering: 'does_not_filter',
    role_consolidation: 'holds_other_selves',
    attention_pattern: 'engaged',
    relational_presence: 'present',
  },
  domains: {
    // 4 universal-wanting domains: `wanting` omitted.
    time_as_yours: universalDomain,
    energy_as_resource: universalDomain,
    felt_aliveness: universalDomain,
    body_physical_aliveness: universalDomain,
    // 7 remaining domains: `wanting` present.
    curiosity: wantingDomain,
    making: wantingDomain,
    conversation_depth: wantingDomain,
    being_known: wantingDomain,
    friendship: wantingDomain,
    intimacy: wantingDomain,
    mattering: wantingDomain,
    spiritual: wantingDomain,
  },
  constraints: {
    energy_availability: 75,
    time_availability: 50,
    body_capacity: 80,
    permission: 90,
    permission_sub_shape: 'present',
  },
  cross_cutting: {
    recent_life_shape_change: 'no',
    replacement_structure_exists: 'yes',
    recent_reaching: 'mid_stream',
  },
  self_report: {
    named_absences: [],
  },
};

const sampleDirectionOutput: DirectionOutput = {
  direction: 'contributor',
  surfaced: true,
  pull: 65,
  movement: 40,
  quadrant: 'active',
  past_relationship: 'returning',
  was_once_renders: false,
  specificity: 'partial',
  pull_quality: ['real'],
  pull_state: ['held_attributed_with_expression'],
  expression_space: 'has_space',
};

const directionOutputs: DirectionOutput[] = [
  sampleDirectionOutput,
  { ...sampleDirectionOutput, direction: 'experience_seeker', quadrant: 'blocked' },
  { ...sampleDirectionOutput, direction: 'freedom_designer', quadrant: 'habit' },
  { ...sampleDirectionOutput, direction: 'growth_focused', quadrant: 'quiet' },
  { ...sampleDirectionOutput, direction: 'creator' },
  { ...sampleDirectionOutput, direction: 'relationship_rebuilder' },
];

const sampleDomainOutput: DomainPresenceOutput = {
  domain: 'time_as_yours',
  current_state: 55,
  fires: false,
  value: 'intact',
};

const domainOutputs: DomainPresenceOutput[] = [
  sampleDomainOutput,
  { ...sampleDomainOutput, domain: 'energy_as_resource', value: 'reduced_wants_back' },
  { ...sampleDomainOutput, domain: 'felt_aliveness', value: 'reduced_at_peace' },
  { ...sampleDomainOutput, domain: 'body_physical_aliveness', value: 'wants_but_never_had' },
  { ...sampleDomainOutput, domain: 'curiosity', value: 'never_been_part_of_his_life' },
  { ...sampleDomainOutput, domain: 'making' },
  { ...sampleDomainOutput, domain: 'conversation_depth' },
  { ...sampleDomainOutput, domain: 'being_known' },
  { ...sampleDomainOutput, domain: 'friendship' },
  { ...sampleDomainOutput, domain: 'intimacy' },
  { ...sampleDomainOutput, domain: 'mattering' },
];

const constraintsOutput: ConstraintsOutput = {
  sustained_constraint_intensity: 25,
  energy: { value: 75, band: 'full', fires: false },
  time: { value: 50, band: 'moderate', fires: false },
  body_capacity: { value: 80, band: 'full', fires: false },
  permission: {
    value: 90,
    band: 'present',
    sub_shape: 'present',
    fires: false,
  },
};

const crossCuttingOutputs: CrossCuttingOutput[] = [
  { output: 'between_shapes', fires: false },
  { output: 'mid_process', fires: true },
];

const exampleOutput: EngineOutput = {
  directions: directionOutputs,
  domains: domainOutputs,
  constraints: constraintsOutput,
  cross_cutting: crossCuttingOutputs,
  cross_direction: {
    life_stage: 'drifting',
    sociality_default: 'balanced',
    paid_work_relationship: 'functional',
    primary_load: 'none',
    psychological_filtering: 'filters_some',
    role_consolidation: 'role_inflected',
    attention_pattern: 'intermittent',
    relational_presence: 'partial',
    week_shape: {
      work_dominates: false,
      weekends_consumed: false,
      weekly_activity: false,
      sees_people: false,
      makes_things: false,
      active_body: false,
      belongs_to_group: false,
      solo_practice: false,
      varied_week: false,
    },
    life_texture_band: 'empty',
    structural_narrowing_band: 'moderate',
    experiential_narrowing_band: 'moderate',
    psychological_narrowing_band: 'moderate',
    identity_narrowing_band: 'moderate',
    energetic_narrowing_band: 'moderate',
    relational_narrowing_band: 'moderate',
    attention_narrowing_band: 'moderate',
  },
};

// Reference the constants so noUnusedLocals is satisfied.
export type { };
void exampleInput;
void exampleOutput;
