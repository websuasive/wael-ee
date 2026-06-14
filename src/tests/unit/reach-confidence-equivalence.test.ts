/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { checkTriad } from '@/assembler/consistency/check-triad';
import { buildInputMap } from '@/assembler/input-map';
import { computeReachConfidence } from '@/engine/derivations';
import type { QuestionnaireAnswers } from '@/assembler/answers';
import type { DirectionChoiceValue } from '@/engine/types';

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

type Triad = {
  q10a: DirectionChoiceValue;
  q10b: DirectionChoiceValue;
  q10c: DirectionChoiceValue;
  description: string;
};

function testEquivalence(triad: Triad) {
  // Build answers with the triad
  const answers = makeMinimalAnswers();
  answers.q10_direction_chosen = triad.q10a;
  answers.q10b_retrospective = triad.q10b;
  answers.q10c_counterfactual = triad.q10c;

  // Call assembler's checkTriad through its real input path
  const inputMap = buildInputMap('test-user', answers);
  const assemblerResult = checkTriad(inputMap, answers);

  // Call engine's computeReachConfidence through its real signature
  // The engine reads from InputMap.cross_direction fields, but the assembler doesn't populate
  // reach_retrospective/reach_counterfactual. We need to manually populate them for the test
  // to simulate the engine's real input path.
  const engineInputMap = {
    ...inputMap,
    cross_direction: {
      ...inputMap.cross_direction,
      reach_retrospective: triad.q10b,
      reach_counterfactual: triad.q10c,
    },
  };
  const engineResult = computeReachConfidence(
    engineInputMap.cross_direction.direction_chosen,
    engineInputMap.cross_direction.reach_retrospective,
    engineInputMap.cross_direction.reach_counterfactual,
  );

  return {
    assemblerVerdict: assemblerResult.reach_confidence,
    engineVerdict: engineResult,
    triad,
  };
}

describe('reach_confidence migration equivalence — checkTriad vs computeReachConfidence', () => {
  const triads: Triad[] = [
    // Branch 1: all three same direction
    {
      q10a: 'contributor' as DirectionChoiceValue,
      q10b: 'contributor' as DirectionChoiceValue,
      q10c: 'contributor' as DirectionChoiceValue,
      description: 'all same direction (contributor)',
    },
    {
      q10a: 'creator' as DirectionChoiceValue,
      q10b: 'creator' as DirectionChoiceValue,
      q10c: 'creator' as DirectionChoiceValue,
      description: 'all same direction (creator)',
    },

    // Branch 2: all three in {rest, none}
    {
      q10a: 'rest' as DirectionChoiceValue,
      q10b: 'rest' as DirectionChoiceValue,
      q10c: 'rest' as DirectionChoiceValue,
      description: 'all rest',
    },
    {
      q10a: 'rest' as DirectionChoiceValue,
      q10b: 'none' as DirectionChoiceValue,
      q10c: 'rest' as DirectionChoiceValue,
      description: 'mix rest/none',
    },
    {
      q10a: 'none' as DirectionChoiceValue,
      q10b: 'none' as DirectionChoiceValue,
      q10c: 'none' as DirectionChoiceValue,
      description: 'all none',
    },

    // Branch 3: Q10a in {rest,none} AND Q10b is a direction (tired-but-not-empty)
    {
      q10a: 'rest' as DirectionChoiceValue,
      q10b: 'contributor' as DirectionChoiceValue,
      q10c: 'rest' as DirectionChoiceValue,
      description: 'Q10a rest + Q10b direction + Q10c rest (tired-but-not-empty)',
    },
    {
      q10a: 'none' as DirectionChoiceValue,
      q10b: 'creator' as DirectionChoiceValue,
      q10c: 'none' as DirectionChoiceValue,
      description: 'Q10a none + Q10b direction + Q10c none (tired-but-not-empty)',
    },

    // Branch 3: Q10a in {rest,none} AND Q10c is a direction (filtered)
    {
      q10a: 'rest' as DirectionChoiceValue,
      q10b: 'rest' as DirectionChoiceValue,
      q10c: 'contributor' as DirectionChoiceValue,
      description: 'Q10a rest + Q10b rest + Q10c direction (filtered)',
    },
    {
      q10a: 'none' as DirectionChoiceValue,
      q10b: 'none' as DirectionChoiceValue,
      q10c: 'creator' as DirectionChoiceValue,
      description: 'Q10a none + Q10b none + Q10c direction (filtered)',
    },

    // Branch 4: three different directions
    {
      q10a: 'contributor' as DirectionChoiceValue,
      q10b: 'creator' as DirectionChoiceValue,
      q10c: 'growth_focused' as DirectionChoiceValue,
      description: 'three different directions',
    },
    {
      q10a: 'experience_seeker' as DirectionChoiceValue,
      q10b: 'freedom_designer' as DirectionChoiceValue,
      q10c: 'relationship_rebuilder' as DirectionChoiceValue,
      description: 'three different directions (other set)',
    },

    // OTHERWISE: partial corroboration
    {
      q10a: 'contributor' as DirectionChoiceValue,
      q10b: 'contributor' as DirectionChoiceValue,
      q10c: 'rest' as DirectionChoiceValue,
      description: 'partial corroboration (two same, one rest)',
    },
    {
      q10a: 'contributor' as DirectionChoiceValue,
      q10b: 'creator' as DirectionChoiceValue,
      q10c: 'contributor' as DirectionChoiceValue,
      description: 'partial corroboration (two same, one different)',
    },
    {
      q10a: 'contributor' as DirectionChoiceValue,
      q10b: 'rest' as DirectionChoiceValue,
      q10c: 'creator' as DirectionChoiceValue,
      description: 'partial corroboration (one direction, two rest)',
    },

    // Additional branch 3 permutations
    {
      q10a: 'rest' as DirectionChoiceValue,
      q10b: 'contributor' as DirectionChoiceValue,
      q10c: 'creator' as DirectionChoiceValue,
      description: 'Q10a rest + both Q10b/Q10c directions',
    },
    {
      q10a: 'none' as DirectionChoiceValue,
      q10b: 'contributor' as DirectionChoiceValue,
      q10c: 'creator' as DirectionChoiceValue,
      description: 'Q10a none + both Q10b/Q10c directions',
    },
  ];

  triads.forEach((triad) => {
    it(`equivalence: ${triad.description}`, () => {
      const { assemblerVerdict, engineVerdict } = testEquivalence(triad);
      expect(assemblerVerdict).toBe(engineVerdict);
    });
  });
});
