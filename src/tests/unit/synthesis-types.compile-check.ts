// Compile-time smoke check for synthesis types. Not a runtime test. Exists so pnpm typecheck exercises the type surface.

import type {
  RenderingInstructions,
  SlotContent,
  DirectionCardOutput,
  ChartBubble,
  ConstraintLine,
  ExperienceCandidate,
  ShapeSentence,
  CalibrationLine,
  MergedDirectionView,
} from '@/synthesis/types';

const slot = (token: string): SlotContent => ({
  interpretive_text: null,
  token_text: token,
});

const directionCards: DirectionCardOutput[] = [
  {
    direction_name: 'contributor',
    direction_engine_name: 'contributor',
    summary: slot('summary'),
    meaning_sentence: slot('meaning'),
    fields: [{ label: 'Pull', value: '65', intensity: 65 }],
    visual_state: 'named',
  },
  {
    direction_name: 'experience_seeker',
    direction_engine_name: 'experience_seeker',
    summary: slot('summary'),
    meaning_sentence: { interpretive_text: 'interp', token_text: 'token' },
    fields: [],
    visual_state: 'firing_not_named',
  },
  {
    direction_name: 'freedom_designer',
    direction_engine_name: 'freedom_designer',
    summary: slot(''),
    meaning_sentence: slot(''),
    fields: [],
    visual_state: 'not_firing',
  },
  {
    direction_name: 'growth_focused',
    direction_engine_name: 'growth_focused',
    summary: slot('g'),
    meaning_sentence: slot('g'),
    fields: [{ label: 'Movement', value: '40', intensity: null }],
    visual_state: 'named',
  },
  {
    direction_name: 'creator',
    direction_engine_name: 'creator',
    summary: slot('m'),
    meaning_sentence: slot('m'),
    fields: [],
    visual_state: 'firing_not_named',
  },
  {
    direction_name: 'relationship_rebuilder',
    direction_engine_name: 'relationship_rebuilder',
    summary: slot('r'),
    meaning_sentence: slot('r'),
    fields: [],
    visual_state: 'not_firing',
  },
];

const chartBubbles: ChartBubble[] = [
  {
    direction_name: 'contributor',
    direction_engine_name: 'contributor',
    pull: 65,
    movement: 40,
    specificity_size: 1.0,
    surfaced: true,
    pull_quality_state: 'real',
    is_desired_direction: false,
    is_named_in_headline: true,
  },
  {
    direction_name: 'experience_seeker',
    direction_engine_name: 'experience_seeker',
    pull: 70,
    movement: 20,
    specificity_size: 0.6,
    surfaced: true,
    pull_quality_state: 'phantom',
    is_desired_direction: true,
    is_named_in_headline: true,
  },
  {
    direction_name: 'freedom_designer',
    direction_engine_name: 'freedom_designer',
    pull: 30,
    movement: 10,
    specificity_size: 0.3,
    surfaced: false,
    pull_quality_state: 'empty',
    is_desired_direction: false,
    is_named_in_headline: false,
  },
  {
    direction_name: 'growth_focused',
    direction_engine_name: 'growth_focused',
    pull: 50,
    movement: 35,
    specificity_size: 0.6,
    surfaced: true,
    pull_quality_state: 'real',
    is_desired_direction: false,
    is_named_in_headline: true,
  },
  {
    direction_name: 'creator',
    direction_engine_name: 'creator',
    pull: 45,
    movement: 25,
    specificity_size: 0.3,
    surfaced: false,
    pull_quality_state: 'empty',
    is_desired_direction: false,
    is_named_in_headline: false,
  },
  {
    direction_name: 'relationship_rebuilder',
    direction_engine_name: 'relationship_rebuilder',
    pull: 55,
    movement: 30,
    specificity_size: 1.0,
    surfaced: true,
    pull_quality_state: 'suppressed',
    is_desired_direction: false,
    is_named_in_headline: true,
  },
];

const constraintLines: ConstraintLine[] = [
  {
    constraint_name: 'energy',
    constraint_engine_name: 'energy',
    band_label: 'Full',
    intensity: 80,
    sentence: { interpretive_text: null, token_text: '' },
  },
  {
    constraint_name: 'time',
    constraint_engine_name: 'time',
    band_label: 'Moderate',
    intensity: 50,
    sentence: { interpretive_text: null, token_text: '' },
  },
  {
    constraint_name: 'body_capacity',
    constraint_engine_name: 'body_capacity',
    band_label: 'Full',
    intensity: 75,
    sentence: { interpretive_text: null, token_text: '' },
  },
  {
    constraint_name: 'permission',
    constraint_engine_name: 'permission',
    band_label: 'Partial',
    intensity: 40,
    sentence: { interpretive_text: null, token_text: '' },
  },
];

