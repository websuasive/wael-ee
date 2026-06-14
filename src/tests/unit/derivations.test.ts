import { describe, it, expect } from 'vitest';
import {
  computeSustainedConstraintIntensity,
  computePull,
  computeMovement,
} from '@/engine/derivations';
import type { InputMap, PerDirectionInputs } from '@/engine/types';

function makePerDirectionInputs(
  overrides: Partial<PerDirectionInputs> = {},
): PerDirectionInputs {
  return {
    stated_strength: 50,
    felt_cost: 50,
    anticipation: 'mild',
    current_movement: 50,
    recent_action: 'some',
    past_presence: 'yes',
    specificity: 'partial',
    would_reach_for: 'no',
    saturation: 'no',
    stopped_expecting: 'no',
    ...overrides,
  };
}

function makeConstraints(
  overrides: Partial<InputMap['constraints']> = {},
): InputMap['constraints'] {
  return {
    energy_availability: 50,
    time_availability: 50,
    body_capacity: 50,
    permission: 50,
    permission_sub_shape: 'present',
    ...overrides,
  };
}

describe('computeSustainedConstraintIntensity', () => {
  it('returns 0 when all availabilities are 100', () => {
    const c = makeConstraints({
      energy_availability: 100,
      time_availability: 100,
      body_capacity: 100,
      permission: 100,
    });
    expect(computeSustainedConstraintIntensity(c)).toBeCloseTo(0, 6);
  });

  it('returns 100 when all availabilities are 0', () => {
    const c = makeConstraints({
      energy_availability: 0,
      time_availability: 0,
      body_capacity: 0,
      permission: 0,
    });
    expect(computeSustainedConstraintIntensity(c)).toBeCloseTo(100, 6);
  });

  it('worked example (80/60/70/50) → 39', () => {
    const c = makeConstraints({
      energy_availability: 80,
      time_availability: 60,
      body_capacity: 70,
      permission: 50,
      permission_sub_shape: 'present',
    });
    expect(computeSustainedConstraintIntensity(c)).toBeCloseTo(39, 6);
  });

  it('permission-only constraint (others 100, permission 0) → 45', () => {
    const c = makeConstraints({
      energy_availability: 100,
      time_availability: 100,
      body_capacity: 100,
      permission: 0,
    });
    expect(computeSustainedConstraintIntensity(c)).toBeCloseTo(45, 6);
  });

  it('all four at 50 → 50', () => {
    const c = makeConstraints({
      energy_availability: 50,
      time_availability: 50,
      body_capacity: 50,
      permission: 50,
    });
    expect(computeSustainedConstraintIntensity(c)).toBeCloseTo(50, 6);
  });

  it('mixed boundary case (e=100, t=0, b=100, p=0) → 65', () => {
    const c = makeConstraints({
      energy_availability: 100,
      time_availability: 0,
      body_capacity: 100,
      permission: 0,
    });
    expect(computeSustainedConstraintIntensity(c)).toBeCloseTo(65, 6);
  });

  it('permission_sub_shape is ignored', () => {
    const base = {
      energy_availability: 80,
      time_availability: 60,
      body_capacity: 70,
      permission: 50,
    } as const;
    const a = makeConstraints({ ...base, permission_sub_shape: 'present' });
    const b = makeConstraints({ ...base, permission_sub_shape: 'act_block' });
    expect(computeSustainedConstraintIntensity(a)).toBeCloseTo(
      computeSustainedConstraintIntensity(b),
      6,
    );
  });
});

