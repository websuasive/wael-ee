// Unit tests for the seven v4 narrowing band derivation functions.
// Each test exercises high/moderate/low predicates from the §4.6.x worked examples.

import { describe, it, expect } from 'vitest';
import {
  computeStructuralNarrowingBand,
  computeExperientialNarrowingBand,
  computePsychologicalNarrowingBand,
  computeIdentityNarrowingBand,
  computeEnergeticNarrowingBand,
  computeRelationalNarrowingBand,
  computeAttentionNarrowingBand,
} from '@/engine/derivations';
import type { WeekShapeFlags } from '@/engine/types';

const allFalseWeek = (overrides: Partial<WeekShapeFlags> = {}): WeekShapeFlags => ({
  work_dominates: false,
  weekends_consumed: false,
  weekly_activity: false,
  sees_people: false,
  makes_things: false,
  active_body: false,
  belongs_to_group: false,
  solo_practice: false,
  varied_week: false,
  ...overrides,
});

/* §4.6.1 — structural_narrowing_band */
describe('computeStructuralNarrowingBand (§4.6.1)', () => {
  it('Geoff fires high (full compound: act_block branch)', () => {
    expect(
      computeStructuralNarrowingBand({
        week_shape: allFalseWeek({ work_dominates: true, weekends_consumed: true }),
        primary_load: 'caregiving',
        life_stage: 'enduring',
        life_shape_duration: 'long',
        time_band: 'heavy_time_pressure',
        permission_sub_shape: 'act_block',
      }),
    ).toBe('high');
  });

  it('Gary fires high (enduring-long compound carries via want_block)', () => {
    expect(
      computeStructuralNarrowingBand({
        week_shape: allFalseWeek({ work_dominates: true, weekends_consumed: true }),
        primary_load: 'paid_work',
        life_stage: 'enduring',
        life_shape_duration: 'long',
        time_band: 'heavy_time_pressure',
        permission_sub_shape: 'want_block',
      }),
    ).toBe('high');
  });

  it('Mark fires moderate (high fails on permission/life_stage compound)', () => {
    expect(
      computeStructuralNarrowingBand({
        week_shape: allFalseWeek({ work_dominates: true, weekends_consumed: true }),
        primary_load: 'paid_work',
        life_stage: 'consolidating',
        life_shape_duration: 'long',
        time_band: 'heavy_time_pressure',
        permission_sub_shape: 'say_block',
      }),
    ).toBe('moderate');
  });

  it('Hugh fires low (zero load, open time, primary_load=none)', () => {
    expect(
      computeStructuralNarrowingBand({
        week_shape: allFalseWeek(),
        primary_load: 'none',
        life_stage: 'transitioning',
        life_shape_duration: 'recent',
        time_band: 'open',
        permission_sub_shape: 'present',
      }),
    ).toBe('low');
  });
});

/* §4.6.2 — experiential_narrowing_band */
describe('computeExperientialNarrowingBand (§4.6.2)', () => {
  it('Geoff fires high (depleted, 0 contents, varied=false, pull<30)', () => {
    expect(
      computeExperientialNarrowingBand({
        week_shape: allFalseWeek({ work_dominates: true, weekends_consumed: true }),
        life_texture_band: 'depleted',
        experience_pull: 11,
      }),
    ).toBe('high');
  });

  it('Mark fires moderate (mixed, 2-3 contents, varied=false)', () => {
    expect(
      computeExperientialNarrowingBand({
        week_shape: allFalseWeek({ sees_people: true, makes_things: true }),
        life_texture_band: 'mixed',
        experience_pull: 26,
      }),
    ).toBe('moderate');
  });

  it('Hugh fires low cleanly via varied_week=true (lock-time Option B)', () => {
    expect(
      computeExperientialNarrowingBand({
        week_shape: allFalseWeek({ weekly_activity: true, sees_people: true, active_body: true, varied_week: true }),
        life_texture_band: 'mixed',
        experience_pull: 50,
      }),
    ).toBe('low');
  });

  it('Jonathan fires low via varied_week=true; moderate is gated off', () => {
    expect(
      computeExperientialNarrowingBand({
        week_shape: allFalseWeek({ weekly_activity: true, sees_people: true, makes_things: true, varied_week: true }),
        life_texture_band: 'mixed',
        experience_pull: 40,
      }),
    ).toBe('low');
  });
});

