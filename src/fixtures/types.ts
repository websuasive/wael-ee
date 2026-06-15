// Fixture types: engine-side and synthesis-side assertion languages, Fixture shape, load errors. Pure types.

import type { InputMap } from '../engine/types';

// --- Matchers ---

export type RangeMatcher = { between: [number, number] };
export type ContainsMatcher = { contains: unknown[] };
export type EqualsMatcher = { equals: unknown[] };
export type Matcher = RangeMatcher | ContainsMatcher | EqualsMatcher;

// AssertionValue: a bare value (deep-equality) or a Matcher.
// Typed as unknown because JSON-loaded values don't carry compile-time guarantees.
export type AssertionValue = unknown;

// --- Per-output assertion shapes ---

export type ExpectedDirectionAssertions = {
  direction?: AssertionValue;
  surfaced?: AssertionValue;
  pull?: AssertionValue;
  movement?: AssertionValue;
  quadrant?: AssertionValue;
  past_relationship?: AssertionValue;
  was_once_renders?: AssertionValue;
  specificity?: AssertionValue;
  pull_quality?: AssertionValue;
  pull_state?: AssertionValue;
  expression_space?: AssertionValue;
};

// §6.1a — CrossDirectionOutput assertion shape.
export type ExpectedCrossDirectionAssertions = {
  life_stage?: AssertionValue;
  sociality_default?: AssertionValue;
  paid_work_relationship?: AssertionValue;
  primary_load?: AssertionValue;
  week_shape?: AssertionValue;
  life_texture_band?: AssertionValue;
  structural_narrowing_band?: AssertionValue;
  experiential_narrowing_band?: AssertionValue;
  psychological_narrowing_band?: AssertionValue;
  identity_narrowing_band?: AssertionValue;
  energetic_narrowing_band?: AssertionValue;
  relational_narrowing_band?: AssertionValue;
  attention_narrowing_band?: AssertionValue;
};

export type ExpectedDomainAssertions = {
  domain?: AssertionValue;
  current_state?: AssertionValue;
  fires?: AssertionValue;
  value?: AssertionValue;
};

export type ExpectedConstraintBandAssertions = {
  value?: AssertionValue;
  band?: AssertionValue;
  fires?: AssertionValue;
};

export type ExpectedPermissionAssertions = {
  value?: AssertionValue;
  band?: AssertionValue;
  fires?: AssertionValue;
  sub_shape?: AssertionValue;
};

export type ExpectedConstraintsAssertions = {
  sustained_constraint_intensity?: AssertionValue;
  energy?: ExpectedConstraintBandAssertions;
  time?: ExpectedConstraintBandAssertions;
  body_capacity?: ExpectedConstraintBandAssertions;
  permission?: ExpectedPermissionAssertions;
};

export type ExpectedCrossCuttingAssertions = {
  output?: AssertionValue;
  fires?: AssertionValue;
};

// --- Top-level expected.json shape ---

export type ExpectedAssertions = {
  directions?: { [direction: string]: ExpectedDirectionAssertions };
  domains?: { [domain: string]: ExpectedDomainAssertions };
  constraints?: ExpectedConstraintsAssertions;
  cross_cutting?: { [name: string]: ExpectedCrossCuttingAssertions };
  cross_direction?: ExpectedCrossDirectionAssertions;
};

// --- Fixture ---

export type Fixture = {
  id: string;
  inputJson: InputMap;
  expectedJson: ExpectedAssertions;
  storyMd: string;
};

// --- Errors ---

export type FixtureLoadErrorCode =
  | 'invalid_json'
  | 'invalid_input_map'
  | 'invalid_expected_schema';

export type FixtureLoadError = {
  source: 'input.json' | 'expected.json' | 'story.md';
  code: FixtureLoadErrorCode;
  path: string;
  message: string;
};

export type FixtureLoadResult =
  | { ok: true; fixture: Fixture }
  | { ok: false; errors: FixtureLoadError[] };

// ===================================================================
// Synthesis-side assertion language
// ===================================================================

// --- Sentinel matchers ---

export type SentinelMatcher = '<NON_NULL>' | '<NULL>' | '<PRESENT>' | '<ABSENT>';

// --- Per-block synthesis assertion shapes ---

export type ExpectedHeadlineAssertions = {
  direction_engine_names?: AssertionValue;
  direction_names?: AssertionValue;
  situation_text?: AssertionValue;
};

export type ExpectedSlotContentAssertions = {
  interpretive_text?: AssertionValue;
  token_text?: AssertionValue;
  /**
   * Stable sentence ID matched in this slot, resolved by the test runner via
   * reverse-lookup in the shape-sentence library by (slot, interpretive_text).
   * Use null to assert the token fallback fired (no library entry matched).
   * Only valid for slots that fire through `findFirstMatchingSentence`
   * against `shapeSentences`. For inline-dispatch slots like
   * comparison_surface_panel.summary, use the panel's `summary_id` field.
   */
  matched_id?: AssertionValue;
};

export type ExpectedDirectionCardAssertions = {
  visual_state?: AssertionValue;
  held_attributed_line?: AssertionValue;
  summary?: ExpectedSlotContentAssertions;
  meaning_sentence?: ExpectedSlotContentAssertions;
  expression_space_caption?: ExpectedSlotContentAssertions;
};

