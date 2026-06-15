// Synthesis layer type contract. Output types sourced verbatim from src/SYNTHESIS.md sections 2.2, 2.3, 5.1, 5.3-5.9. Internal types (ShapeSentence, CalibrationLine, SlotName, MergedDirectionView) per sections 7.0 and 10.

import type {
  EngineOutput,
  InputMap,
  DirectionName,
  DomainName,
  DomainPresenceValue,
  CrossCuttingName,
  QuadrantValue,
  PastRelationshipValue,
  SpecificityValue,
  PullQualityValue,
  PullStateValue,
  ExpressionSpaceValue,
  SelfReportItemId,
} from '../engine';

/* ------------------------------------------------------------------ */
/* Output contract — sections 2.2, 2.3, 5.1, 5.3-5.9                  */
/* ------------------------------------------------------------------ */

/** Section 2.2 — Top-level rendering instructions. */
export type RenderingInstructions = {
  headline: HeadlineOutput;
  recognition_paragraph: SlotContent;
  pattern_paragraph: SlotContent;
  direction_cards: DirectionCardOutput[];
  direction_evidence_chart: ChartData;
  domains_panel: DomainsPanel;
  constraints_panel: ConstraintsPanel;
  cross_cutting_panel: CrossCuttingPanel;
  experience_candidate_directions: ExperienceCandidate[];
  /** Section 5.11. Always present. */
  life_texture_panel: LifeTexturePanel;
  /** Section 5.12. Always present. */
  life_context_panel: LifeContextPanel;
  /** Section 5.10. Null iff named_absences.length===0 AND surfaced.length===0. */
  comparison_surface_panel: ComparisonSurfacePanel | null;
  /** Section 5.13 (v4). Always present; seven bands always emitted. */
  the_narrowings_panel: TheNarrowingsPanel;
};

/** Section 2.3 — Slot content with interpretive/token layering. */
export type SlotContent = {
  interpretive_text: string | null;
  token_text: string;
};

/** Section 5.1 — Headline output. */
export type HeadlineOutput = {
  direction_names: string[];
  direction_engine_names: DirectionName[];
  situation_text: string | null;
};

/** Section 5.3 — Per-card field with optional numeric intensity. */
export type CardField = {
  label: string;
  value: string;
  intensity: number | null;
};

/** Section 5.3 — Direction card output. */
export type DirectionCardOutput = {
  direction_name: string;
  direction_engine_name: DirectionName;
  summary: SlotContent;
  meaning_sentence: SlotContent;
  fields: CardField[];
  visual_state: 'named' | 'firing_not_named' | 'not_firing';
  closing_observation?: string | null; // Per-direction closing observation (capacity_strain or stopped_expecting)
};

/** Section 5.4 — Direction-evidence chart. */
export type ChartData = {
  bubbles: ChartBubble[];
  caption: SlotContent;
};

/** Section 5.4 — Chart bubble. */
export type ChartBubble = {
  direction_name: string;
  direction_engine_name: DirectionName;
  pull: number;
  movement: number;
  specificity_size: number;
  surfaced: boolean;
  pull_quality_state: string;
  is_desired_direction: boolean;
  is_named_in_headline: boolean;
};

/** Section 5.5 — Reduced-domain entry with intensity (0–100, = 100 − engine current_state). */
export type ReducedDomain = {
  domain_name: string;
  intensity: number;
};

/** Section 5.5 — Domains panel reduced group. */
export type DomainsPanelReducedGroup = {
  value_label: string;
  value_engine_name: DomainPresenceValue;
  domains: ReducedDomain[];
  domain_engine_names: DomainName[];
};

/** Section 5.5 — Domains panel. */
export type DomainsPanel = {
  summary: SlotContent;
  reduced_groups: DomainsPanelReducedGroup[];
  intact_callout: SlotContent;
};

/** Section 5.6 — Constraints panel. */
export type ConstraintsPanel = {
  summary: SlotContent;
  constraint_lines: ConstraintLine[];
  sustained_constraint_intensity: number;
  intact_callout: SlotContent;
  permission_sub_shape_text: SlotContent | null;
};

