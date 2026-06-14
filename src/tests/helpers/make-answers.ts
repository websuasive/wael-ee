import type { QuestionnaireAnswers } from '@/assembler/answers';

export const DEFAULT_DOMAIN_STATES = {
  time_as_yours: 50,
  energy_as_resource: 50,
  felt_aliveness: 50,
  body_physical_aliveness: 50,
  curiosity: 50,
  making: 50,
  conversation_depth: 50,
  being_known: 50,
  friendship: 50,
  intimacy: 50,
  mattering: 50,
  spiritual: 50,
} as const;

const canonicalDefaults: QuestionnaireAnswers = {
  domain_current_state: { ...DEFAULT_DOMAIN_STATES },
  past_presence_selection: [],
  peace_discriminator: {},
  q70_allocation: {},
  per_direction_card_a: {
    contributor: 'a',
    experience_seeker: 'a',
    freedom_designer: 'a',
    growth_focused: 'a',
    creator: 'a',
    relationship_rebuilder: 'a',
  },
  per_direction_card_b: {
    contributor: 'a',
    experience_seeker: 'a',
    freedom_designer: 'a',
    growth_focused: 'a',
    creator: 'a',
    relationship_rebuilder: 'a',
  },
  per_direction_card_c: {
    contributor: 'skipped',
    experience_seeker: 'skipped',
    freedom_designer: 'skipped',
    growth_focused: 'skipped',
    creator: 'skipped',
    relationship_rebuilder: 'skipped',
  },
  q8_past_presence_ticked: [],
  q9_stopped_expecting_ticked: [],
  q10_direction_chosen: 'rest',
  // Q10b/Q10c: triangulation variants (do NOT populate engine fields)
  // Defaults: both 'rest' -> branch 2 all-rest/none -> high, no flag (non-triggering baseline)
  q10b_retrospective: 'rest',
  q10c_counterfactual: 'rest',
  q4_life_shape_duration: 'b', // maps to 'sustained'
  q5_recent_life_shape_change: 'a', // maps to 'no'
  q29_recent_reaching: 'b', // maps to 'mid_stream'
  // Cross-direction single-enum defaults (week_shape is a separate addition)
  q2_primary_load: 'd', // maps to 'none'
  q3_paid_work_relationship: 'd', // maps to 'between'
  q7_sociality_default: 'c', // maps to 'balanced'
  q11a_spare_resource: 'a', // maps to does_not_filter
  q11b_footprint: 'a', // maps to does_not_filter
  q11c_small_wants: 'a', // maps to does_not_filter
  q31_role_consolidation: 'b', // maps to 'role_inflected'
  q32_attention_pattern: 'b', // maps to 'intermittent'
  q33_relational_presence: 'b', // maps to 'partial'
  q_friendship_count: 'b', // maps to friendship 50
  q_depth_known: 'b', // maps to conversation_depth 75, being_known 40
  q6_capacity_strain: 'a', // maps to 'no'
  // Q1 week_shape ticked letters (empty -> all nine flags false)
  q1_week_shape_ticked: [] as Array<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i'>,
  // Constraints block defaults (non-triggering / neutral baseline)
  q25_energy_availability: 'c', // maps to 50
  q26_time_availability: 50, // pass-through -> 50
  q27_body_capacity: 'b', // maps to 65
  q30_permission: 'a', // maps to permission 70 + present
  // Self-report block default (empty-named selection, valid and reachable)
  q34_self_report: { kind: 'named', items: [] }, // maps to []
};

export function makeAnswers(overrides: Partial<QuestionnaireAnswers> = {}): QuestionnaireAnswers {
  return { ...canonicalDefaults, ...overrides };
}