describe('computePull', () => {
  it('all zero / none → 0', () => {
    const d = makePerDirectionInputs({
      stated_strength: 0,
      felt_cost: 0,
      anticipation: 'none',
      recent_action: 'none',
      specificity: 'none',
    });
    expect(computePull(d)).toBeCloseTo(0, 6);
  });

  it('all max → 100', () => {
    const d = makePerDirectionInputs({
      stated_strength: 100,
      felt_cost: 100,
      anticipation: 'quickening',
      recent_action: 'recent',
      specificity: 'strong',
    });
    expect(computePull(d)).toBeCloseTo(100, 6);
  });

  it('worked example (80/40/mild/none/partial) → 47', () => {
    const d = makePerDirectionInputs({
      stated_strength: 80,
      felt_cost: 40,
      anticipation: 'mild',
      recent_action: 'none',
      specificity: 'partial',
    });
    expect(computePull(d)).toBeCloseTo(47, 6);
  });

  it('anticipation mapping: none=0, mild=10, quickening=20 contribution', () => {
    const base = {
      stated_strength: 0,
      felt_cost: 0,
      recent_action: 'none' as const,
      specificity: 'none' as const,
    };
    expect(
      computePull(makePerDirectionInputs({ ...base, anticipation: 'none' })),
    ).toBeCloseTo(0, 6);
    expect(
      computePull(makePerDirectionInputs({ ...base, anticipation: 'mild' })),
    ).toBeCloseTo(10, 6);
    expect(
      computePull(
        makePerDirectionInputs({ ...base, anticipation: 'quickening' }),
      ),
    ).toBeCloseTo(20, 6);
  });

  it('recent_action mapping: none=0, some=10, recent=20 contribution', () => {
    const base = {
      stated_strength: 0,
      felt_cost: 0,
      anticipation: 'none' as const,
      specificity: 'none' as const,
    };
    expect(
      computePull(makePerDirectionInputs({ ...base, recent_action: 'none' })),
    ).toBeCloseTo(0, 6);
    expect(
      computePull(makePerDirectionInputs({ ...base, recent_action: 'some' })),
    ).toBeCloseTo(10, 6);
    expect(
      computePull(
        makePerDirectionInputs({ ...base, recent_action: 'recent' }),
      ),
    ).toBeCloseTo(20, 6);
  });

  it('specificity mapping: none=0, partial=5, strong=10 contribution', () => {
    const base = {
      stated_strength: 0,
      felt_cost: 0,
      anticipation: 'none' as const,
      recent_action: 'none' as const,
    };
    expect(
      computePull(makePerDirectionInputs({ ...base, specificity: 'none' })),
    ).toBeCloseTo(0, 6);
    expect(
      computePull(makePerDirectionInputs({ ...base, specificity: 'partial' })),
    ).toBeCloseTo(5, 6);
    expect(
      computePull(makePerDirectionInputs({ ...base, specificity: 'strong' })),
    ).toBeCloseTo(10, 6);
  });

  it('stated_strength weight: only stated_strength=100 → 30', () => {
    const d = makePerDirectionInputs({
      stated_strength: 100,
      felt_cost: 0,
      anticipation: 'none',
      recent_action: 'none',
      specificity: 'none',
    });
    expect(computePull(d)).toBeCloseTo(30, 6);
  });

  it('felt_cost weight: only felt_cost=100 → 20', () => {
    const d = makePerDirectionInputs({
      stated_strength: 0,
      felt_cost: 100,
      anticipation: 'none',
      recent_action: 'none',
      specificity: 'none',
    });
    expect(computePull(d)).toBeCloseTo(20, 6);
  });

  it('ignores fields not used by pull', () => {
    const a = makePerDirectionInputs({
      stated_strength: 60,
      felt_cost: 30,
      anticipation: 'mild',
      recent_action: 'some',
      specificity: 'partial',
      current_movement: 10,
      past_presence: 'yes',
      would_reach_for: 'no',
      saturation: 'no',
      stopped_expecting: 'no',
    });
    const b = makePerDirectionInputs({
      stated_strength: 60,
      felt_cost: 30,
      anticipation: 'mild',
      recent_action: 'some',
      specificity: 'partial',
      current_movement: 90,
      past_presence: 'no',
      would_reach_for: 'yes',
      saturation: 'yes',
      stopped_expecting: 'yes',
    });
    expect(computePull(a)).toBeCloseTo(computePull(b), 6);
  });
});

describe('computeMovement', () => {
  it('identity at boundaries', () => {
    expect(
      computeMovement(makePerDirectionInputs({ current_movement: 0 })),
    ).toBeCloseTo(0, 6);
    expect(
      computeMovement(makePerDirectionInputs({ current_movement: 100 })),
    ).toBeCloseTo(100, 6);
  });

  it('identity at midpoint 47.5', () => {
    expect(
      computeMovement(makePerDirectionInputs({ current_movement: 47.5 })),
    ).toBeCloseTo(47.5, 6);
  });

  it('ignores fields other than current_movement', () => {
    const a = makePerDirectionInputs({
      current_movement: 33,
      stated_strength: 10,
      felt_cost: 10,
      anticipation: 'none',
      recent_action: 'none',
      specificity: 'none',
      past_presence: 'yes',
      would_reach_for: 'no',
      saturation: 'no',
      stopped_expecting: 'no',
    });
    const b = makePerDirectionInputs({
      current_movement: 33,
      stated_strength: 90,
      felt_cost: 90,
      anticipation: 'quickening',
      recent_action: 'recent',
      specificity: 'strong',
      past_presence: 'no',
      would_reach_for: 'yes',
      saturation: 'yes',
      stopped_expecting: 'yes',
    });
    expect(computeMovement(a)).toBeCloseTo(computeMovement(b), 6);
  });
});