const experienceCandidates: ExperienceCandidate[] = [
  {
    direction_name: 'experience_seeker',
    direction_engine_name: 'experience_seeker',
    priority: 'firing',
    pull: 72,
  },
  {
    direction_name: 'freedom_designer',
    direction_engine_name: 'freedom_designer',
    priority: 'past_presence_only',
    pull: 25,
  },
];

const example: RenderingInstructions = {
  headline: {
    direction_names: ['contributor'],
    direction_engine_names: ['contributor'],
    situation_text: null,
  },
  recognition_paragraph: slot('recognition'),
  pattern_paragraph: slot('pattern'),
  direction_cards: directionCards,
  direction_evidence_chart: {
    bubbles: chartBubbles,
    caption: slot('caption'),
  },
  domains_panel: {
    summary: slot('domains summary'),
    reduced_groups: [
      {
        value_label: 'Reduced, wants back',
        value_engine_name: 'reduced_wants_back',
        domains: [
          { domain_name: 'Energy as resource', intensity: 60 },
          { domain_name: 'Felt aliveness', intensity: 45 },
        ],
        domain_engine_names: ['energy_as_resource', 'felt_aliveness'],
      },
    ],
    intact_callout: slot('intact callout'),
  },
  constraints_panel: {
    summary: slot('constraints summary'),
    constraint_lines: constraintLines,
    sustained_constraint_intensity: 25,
    intact_callout: slot('intact'),
    permission_sub_shape_text: slot('permission sub-shape'),
  },
  cross_cutting_panel: {
    outputs: [
      {
        name: 'Between shapes',
        output_engine_name: 'between_shapes',
        fires: false,
      },
      {
        name: 'Mid-process',
        output_engine_name: 'mid_process',
        fires: true,
      },
    ],
  },
  life_texture_panel: {
    summary: slot('life texture summary'),
    band_label: 'Empty',
    flags_present: ['sees people', 'makes things'],
    flags_absent: ['work dominates', 'weekends consumed'],
    load_state_label: 'No primary load',
  },
  life_context_panel: {
    life_stage_summary: slot('life stage summary'),
    work_load_summary: slot('work load summary'),
    sociality_summary: slot('sociality summary'),
  },
  comparison_surface_panel: {
    summary: slot('comparison surface summary'),
    summary_id: null,
    confirmed: [],
    quiet: [],
    surfaced: [],
  },
  the_narrowings_panel: {
    summary: slot('narrowings summary'),
    bands: [
      { band_field: 'structural', display_name: 'Structure', full_name: 'Structural Narrowing', character_name: 'The Yes Man', band: 'moderate', intensity: 66, observation: 'Life structure is moderately constrained.' },
      { band_field: 'experiential', display_name: 'Variety', full_name: 'Experiential Narrowing', character_name: 'The Shrunk Man', band: 'moderate', intensity: 66, observation: 'Experience variety is moderately limited.' },
      { band_field: 'psychological', display_name: 'Wanting', full_name: 'Psychological Narrowing', character_name: 'The Reasonable Man', band: 'moderate', intensity: 66, observation: 'Wants and desires are moderately filtered.' },
      { band_field: 'identity', display_name: 'Identity', full_name: 'Identity Narrowing', character_name: 'The Cast Man', band: 'moderate', intensity: 66, observation: 'Identity expression is moderately constrained.' },
      { band_field: 'energetic', display_name: 'Energetic', full_name: 'Energetic Narrowing', character_name: 'The Dimmed Man', band: 'moderate', intensity: 66, observation: 'Energy availability is moderately limited.' },
      { band_field: 'relational', display_name: 'Relationships', full_name: 'Relational Narrowing', character_name: 'The Stranger', band: 'moderate', intensity: 66, observation: 'Relational capacity is moderately constrained.' },
      { band_field: 'attention', display_name: 'Attention', full_name: 'Attention Narrowing', character_name: 'The Surface Man', band: 'moderate', intensity: 66, observation: 'Attention bandwidth is moderately limited.' },
    ],
  },
  experience_candidate_directions: experienceCandidates,
};

const exampleShapeSentence: ShapeSentence = {
  id: 'example_shape_sentence',
  slot: 'pattern_paragraph',
  predicate: () => true,
  sentence: 'example sentence',
};

const exampleCalibrationLine: CalibrationLine = {
  id: 'example_calibration_line',
  predicate: () => false,
  sentence: 'calibration prefix',
  composition: 'prepend',
};

const exampleMergedDirectionView: MergedDirectionView = {
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
  stated_strength: 60,
  felt_cost: 30,
  anticipation: 'mild',
  current_movement: 40,
  recent_action: 'some',
  past_presence: 'yes',
  would_reach_for: 'yes',
  saturation: 'no',
  stopped_expecting: 'no',
};

export type {};
void example;
void exampleShapeSentence;
void exampleCalibrationLine;
void exampleMergedDirectionView;
