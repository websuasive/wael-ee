/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { validateInputMap } from '@/engine/validation';
import type { ValidationError } from '@/engine/validation';
import type { InputMap, PerDirectionInputs } from '@/engine/types';

function makeDir(would_reach_for: 'yes' | 'no'): PerDirectionInputs {
  return {
    stated_strength: 50,
    felt_cost: 30,
    anticipation: 'mild',
    current_movement: 40,
    recent_action: 'some',
    past_presence: 'yes',
    specificity: 'partial',
    would_reach_for,
    saturation: 'no',
    stopped_expecting: 'no',
  };
}

function makeBaseline(): InputMap {
  return {
    directions: {
      contributor: makeDir('no'),
      experience_seeker: makeDir('no'),
      freedom_designer: makeDir('no'),
      growth_focused: makeDir('no'),
      creator: makeDir('yes'),
      relationship_rebuilder: makeDir('no'),
    },
    cross_direction: {
      direction_chosen: 'creator',
      capacity_strain: 'no',
      life_shape_duration: 'sustained',
      week_shape: {
        work_dominates: false,
        weekends_consumed: false,
        weekly_activity: false,
        sees_people: false,
        makes_things: false,
        active_body: false,
        belongs_to_group: false,
        solo_practice: false,
        varied_week: false,
      },
      life_stage: 'drifting',
      sociality_default: 'balanced',
      paid_work_relationship: 'functional',
      primary_load: 'none',
      psychological_filtering: 'does_not_filter',
      role_consolidation: 'holds_other_selves',
      attention_pattern: 'engaged',
      relational_presence: 'present',
    },
    domains: {
      time_as_yours: { current_state: 50, past_presence: 'yes' },
      energy_as_resource: { current_state: 50, past_presence: 'yes' },
      felt_aliveness: { current_state: 50, past_presence: 'yes' },
      body_physical_aliveness: { current_state: 50, past_presence: 'yes' },
      curiosity: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      making: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      conversation_depth: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      being_known: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      friendship: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      intimacy: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      mattering: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      spiritual: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
    },
    constraints: {
      energy_availability: 50,
      time_availability: 50,
      body_capacity: 50,
      permission: 50,
      permission_sub_shape: 'present',
    },
    cross_cutting: {
      recent_life_shape_change: 'no',
      replacement_structure_exists: 'yes',
      recent_reaching: 'mid_stream',
    },
    self_report: {
      named_absences: [],
    },
  };
}

function expectError(
  errors: ValidationError[],
  code: ValidationError['code'],
  path: string,
): ValidationError {
  const match = errors.find((e) => e.code === code && e.path === path);
  expect(
    match,
    `expected error code=${code} path=${path}; got ${JSON.stringify(errors)}`,
  ).toBeDefined();
  expect(typeof match!.message).toBe('string');
  expect(match!.message.length).toBeGreaterThan(0);
  return match!;
}

function expectFail(result: any): ValidationError[] {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('unreachable');
  expect(result.errors.length).toBeGreaterThan(0);
  return result.errors;
}

describe('InputMap widening — new optional fields', () => {
  describe('reach_retrospective (cross_direction)', () => {
    it('accepts valid direction value', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_retrospective = 'contributor';
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('accepts valid rest value', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_retrospective = 'rest';
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('accepts valid none value', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_retrospective = 'none';
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('rejects invalid enum value', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_retrospective = 'invalid_direction';
      const result = validateInputMap(input);
      const errors = expectFail(result);
      expectError(errors, 'invalid_categorical', 'cross_direction.reach_retrospective');
    });

    it('rejects wrong type (number)', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_retrospective = 123;
      const result = validateInputMap(input);
      const errors = expectFail(result);
      expectError(errors, 'invalid_type', 'cross_direction.reach_retrospective');
    });
  });

  describe('reach_counterfactual (cross_direction)', () => {
    it('accepts valid direction value', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_counterfactual = 'creator';
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('accepts valid rest value', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_counterfactual = 'rest';
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('accepts valid none value', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_counterfactual = 'none';
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('rejects invalid enum value', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_counterfactual = 'invalid';
      const result = validateInputMap(input);
      const errors = expectFail(result);
      expectError(errors, 'invalid_categorical', 'cross_direction.reach_counterfactual');
    });

    it('rejects wrong type (string array)', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_counterfactual = ['creator'];
      const result = validateInputMap(input);
      const errors = expectFail(result);
      expectError(errors, 'invalid_type', 'cross_direction.reach_counterfactual');
    });
  });

  describe('stated_allocation (per-direction)', () => {
    it('accepts valid numeric value for a direction', () => {
      const input: any = structuredClone(makeBaseline());
      input.directions.contributor.stated_allocation = 50;
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('accepts zero for unchosen direction', () => {
      const input: any = structuredClone(makeBaseline());
      input.directions.contributor.stated_allocation = 0;
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('rejects negative number', () => {
      const input: any = structuredClone(makeBaseline());
      input.directions.contributor.stated_allocation = -10;
      const result = validateInputMap(input);
      const errors = expectFail(result);
      expectError(errors, 'out_of_range', 'directions.contributor.stated_allocation');
    });

    it('rejects number > 100', () => {
      const input: any = structuredClone(makeBaseline());
      input.directions.contributor.stated_allocation = 150;
      const result = validateInputMap(input);
      const errors = expectFail(result);
      expectError(errors, 'out_of_range', 'directions.contributor.stated_allocation');
    });

    it('rejects wrong type (string)', () => {
      const input: any = structuredClone(makeBaseline());
      input.directions.contributor.stated_allocation = '50';
      const result = validateInputMap(input);
      const errors = expectFail(result);
      expectError(errors, 'invalid_type', 'directions.contributor.stated_allocation');
    });
  });

  describe('peace_discriminator (per-domain)', () => {
    it('accepts valid value for a domain with history', () => {
      const input: any = structuredClone(makeBaseline());
      input.domains.making.peace_discriminator = 'made_peace';
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('accepts valid value for another domain', () => {
      const input: any = structuredClone(makeBaseline());
      input.domains.friendship.peace_discriminator = 'still_misses';
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it('rejects invalid enum value', () => {
      const input: any = structuredClone(makeBaseline());
      input.domains.making.peace_discriminator = 'invalid_value';
      const result = validateInputMap(input);
      const errors = expectFail(result);
      expectError(errors, 'invalid_categorical', 'domains.making.peace_discriminator');
    });

    it('rejects wrong type (number)', () => {
      const input: any = structuredClone(makeBaseline());
      input.domains.making.peace_discriminator = 123;
      const result = validateInputMap(input);
      const errors = expectFail(result);
      expectError(errors, 'invalid_type', 'domains.making.peace_discriminator');
    });
  });

  describe('all four fields together', () => {
    it('accepts all four fields with valid values', () => {
      const input: any = structuredClone(makeBaseline());
      input.cross_direction.reach_retrospective = 'contributor';
      input.cross_direction.reach_counterfactual = 'rest';
      input.directions.contributor.stated_allocation = 30;
      input.directions.creator.stated_allocation = 70;
      input.domains.making.peace_discriminator = 'made_peace';
      input.domains.friendship.peace_discriminator = 'still_misses';
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });
  });
});