export type ExpectedChartBubbleAssertions = {
  pull?: AssertionValue;
  movement?: AssertionValue;
  surfaced?: AssertionValue;
  is_desired_direction?: AssertionValue;
  pull_quality_state?: AssertionValue;
};

export type ExpectedDomainsPanelAssertions = {
  summary?: ExpectedSlotContentAssertions;
  intact_callout?: ExpectedSlotContentAssertions;
  reduced_groups?: {
    [value_engine_name: string]: {
      domain_engine_names?: AssertionValue;
    };
  };
};

export type ExpectedConstraintLineAssertions = {
  band_label?: AssertionValue;
};

export type ExpectedConstraintsPanelAssertions = {
  summary?: ExpectedSlotContentAssertions;
  intact_callout?: ExpectedSlotContentAssertions;
  sustained_constraint_intensity?: AssertionValue;
  permission_sub_shape_text?: ExpectedSlotContentAssertions | SentinelMatcher;
  constraint_lines?: {
    [constraint_engine_name: string]:
      | SentinelMatcher
      | ExpectedConstraintLineAssertions;
  };
};

export type ExpectedCrossCuttingPanelAssertions = {
  outputs?: {
    [output_engine_name: string]: AssertionValue;
  };
};

export type ExpectedClosingLineAssertions = {
  direction_engine_name?: AssertionValue;
  text?: ExpectedSlotContentAssertions;
};

export type ExpectedClosingLinesAssertions = {
  [closing_line_id: string]: SentinelMatcher | ExpectedClosingLineAssertions;
};

export type ExpectedExperienceCandidateAssertions = {
  priority?: AssertionValue;
  pull?: AssertionValue;
};

export type ExpectedExperienceCandidatesAssertions = {
  [direction_engine_name: string]:
    | SentinelMatcher
    | ExpectedExperienceCandidateAssertions;
};

// --- Life-texture / life-context / comparison-surface panel assertions ---

export type ExpectedLifeTexturePanelAssertions = {
  summary?: ExpectedSlotContentAssertions;
  band_label?: AssertionValue;
  flags_present?: AssertionValue;
  flags_absent?: AssertionValue;
  load_state_label?: AssertionValue;
  pattern_note?: ExpectedSlotContentAssertions;
};

export type ExpectedLifeContextPanelAssertions = {
  life_stage_summary?: ExpectedSlotContentAssertions;
  work_load_summary?: ExpectedSlotContentAssertions;
  sociality_summary?: ExpectedSlotContentAssertions;
};

/**
 * Reference assertion for a ComparisonItem. The two variants mirror
 * ComparisonReference in src/synthesis/types.ts.
 */
export type ExpectedComparisonReferenceAssertion = {
  kind?: AssertionValue; // 'self_report_item' | 'engine_reading'
  id?: AssertionValue; // self_report_item: the item id
  reading_type?: AssertionValue; // engine_reading: 'firing_direction'|'reduced_domain'|'absent_flag'
  target?: AssertionValue; // engine_reading: direction/domain/flag name
};

export type ExpectedComparisonItemAssertion = {
  source?: AssertionValue; // 'self_report' | 'architecture'
  reference?: ExpectedComparisonReferenceAssertion;
  sentence?: ExpectedSlotContentAssertions;
};

export type ExpectedComparisonSurfacePanelAssertions = {
  summary?: ExpectedSlotContentAssertions;
  summary_id?: AssertionValue;
  /** Positional. Each entry asserts against the item at that index. */
  confirmed?: ExpectedComparisonItemAssertion[];
  quiet?: ExpectedComparisonItemAssertion[];
  surfaced?: ExpectedComparisonItemAssertion[];
  /** Assert exact item counts; useful when authoring "empty section". */
  confirmed_count?: AssertionValue;
  quiet_count?: AssertionValue;
  surfaced_count?: AssertionValue;
};

// --- Top-level expected_synthesis.json shape ---

export type ExpectedSynthesisAssertions = {
  headline?: ExpectedHeadlineAssertions;
  recognition_paragraph?: ExpectedSlotContentAssertions;
  pattern_paragraph?: { match: boolean };
  direction_cards?: {
    [direction_engine_name: string]: ExpectedDirectionCardAssertions;
  };
  direction_evidence_chart?: {
    bubbles?: {
      [direction_engine_name: string]: ExpectedChartBubbleAssertions;
    };
    caption?: ExpectedSlotContentAssertions;
  };
  domains_panel?: ExpectedDomainsPanelAssertions;
  constraints_panel?: ExpectedConstraintsPanelAssertions;
  cross_cutting_panel?: ExpectedCrossCuttingPanelAssertions;
  closing_lines?: ExpectedClosingLinesAssertions;
  experience_candidate_directions?: ExpectedExperienceCandidatesAssertions;
  life_texture_panel?: ExpectedLifeTexturePanelAssertions;
  life_context_panel?: ExpectedLifeContextPanelAssertions;
  /**
   * `'<NULL>'` sentinel asserts the panel is null per §5.10 nullability.
   * Otherwise structured assertions walk a non-null panel.
   */
  comparison_surface_panel?:
    | ExpectedComparisonSurfacePanelAssertions
    | SentinelMatcher;
};
