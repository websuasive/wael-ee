import { describe, it, expect } from 'vitest';
import type { PerDirectionInputs } from '@/engine/types';
import { deriveSaturation } from '@/assembler/saturation';
import { SATURATION_MOVEMENT_FLOOR } from '@/assembler/params';

function makeDirection(overrides: Partial<PerDirectionInputs>): PerDirectionInputs {
  return {
    stated_strength: 0,
    felt_cost: 0,
    anticipation: 'mild',
    current_movement: 0,
    recent_action: 'none',
    past_presence: 'yes',
    specificity: 'partial',
    would_reach_for: 'no',
    saturation: 'no',
    stopped_expecting: 'no',
    ...overrides,
  };
}

describe('deriveSaturation', () => {
  it('S1 both conditions: current_movement=60, anticipation=none -> yes', () => {
    const direction = makeDirection({
      current_movement: SATURATION_MOVEMENT_FLOOR,
      anticipation: 'none',
    });
    const result = deriveSaturation(direction);
    expect(result).toBe('yes');
  });

  it('S2 movement just-below: current_movement=59, anticipation=none -> no (AND fails on movement)', () => {
    const direction = makeDirection({
      current_movement: SATURATION_MOVEMENT_FLOOR - 1,
      anticipation: 'none',
    });
    const result = deriveSaturation(direction);
    expect(result).toBe('no');
  });

  it('S3 anticipation not none (mild): current_movement=80, anticipation=mild -> no (AND fails on anticipation)', () => {
    const direction = makeDirection({
      current_movement: 80,
      anticipation: 'mild',
    });
    const result = deriveSaturation(direction);
    expect(result).toBe('no');
  });

  it('S4 anticipation not none (quickening): current_movement=80, anticipation=quickening -> no', () => {
    const direction = makeDirection({
      current_movement: 80,
      anticipation: 'quickening',
    });
    const result = deriveSaturation(direction);
    expect(result).toBe('no');
  });

  it('S5 neither: current_movement=0, anticipation=mild -> no', () => {
    const direction = makeDirection({
      current_movement: 0,
      anticipation: 'mild',
    });
    const result = deriveSaturation(direction);
    expect(result).toBe('no');
  });
});
