/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { assembleFor } from '@/assembler';
import { runEngine } from '@/engine';
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

describe('Step 5 — ghost producer: full pipeline profile tests', () => {
  describe('PAUL (ghost)', () => {
    // Spec basis: §4.4 ghost condition — a card-strong want absent from all triad frames
    it('creator fires ghost when card-strong but absent from q10a/q10b/q10c', () => {
      const answers = makeMinimalAnswers();
      // Card-strong creator: anticipation=quickening, specificity=strong
      answers.per_direction_card_b.creator = 'c'; // quickening (card b: a=none, b=mild, c=quickening)
      answers.per_direction_card_c.creator = 'c'; // strong
      // Creator absent from all triad frames
      answers.q10_direction_chosen = 'contributor';
      answers.q10b_retrospective = 'experience_seeker';
      answers.q10c_counterfactual = 'freedom_designer';

      const assemblerResult = assembleFor('paul', answers);
      const engineResult = runEngine(assemblerResult.input_map);

      expect(engineResult.ok).toBe(true);
      const output = (engineResult as { ok: true; output: any }).output;
      const creator = output.directions.find((d: any) => d.direction === 'creator');

      expect(creator).toBeDefined();
      expect(creator!.pull_quality).toContain('ghost');
      expect(creator!.surfaced).toBe(false);
      expect(creator!.pull).toBeGreaterThan(0); // raw pull preserved
    });
  });

  describe('MARTIN (buried-alive, NOT ghost)', () => {
    // Spec basis: §4.3 — surfacing in q10b or q10c means alive, not ghost
    it('creator does NOT fire ghost when it surfaces in q10b or q10c', () => {
      const answers = makeMinimalAnswers();
      // Card-strong creator
      answers.per_direction_card_b.creator = 'c'; // quickening (card b: a=none, b=mild, c=quickening)
      answers.per_direction_card_c.creator = 'c'; // strong
      // Creator surfaces in q10b (buried but alive)
      answers.q10_direction_chosen = 'contributor';
      answers.q10b_retrospective = 'creator'; // creator surfaces here
      answers.q10c_counterfactual = 'freedom_designer';

      const assemblerResult = assembleFor('martin', answers);
      const engineResult = runEngine(assemblerResult.input_map);

      expect(engineResult.ok).toBe(true);
      const output = (engineResult as { ok: true; output: any }).output;
      const creator = output.directions.find((d: any) => d.direction === 'creator');

      expect(creator).toBeDefined();
      expect(creator!.pull_quality).not.toContain('ghost'); // NOT ghost
    });
  });

  describe('GEOFFREY vs ALAN (reach_state discrimination)', () => {
    // Spec basis: §4.3 — Geoffrey/Alan discrimination: buried_but_alive vs numb
    it('Geoffrey: q10a=rest/none, q10b/c name a direction -> reach_state=buried_but_alive', () => {
      const answers = makeMinimalAnswers();
      answers.q10_direction_chosen = 'rest';
      answers.q10b_retrospective = 'creator';
      answers.q10c_counterfactual = 'creator';

      const assemblerResult = assembleFor('geoffrey', answers);
      const engineResult = runEngine(assemblerResult.input_map);

      expect(engineResult.ok).toBe(true);
      const output = (engineResult as { ok: true; output: any }).output;

      expect(output.cross_direction.reach_state).toBe('buried_but_alive');
    });

    it('Alan: q10a/q10b/q10c ALL rest/none -> reach_state=numb', () => {
      const answers = makeMinimalAnswers();
      answers.q10_direction_chosen = 'rest';
      answers.q10b_retrospective = 'rest';
      answers.q10c_counterfactual = 'none';

      const assemblerResult = assembleFor('alan', answers);
      const engineResult = runEngine(assemblerResult.input_map);

      expect(engineResult.ok).toBe(true);
      const output = (engineResult as { ok: true; output: any }).output;

      expect(output.cross_direction.reach_state).toBe('numb');
    });
  });
});