/** Section 5.6 — Constraint line. */
export type ConstraintLine = {
  constraint_name: string;
  constraint_engine_name: 'energy' | 'time' | 'body_capacity' | 'permission';
  band_label: string;
  intensity: number;
  sentence: SlotContent;
};

/** Section 5.7 — Cross-cutting panel (renamed from spec's CrossCuttingOutput to avoid collision with engine type). */
export type CrossCuttingPanel = {
  outputs: CrossCuttingPanelEntry[];
};

/** Section 5.7 — Cross-cutting panel entry. */
export type CrossCuttingPanelEntry = {
  name: string;
  output_engine_name: CrossCuttingName;
  fires: boolean;
};

/** Section 5.8 — Canonical closing-line IDs. */
export type ClosingLineId =
  | 'closing_between_shapes'
  | 'closing_mid_process'
  | 'closing_capacity_strain'
  | 'closing_stopped_expecting'
  | 'closing_phantom';

/** Section 5.8 — Closing line. */
export type ClosingLine = {
  id: ClosingLineId;
  direction_engine_name: DirectionName | null;
  text: SlotContent;
};

/** Section 5.9 — Experience candidate direction. */
export type ExperienceCandidate = {
  direction_name: string;
  direction_engine_name: DirectionName;
  priority: 'firing' | 'past_presence_only';
  pull: number;
};

/* ------------------------------------------------------------------ */
/* Section 5.10 — Comparison surface panel                            */
/* ------------------------------------------------------------------ */

export type ComparisonReference =
  | { kind: 'self_report_item'; id: SelfReportItemId }
  | {
      kind: 'engine_reading';
      reading_type: 'firing_direction' | 'reduced_domain' | 'absent_flag';
      target: string;
    };

export type ComparisonItem = {
  sentence: SlotContent;
  source: 'self_report' | 'architecture';
  reference: ComparisonReference;
};

export type ComparisonSurfacePanel = {
  summary: SlotContent;
  /**
   * Synthetic stable identifier for the §7.10 sentence that fired in
   * `summary.interpretive_text`, or null when the token fallback fired.
   * One of the six §7.10 IDs: 'comparison_all_confirmed',
   * 'comparison_all_quiet', 'comparison_confirmed_and_surfaced',
   * 'comparison_surfaced_only_nothing_really',
   * 'comparison_surfaced_only_no_response', 'comparison_mixed'.
   *
   * Added per v2 architecture decision: assertions test the structural
   * identifier rather than the prose, which is Round 2 wording-revision
   * surface.
   */
  summary_id: string | null;
  confirmed: ComparisonItem[];
  quiet: ComparisonItem[];
  surfaced: ComparisonItem[];
};

/* ------------------------------------------------------------------ */
/* Section 5.11 — Life texture panel                                  */
/* ------------------------------------------------------------------ */

export type LifeTexturePanel = {
  summary: SlotContent;
  /** Display label for life_texture_band (§6.13). */
  band_label: string;
  /** Display labels of week_shape contents flags that are true (§6.15). */
  flags_present: string[];
  /** Display labels of week_shape contents flags that are false (§6.15). */
  flags_absent: string[];
  /** Joint load-state display label (§6.14). */
  load_state_label: string;
};

/* ------------------------------------------------------------------ */
/* Section 5.12 — Life context panel                                  */
/* ------------------------------------------------------------------ */

export type LifeContextPanel = {
  life_stage_summary: SlotContent;
  work_load_summary: SlotContent;
  sociality_summary: SlotContent;
  closing_between_shapes?: SlotContent | null; // Whole-situation closing line: between_shapes
  closing_mid_process?: SlotContent | null; // Whole-situation closing line: mid_process
};

/* ------------------------------------------------------------------ */
/* Section 5.13 (v4) — The narrowings panel                           */
/* ------------------------------------------------------------------ */

/**
 * The narrowings panel. Always present; seven bands always emitted.
 * Per SYNTHESIS_V4.md §5.13.
 */
