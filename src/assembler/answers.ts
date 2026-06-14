// Questionnaire answers type — domains-block fields only, extended per block as the assembler is built.

import type { SelfReportItemId } from '@/engine/types';

export type DomainKey =
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

export type DirectionKey =
  | 'contributor'
  | 'experience_seeker'
  | 'freedom_designer'
  | 'growth_focused'
  | 'creator'
  | 'relationship_rebuilder';

export type QuestionnaireAnswers = {
  // Q12–Q23: twelve domain current_state slider values (0–100)
  domain_current_state: Record<DomainKey, number>;
  // Q24: past-presence selection — domains the man marked as ever a real part of his life
  past_presence_selection: DomainKey[];
  // B9: peace_discriminator — for with-history reduced domains only
  // 'made_peace' = genuinely at peace, 'still_misses' = wants it back
  peace_discriminator: Partial<Record<DomainKey, 'made_peace' | 'still_misses'>>;
  // B1: q70_allocation — per-direction £ allocation (raw £ amounts, unchosen omitted)
  q70_allocation: Partial<Record<DirectionKey, number>>;
  // Step-2 per-direction fields: Part C card answers and Q8/Q9/Q10
  // Part C cards (per direction): card-a (current_movement + recent_action), card-b (anticipation), card-c (specificity, gated)
  per_direction_card_a: Record<DirectionKey, 'a' | 'b' | 'c' | 'd'>;
  per_direction_card_b: Record<DirectionKey, 'a' | 'b' | 'c'>;
  per_direction_card_c: Record<DirectionKey, 'a' | 'b' | 'c' | 'skipped'>;
  // Q8: past_presence ticked directions
  q8_past_presence_ticked: DirectionKey[];
  // Q9: stopped_expecting ticked directions
  q9_stopped_expecting_ticked: DirectionKey[];
  // Q10: direction_chosen (a–f = direction keys, g=rest, h=none)
  q10_direction_chosen: DirectionKey | 'rest' | 'none';
  // Q10b: triangulation variant (retrospective; does NOT populate an engine field)
  // Feeds reach_confidence + CHECK 1 only
  q10b_retrospective: DirectionKey | 'rest' | 'none';
  // Q10c: triangulation variant (counterfactual; does NOT populate an engine field)
  // Feeds reach_confidence + CHECK 1 only
  q10c_counterfactual: DirectionKey | 'rest' | 'none';
  // Incremental cross-field addition for life_stage derivation (full cross-field surface is a later pass)
  q4_life_shape_duration: 'a' | 'b' | 'c';
  q5_recent_life_shape_change: 'a' | 'b' | 'c';
  q29_recent_reaching: 'a' | 'b' | 'c' | 'd';
  // Cross-direction single-enum fields (week_shape is a separate addition)
  q2_primary_load: 'a' | 'b' | 'c' | 'd';
  q3_paid_work_relationship: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
  q7_sociality_default: 'a' | 'b' | 'c';
  q11a_spare_resource: 'a' | 'b' | 'c';
  q11b_footprint: 'a' | 'b' | 'c';
  q11c_small_wants: 'a' | 'b' | 'c';
  q31_role_consolidation: 'a' | 'b' | 'c';
  q32_attention_pattern: 'a' | 'b' | 'c';
  q33_relational_presence: 'a' | 'b' | 'c';
  q_friendship_count: 'a' | 'b' | 'c';
  q_depth_known: 'a' | 'b' | 'c';
  q6_capacity_strain: 'a' | 'b' | 'c';
  // Q1 week_shape ticked letters (nine booleans built from this)
  q1_week_shape_ticked: Array<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i'>;
  // Constraints block fields
  q25_energy_availability: 'a' | 'b' | 'c' | 'd' | 'e';
  q26_time_availability: number;
  q27_body_capacity: 'a' | 'b' | 'c' | 'd';
  q30_permission: 'a' | 'b' | 'c' | 'd';
  // Constraints block fields
  q34_self_report:
    | { kind: 'nothing_really' }
    | { kind: 'named'; items: Exclude<SelfReportItemId, 'nothing_really'>[] };
};

// NamedAbsenceId: the nine named absence values, excluding nothing_really
// This tracks the engine type via Exclude, ensuring the nine stay in sync
export type NamedAbsenceId = Exclude<SelfReportItemId, 'nothing_really'>;