/* §4.6.3 — psychological_narrowing_band */
describe('computePsychologicalNarrowingBand (§4.6.3)', () => {
  it('Gary fires high (filters_pervasively + want_block + 6-count)', () => {
    expect(
      computePsychologicalNarrowingBand({
        psychological_filtering: 'filters_pervasively',
        permission_sub_shape: 'want_block',
        direction_specificity_none_count: 6,
        direction_suppressed_count: 0,
        curiosity_fires: false,
      }),
    ).toBe('high');
  });

  it('Nicholas fires high (filters_some + 4-count)', () => {
    expect(
      computePsychologicalNarrowingBand({
        psychological_filtering: 'filters_some',
        permission_sub_shape: 'say_block',
        direction_specificity_none_count: 4,
        direction_suppressed_count: 1,
        curiosity_fires: false,
      }),
    ).toBe('high');
  });

  it('Mark fires moderate via 4th clause (3-count + does_not_filter)', () => {
    expect(
      computePsychologicalNarrowingBand({
        psychological_filtering: 'does_not_filter',
        permission_sub_shape: 'say_block',
        direction_specificity_none_count: 3,
        direction_suppressed_count: 1,
        curiosity_fires: false,
      }),
    ).toBe('moderate');
  });

  it('Hugh fires low — spec worked-example inputs verbatim (§4.6.3)', () => {
    // Inputs per §4.6.3 worked example: does_not_filter + say_block + count=2 + curiosity intact.
    // Now passes under the Chunk 1D-finalise narrow correction (low excludes only want_block).
    expect(
      computePsychologicalNarrowingBand({
        psychological_filtering: 'does_not_filter',
        permission_sub_shape: 'say_block',
        direction_specificity_none_count: 2,
        direction_suppressed_count: 0,
        curiosity_fires: false,
      }),
    ).toBe('low');
  });
});

/* §4.6.4 — identity_narrowing_band */
describe('computeIdentityNarrowingBand (§4.6.4)', () => {
  it('Adrian fires high (defining + role_inflected/consolidated)', () => {
    expect(
      computeIdentityNarrowingBand({
        role_consolidation: 'role_consolidated',
        paid_work_relationship: 'defining',
        life_stage: 'enduring',
        life_shape_duration: 'long',
      }),
    ).toBe('high');
  });

  it('Geoff fires high via role_consolidated', () => {
    expect(
      computeIdentityNarrowingBand({
        role_consolidation: 'role_consolidated',
        paid_work_relationship: 'functional',
        life_stage: 'enduring',
        life_shape_duration: 'long',
      }),
    ).toBe('high');
  });

  it('Mark fires moderate via role_inflected', () => {
    expect(
      computeIdentityNarrowingBand({
        role_consolidation: 'role_inflected',
        paid_work_relationship: 'consuming',
        life_stage: 'consolidating',
        life_shape_duration: 'long',
      }),
    ).toBe('moderate');
  });

  it('Hugh fires low (holds_other_selves + transitioning)', () => {
    expect(
      computeIdentityNarrowingBand({
        role_consolidation: 'holds_other_selves',
        paid_work_relationship: 'between',
        life_stage: 'transitioning',
        life_shape_duration: 'recent',
      }),
    ).toBe('low');
  });
});

