// B1 reachable-boundary test — standalone unit test for phantom allocation logic
// Tests the full pipeline: raw £ → assembler normalisation (£X/70×100) → InputMap stated_allocation → engine preA gate → phantom branch

import { describe, it, expect } from 'vitest';
import type { QuestionnaireAnswers } from '@/assembler/answers';
import { assembleFor } from '@/assembler';
import { runEngine } from '@/engine';

/* ------------------------------------------------------------------ */
/* Test helper: build minimal QuestionnaireAnswers                     */
/* ------------------------------------------------------------------ */

function makeMinimalAnswers(overrides: Partial<QuestionnaireAnswers> = {}): QuestionnaireAnswers {
  const base: QuestionnaireAnswers = {
    // Domain current_state — all set to 50 (neutral)
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
    // Q24 past_presence_selection — empty (no domains marked as past presence)
    past_presence_selection: [],
    // B9 peace_discriminator — empty object (no faded domains)
    peace_discriminator: {},
    // B1 q70_allocation — set by test cases
    q70_allocation: {},
    // Q1 week_shape_ticked — empty
    q1_week_shape_ticked: [],
    // Q2 primary_load
    q2_primary_load: 'd',
    // Q3 paid_work_relationship
    q3_paid_work_relationship: 'd',
    // Q4 life_shape_duration
    q4_life_shape_duration: 'c',
    // Q5 recent_life_shape_change
    q5_recent_life_shape_change: 'a',
    // Q6 capacity_strain
    q6_capacity_strain: 'a',
    // Q7 sociality_default
    q7_sociality_default: 'c',
    // Q8 past_presence_ticked — empty (no directions marked as past presence)
    q8_past_presence_ticked: [],
    // Q9 stopped_expecting_ticked — empty
    q9_stopped_expecting_ticked: [],
    // Q10 direction_chosen
    q10_direction_chosen: 'none',
    // Q10b retrospective
    q10b_retrospective: 'none',
    // Q10c counterfactual
    q10c_counterfactual: 'none',
    // Q11a/b/c psychological_filtering probes
    q11a_spare_resource: 'c', // maps to filters_pervasively
    q11b_footprint: 'c', // maps to filters_pervasively
    q11c_small_wants: 'c', // maps to filters_pervasively
    // Q25 energy_availability — 'c' = 50 (moderate constraint, to lower sustained_constraint_intensity)
    q25_energy_availability: 'c',
    // Q26 time_availability — 25 (moderate constraint, to lower sustained_constraint_intensity)
    q26_time_availability: 25,
    // Q27 body_capacity — 'a' = 85 (low constraint)
    q27_body_capacity: 'a',
    // Q29 recent_reaching
    q29_recent_reaching: 'd',
    // Q30 permission — 'a' = 70 (low constraint)
    q30_permission: 'a',
    // Q31 role_consolidation
    q31_role_consolidation: 'c',
    // Q32 attention_pattern
    q32_attention_pattern: 'c',
    // Q33 relational_presence
    q33_relational_presence: 'c',
    // q_friendship_count — 'b' = 50 (neutral)
    q_friendship_count: 'b',
    // q_depth_known — 'b' = conversation_depth 75, being_known 40 (neutral)
    q_depth_known: 'b',
    // Q34 self_report
    q34_self_report: { kind: 'nothing_really' },
    // Per-direction cards — set creator to phantom shape, others to neutral
    per_direction_card_a: {
      contributor: 'a',
      experience_seeker: 'a',
      freedom_designer: 'a',
      growth_focused: 'a',
      creator: 'a', // current_movement = a (0, low)
      relationship_rebuilder: 'a',
    },
    per_direction_card_b: {
      contributor: 'a',
      experience_seeker: 'a',
      freedom_designer: 'a',
      growth_focused: 'a',
      creator: 'a', // anticipation = a (none)
      relationship_rebuilder: 'a',
    },
    per_direction_card_c: {
      contributor: 'skipped',
      experience_seeker: 'skipped',
      freedom_designer: 'skipped',
      growth_focused: 'skipped',
      creator: 'skipped', // specificity = skipped (none, gated by anticipation none)
      relationship_rebuilder: 'skipped',
    },
  };

  return { ...base, ...overrides };
}

