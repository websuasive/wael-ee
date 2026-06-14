/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { buildDomains } from '@/assembler/domains';
import type { QuestionnaireAnswers } from '@/assembler/answers';

function makeMinimalAnswers(): QuestionnaireAnswers {
  return {
    domain_current_state: {
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
    },
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
      contributor: 'a',
      experience_seeker: 'a',
      freedom_designer: 'a',
      growth_focused: 'a',
      creator: 'a',
      relationship_rebuilder: 'a',
    },
    q8_past_presence_ticked: [],
    q9_stopped_expecting_ticked: [],
    q10_direction_chosen: 'none',
    q10b_retrospective: 'none',
    q10c_counterfactual: 'none',
    q4_life_shape_duration: 'a',
    q5_recent_life_shape_change: 'a',
    q29_recent_reaching: 'a',
    q2_primary_load: 'a',
    q3_paid_work_relationship: 'a',
    q7_sociality_default: 'a',
    q11a_spare_resource: 'a',
    q11b_footprint: 'a',
    q11c_small_wants: 'a',
    q31_role_consolidation: 'a',
    q32_attention_pattern: 'a',
    q33_relational_presence: 'a',
    q_friendship_count: 'b',
    q_depth_known: 'b',
    q6_capacity_strain: 'a',
    q1_week_shape_ticked: ['a'] as Array<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i'>,
    q25_energy_availability: 'a',
    q26_time_availability: 50,
    q27_body_capacity: 'a',
    q30_permission: 'a',
    q34_self_report: { kind: 'nothing_really' },
  };
}

describe('B9 — wanting derivation branch (peace_discriminator)', () => {
  describe('B9 NEW BRANCH — made_peace triggers doesnt_want', () => {
    it('made_peace + history + reduced: past_presence=yes, peace_discriminator=made_peace, current_state<60 → doesnt_want', () => {
      const answers = makeMinimalAnswers();
      answers.domain_current_state.curiosity = 50; // < 60
      answers.past_presence_selection = ['curiosity'] as any; // history
      answers.peace_discriminator = { curiosity: 'made_peace' };

      const domains = buildDomains(answers);
      expect(domains.curiosity.wanting).toBe('doesnt_want');
    });

    it('still_misses: past_presence=yes, peace_discriminator=still_misses, current_state<60 → wants', () => {
      const answers = makeMinimalAnswers();
      answers.domain_current_state.curiosity = 50; // < 60
      answers.past_presence_selection = ['curiosity'] as any; // history
      answers.peace_discriminator = { curiosity: 'still_misses' };

      const domains = buildDomains(answers);
      expect(domains.curiosity.wanting).toBe('wants');
    });

    it('absent peace_discriminator + history + reduced: past_presence=yes, peace_discriminator undefined, current_state<60 → wants', () => {
      const answers = makeMinimalAnswers();
      answers.domain_current_state.curiosity = 50; // < 60
      answers.past_presence_selection = ['curiosity'] as any; // history
      // peace_discriminator not set (undefined)

      const domains = buildDomains(answers);
      expect(domains.curiosity.wanting).toBe('wants');
    });
  });

  describe('ORTHOGONALITY — current_state guard holds', () => {
    it('past_presence=yes, peace_discriminator=made_peace, but current_state>=60 → wants (not doesnt_want)', () => {
      const answers = makeMinimalAnswers();
      answers.domain_current_state.curiosity = 70; // >= 60
      answers.past_presence_selection = ['curiosity'] as any; // history
      answers.peace_discriminator = { curiosity: 'made_peace' };

      const domains = buildDomains(answers);
      expect(domains.curiosity.wanting).toBe('wants');
    });
  });

  describe('EXISTING ROUTE PRESERVED', () => {
    it('past_presence=no, current_state<30 → doesnt_want (original rule still fires)', () => {
      const answers = makeMinimalAnswers();
      answers.domain_current_state.curiosity = 25; // < 30
      answers.past_presence_selection = [] as any; // no history

      const domains = buildDomains(answers);
      expect(domains.curiosity.wanting).toBe('doesnt_want');
    });
  });

  describe('SPIRITUAL emit-not-omit', () => {
    it('spiritual domain at peace: past_presence=yes, made_peace, current_state<60 → emits wanting=doesnt_want', () => {
      const answers = makeMinimalAnswers();
      answers.domain_current_state.spiritual = 50; // < 60
      answers.past_presence_selection = ['spiritual'] as any; // history
      answers.peace_discriminator = { spiritual: 'made_peace' };

      const domains = buildDomains(answers);
      // Spiritual is NOT a universal domain, so wanting should be emitted
      expect(domains.spiritual.wanting).toBe('doesnt_want');
      expect(domains.spiritual.wanting).toBeDefined();
    });
  });
});