/* §4.6.5 — energetic_narrowing_band */
describe('computeEnergeticNarrowingBand (§4.6.5)', () => {
  it('Geoff fires high (heavy_depletion + both domains reduced)', () => {
    expect(
      computeEnergeticNarrowingBand({
        energy_band: 'heavy_depletion',
        body_band: 'shifted',
        felt_aliveness_fires: true,
        energy_as_resource_fires: true,
        life_texture_band: 'depleted',
      }),
    ).toBe('high');
  });

  it('Mark fires moderate (energy.band=moderate + felt_aliveness reduced)', () => {
    expect(
      computeEnergeticNarrowingBand({
        energy_band: 'moderate',
        body_band: 'shifted',
        felt_aliveness_fires: true,
        energy_as_resource_fires: false,
        life_texture_band: 'mixed',
      }),
    ).toBe('moderate');
  });

  it('Hugh fires low (full energy + felt_aliveness reduced + body not limited)', () => {
    expect(
      computeEnergeticNarrowingBand({
        energy_band: 'full',
        body_band: 'shifted',
        felt_aliveness_fires: false,
        energy_as_resource_fires: false,
        life_texture_band: 'mixed',
      }),
    ).toBe('low');
  });

  it('body-limited + dimmed aliveness fires moderate (new clause)', () => {
    expect(
      computeEnergeticNarrowingBand({
        energy_band: 'full',
        body_band: 'limited',
        felt_aliveness_fires: false,
        energy_as_resource_fires: false,
        life_texture_band: 'mixed',
      }),
    ).toBe('moderate');
  });

  it('body-limited blocks low (conjunctive guard on low)', () => {
    expect(
      computeEnergeticNarrowingBand({
        energy_band: 'full',
        body_band: 'limited',
        felt_aliveness_fires: false,
        energy_as_resource_fires: true,
        life_texture_band: 'mixed',
      }),
    ).toBe('moderate');
  });

  it('body-limited with aliveness intact does not fire the new moderate clause (defaults to moderate)', () => {
    expect(
      computeEnergeticNarrowingBand({
        energy_band: 'full',
        body_band: 'limited',
        felt_aliveness_fires: true,
        energy_as_resource_fires: true,
        life_texture_band: 'mixed',
      }),
    ).toBe('moderate');
  });
});

/* §4.6.6 — relational_narrowing_band */
describe('computeRelationalNarrowingBand (§4.6.6)', () => {
  it('Geoff fires high (4 reduced + sees_people=false)', () => {
    expect(
      computeRelationalNarrowingBand({
        friendship_fires: true,
        intimacy_fires: true,
        conversation_depth_fires: true,
        being_known_fires: true,
        sociality_default: 'balanced',
        sees_people: false,
        belongs_to_group: false,
        relational_presence: 'partial',
      }),
    ).toBe('high');
  });

  it('Mark fires moderate (3 reduced + presence=partial; high fails on sees_people=true)', () => {
    expect(
      computeRelationalNarrowingBand({
        friendship_fires: true,
        intimacy_fires: true,
        conversation_depth_fires: false,
        being_known_fires: true,
        sociality_default: 'balanced',
        sees_people: true,
        belongs_to_group: false,
        relational_presence: 'partial',
      }),
    ).toBe('moderate');
  });

  it('Low predicate: 0 reduced + presence=present', () => {
    expect(
      computeRelationalNarrowingBand({
        friendship_fires: false,
        intimacy_fires: false,
        conversation_depth_fires: false,
        being_known_fires: false,
        sociality_default: 'balanced',
        sees_people: true,
        belongs_to_group: true,
        relational_presence: 'present',
      }),
    ).toBe('low');
  });
});

/* §4.6.7 — attention_narrowing_band */
describe('computeAttentionNarrowingBand (§4.6.7)', () => {
  it('Geoff fires high (autopilot + felt_aliveness reduced)', () => {
    expect(
      computeAttentionNarrowingBand({
        attention_pattern: 'autopilot',
        felt_aliveness_fires: true,
        varied_week: false,
        experience_pull: 11,
      }),
    ).toBe('high');
  });

  it('Mark fires moderate (intermittent)', () => {
    expect(
      computeAttentionNarrowingBand({
        attention_pattern: 'intermittent',
        felt_aliveness_fires: true,
        varied_week: false,
        experience_pull: 26,
      }),
    ).toBe('moderate');
  });

  it('Hugh fires low (engaged + felt_aliveness intact)', () => {
    expect(
      computeAttentionNarrowingBand({
        attention_pattern: 'engaged',
        felt_aliveness_fires: false,
        varied_week: true,
        experience_pull: 50,
      }),
    ).toBe('low');
  });

  it('Engaged + felt_aliveness reduced lands moderate (third disjunct)', () => {
    expect(
      computeAttentionNarrowingBand({
        attention_pattern: 'engaged',
        felt_aliveness_fires: true,
        varied_week: false,
        experience_pull: 30,
      }),
    ).toBe('moderate');
  });
});