export type TheNarrowingsPanel = {
  /** Seven entries, one per narrowing band, in engine declaration order. */
  bands: NarrowingBandEntry[];
  /** Summary slot using canonical SlotContent shape. */
  summary: SlotContent;
};

/**
 * Single narrowing band entry. Per SYNTHESIS.md §5.13.
 */
export type NarrowingBandEntry = {
  /**
   * Self-describing identifier (audit Concern 1). Matches engine field name
   * with `_narrowing_band` suffix stripped. Render layer reads this for
   * visual treatment dispatch; test assertions read this rather than index.
   */
  band_field: 'structural' | 'experiential' | 'psychological' | 'identity' | 'energetic' | 'relational' | 'attention';
  /** Man-facing label per §6.21 (Structure / Variety / Wanting / Energetic / etc.). */
  display_name: string;
  /** Expanded form for tooltip headers per §6.22 (Structural Narrowing / Experiential Narrowing / etc.). */
  full_name: string;
  /** Narrative character associated with each narrowing per §6.22 (The Yes Man / The Shrunk Man / etc.). */
  character_name: string;
  /** Categorical band value from engine. */
  band: 'low' | 'moderate' | 'high';
  /**
   * Render-layer convenience derived from band (33 for low, 66 for moderate,
   * 100 for high). Documents explicit mapping; band is architectural reading.
   */
  intensity: 33 | 66 | 100;
  /**
   * Observation sentence from §7.16, keyed by {narrowing}_{intensity}.
   * Primary visible content in the render layer.
   */
  observation: string;
};

/* ------------------------------------------------------------------ */
/* Internal types — sections 7.0 and 10                               */
/* ------------------------------------------------------------------ */

/** Section 10 — Shape-sentence slot identifier union. Closing-line slots per section 5.8 (one per canonical ID). */
export type SlotName =
  | 'pattern_paragraph'
  | 'direction_card_summary'
  | 'permission_sub_shape'
  | 'energy_constraint'
  | 'time_constraint'
  | 'body_capacity_constraint'
  | 'domains_intact_callout'
  | 'domains_summary'
  | 'chart_caption'
  | 'life_texture_summary'
  | 'life_texture_pattern_note'
  | 'expression_space_caption'
  | 'life_stage_summary'
  | 'work_load_summary'
  | 'sociality_summary'
  | 'narrowing_summary'
  | `closing_line_${ClosingLineId}`;
// §7.10 comparison_surface_summary deliberately NOT a sentence-library slot:
// its predicates are meta-predicates over composed-panel counts, not
// predicates over (EngineOutput, InputMap). See comparison_surface.ts.

/** Section 10 — Shape sentence definition. */
export type ShapeSentence = {
  id: string;
  slot: SlotName;
  predicate: (output: EngineOutput, input: InputMap) => boolean;
  sentence: string;
};

/** Section 10 — Calibration line definition. Only 'prepend' composition is permitted. */
export type CalibrationLine = {
  id: string;
  predicate: (output: EngineOutput, input: InputMap) => boolean;
  sentence: string;
  composition: 'prepend';
};

/**
 * Section 7.0 — Merged per-direction view combining EngineOutput.directions[i] and InputMap.directions[i].
 *
 * Finding: spec section 7.0 prose lists `capacity_strain` under the per-direction view, but the engine's
 * `PerDirectionInputs` (src/engine/types.ts:55-66) places capacity_strain on `cross_direction`, not per-direction.
 * Per task guidance, the type follows the engine's actual `PerDirectionInputs`; `capacity_strain` is omitted here.
 */
export type MergedDirectionView = {
  // From EngineOutput.directions[i]
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

  // From InputMap.directions[i]
  stated_strength: number;
  felt_cost: number;
  anticipation: 'none' | 'mild' | 'quickening';
  current_movement: number;
  recent_action: 'none' | 'some' | 'recent';
  past_presence: 'yes' | 'no';
  would_reach_for: 'yes' | 'no';
  saturation: 'yes' | 'no';
  stopped_expecting: 'yes' | 'no';
};