/* ------------------------------------------------------------------ */
/* Test cases                                                         */
/* ------------------------------------------------------------------ */

describe('B1 reachable-boundary test (phantom through gate)', () => {
  it('Case 1 — HIGH boundary fires through the gate: £35 → stated_allocation 50.0 → phantom', () => {
    // Build answers with q70_allocation = { creator: 35 }
    const answers = makeMinimalAnswers({
      q70_allocation: { creator: 35 },
    });

    // Run assembler to get InputMap (check normalisation)
    const { input_map } = assembleFor('test-user', answers);
    const statedAllocation = input_map.directions.creator.stated_allocation;
    console.log(`Case 1 normalised stated_allocation for creator: ${statedAllocation} (expected 50.0 from £35/70*100)`);

    // Verify normalisation is correct: £35 → 35/70*100 = 50.0
    if (statedAllocation !== 50.0) {
      throw new Error(`Normalisation wrong: expected 50.0, got ${statedAllocation}`);
    }

    // Run engine
    const engineResult = runEngine(input_map);

    expect(engineResult.ok).toBe(true);
    if (!engineResult.ok) {
      throw new Error('Engine run failed');
    }

    // Assert phantom fires
    const creatorDir = engineResult.output.directions.find((d) => d.direction === 'creator');
    expect(creatorDir).toBeDefined();
    expect(creatorDir?.pull_quality).toContain('phantom');
  });

  it('Case 2 — FLOOR does NOT fire: £21 → stated_allocation 30.0 → no phantom (below PARTIAL=35)', () => {
    // Build answers with q70_allocation = { creator: 21 }
    const answers = makeMinimalAnswers({
      q70_allocation: { creator: 21 },
    });

    // Run assembler to get InputMap (check normalisation)
    const { input_map } = assembleFor('test-user', answers);
    const statedAllocation = input_map.directions.creator.stated_allocation;
    console.log(`Case 2 normalised stated_allocation for creator: ${statedAllocation} (expected 30.0 from £21/70*100)`);

    // Verify normalisation is correct: £21 → 21/70*100 = 30.0
    if (statedAllocation !== 30.0) {
      throw new Error(`Normalisation wrong: expected 30.0, got ${statedAllocation}`);
    }

    // Run engine
    const engineResult = runEngine(input_map);

    expect(engineResult.ok).toBe(true);
    if (!engineResult.ok) {
      throw new Error('Engine run failed');
    }

    // Assert neither phantom nor phantom_partial fires (30 < PARTIAL=35)
    const creatorDir = engineResult.output.directions.find((d) => d.direction === 'creator');
    expect(creatorDir).toBeDefined();
    expect(creatorDir?.pull_quality).not.toContain('phantom');
    expect(creatorDir?.pull_quality).not.toContain('phantom_partial');
  });

  it('Case 3 — PARTIAL band fires phantom_partial: £28 → stated_allocation 40.0 → phantom_partial', () => {
    // Build answers with q70_allocation = { creator: 28 }
    const answers = makeMinimalAnswers({
      q70_allocation: { creator: 28 },
    });

    // Run assembler to get InputMap (check normalisation)
    const { input_map } = assembleFor('test-user', answers);
    const statedAllocation = input_map.directions.creator.stated_allocation;
    console.log(`Case 3 normalised stated_allocation for creator: ${statedAllocation} (expected 40.0 from £28/70*100)`);

    // Verify normalisation is correct: £28 → 28/70*100 = 40.0
    if (statedAllocation !== 40.0) {
      throw new Error(`Normalisation wrong: expected 40.0, got ${statedAllocation}`);
    }

    // Run engine
    const engineResult = runEngine(input_map);

    expect(engineResult.ok).toBe(true);
    if (!engineResult.ok) {
      throw new Error('Engine run failed');
    }

    // Assert phantom_partial fires (40 is between PARTIAL=35 and HIGH=50)
    const creatorDir = engineResult.output.directions.find((d) => d.direction === 'creator');
    expect(creatorDir).toBeDefined();
    expect(creatorDir?.pull_quality).toContain('phantom_partial');
    expect(creatorDir?.pull_quality).not.toContain('phantom');
  });
});
