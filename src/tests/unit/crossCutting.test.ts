import { describe, it, expect } from 'vitest';
import { computeCrossCuttingOutputs } from '@/engine/scoring/crossCutting';
import type {
  InputMap,
  DirectionOutput,
  DirectionName,
  CrossCuttingOutput,
  CrossCuttingName,
} from '@/engine/types';

const DIRECTION_NAMES: readonly DirectionName[] = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
];

function makeInputMap(
  crossCuttingOverrides: Partial<InputMap['cross_cutting']> = {},
): InputMap {
  return {
    directions: {
      contributor: baseDir(),
      experience_seeker: baseDir(),
      freedom_designer: baseDir(),
      growth_focused: baseDir(),
      creator: baseDir(),
      relationship_rebuilder: baseDir(),
    },
    cross_direction: {
      direction_chosen: 'none',
      capacity_strain: 'no',
      life_shape_duration: 'recent',
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
      psychological_filtering: 'filters_some',
      role_consolidation: 'role_inflected',
      attention_pattern: 'intermittent',
      relational_presence: 'partial',
    },
    domains: {
      time_as_yours: { current_state: 80, past_presence: 'yes' },
      energy_as_resource: { current_state: 80, past_presence: 'yes' },
      felt_aliveness: { current_state: 80, past_presence: 'yes' },
      body_physical_aliveness: { current_state: 80, past_presence: 'yes' },
      curiosity: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
      making: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
      conversation_depth: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
      being_known: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
      friendship: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
      intimacy: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
      mattering: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
      spiritual: { current_state: 20, past_presence: 'no', wanting: 'doesnt_want' },
    },
    constraints: {
      energy_availability: 80,
      time_availability: 80,
      body_capacity: 80,
      permission: 80,
      permission_sub_shape: 'present',
    },
    cross_cutting: {
      recent_life_shape_change: 'no',
      replacement_structure_exists: 'yes',
      recent_reaching: 'long_established',
      ...crossCuttingOverrides,
    },
    self_report: {
      named_absences: [],
    },
  };
}

function baseDir(): InputMap['directions']['creator'] {
  return {
    stated_strength: 0,
    felt_cost: 0,
    anticipation: 'none',
    current_movement: 0,
    recent_action: 'none',
    past_presence: 'no',
    specificity: 'none',
    would_reach_for: 'no',
    saturation: 'no',
    stopped_expecting: 'no',
  };
}

function makeDirectionOutput(
  overrides: Partial<DirectionOutput> = {},
): DirectionOutput {
  return {
    direction: 'contributor',
    surfaced: false,
    pull: 0,
    movement: 0,
    quadrant: 'quiet',
    past_relationship: 'never_been_part_of_life',
    was_once_renders: false,
    specificity: 'none',
    pull_quality: [],
    pull_state: [],
    expression_space: 'has_space',
    ...overrides,
  };
}

function makeDirectionOutputs(
  perDirection: Partial<Record<DirectionName, Partial<DirectionOutput>>> = {},
): DirectionOutput[] {
  return DIRECTION_NAMES.map((name) =>
    makeDirectionOutput({ direction: name, ...(perDirection[name] ?? {}) }),
  );
}

function findOutput(
  outputs: CrossCuttingOutput[],
  name: CrossCuttingName,
): CrossCuttingOutput {
  const match = outputs.find((o) => o.output === name);
  if (!match) throw new Error(`output not found: ${name}`);
  return match;
}

/* ------------------------------------------------------------------ */

describe('A. Between shapes — full truth table', () => {
  it('yes + no → fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({
        recent_life_shape_change: 'yes',
        replacement_structure_exists: 'no',
      }),
      makeDirectionOutputs(),
    );
    expect(findOutput(out, 'between_shapes').fires).toBe(true);
  });

  it('yes + yes → not fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({
        recent_life_shape_change: 'yes',
        replacement_structure_exists: 'yes',
      }),
      makeDirectionOutputs(),
    );
    expect(findOutput(out, 'between_shapes').fires).toBe(false);
  });

  it('no + no → not fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({
        recent_life_shape_change: 'no',
        replacement_structure_exists: 'no',
      }),
      makeDirectionOutputs(),
    );
    expect(findOutput(out, 'between_shapes').fires).toBe(false);
  });

  it('no + yes → not fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({
        recent_life_shape_change: 'no',
        replacement_structure_exists: 'yes',
      }),
      makeDirectionOutputs(),
    );
    expect(findOutput(out, 'between_shapes').fires).toBe(false);
  });
});

describe('B. Between shapes — independence from direction outputs', () => {
  it('still fires regardless of direction outputs', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({
        recent_life_shape_change: 'yes',
        replacement_structure_exists: 'no',
      }),
      makeDirectionOutputs({
        creator: { quadrant: 'active', pull_state: ['held_attributed_with_expression'] },
        freedom_designer: { quadrant: 'active', pull_state: ['held_attributed_with_expression'] },
        contributor: { quadrant: 'active' },
      }),
    );
    expect(findOutput(out, 'between_shapes').fires).toBe(true);
  });
});

describe('C. Mid-process — direction-output side', () => {
  it('no Active + recent_and_awkward → not fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({ recent_reaching: 'recent_and_awkward' }),
      makeDirectionOutputs(),
    );
    expect(findOutput(out, 'mid_process').fires).toBe(false);
  });

  it('one Active + recent_and_awkward → fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({ recent_reaching: 'recent_and_awkward' }),
      makeDirectionOutputs({ creator: { quadrant: 'active' } }),
    );
    expect(findOutput(out, 'mid_process').fires).toBe(true);
  });

  it('multiple Active + recent_and_awkward → fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({ recent_reaching: 'recent_and_awkward' }),
      makeDirectionOutputs({
        creator: { quadrant: 'active' },
        freedom_designer: { quadrant: 'active' },
      }),
    );
    expect(findOutput(out, 'mid_process').fires).toBe(true);
  });

  it('blocked + habit but no Active → not fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({ recent_reaching: 'recent_and_awkward' }),
      makeDirectionOutputs({
        creator: { quadrant: 'blocked' },
        freedom_designer: { quadrant: 'habit' },
      }),
    );
    expect(findOutput(out, 'mid_process').fires).toBe(false);
  });
});

describe('D. Mid-process — recent_reaching side', () => {
  for (const reaching of [
    'mid_stream',
    'long_established',
    'no_current_reaching',
  ] as const) {
    it(`one Active + ${reaching} → not fires`, () => {
      const out = computeCrossCuttingOutputs(
        makeInputMap({ recent_reaching: reaching }),
        makeDirectionOutputs({ creator: { quadrant: 'active' } }),
      );
      expect(findOutput(out, 'mid_process').fires).toBe(false);
    });
  }

  it('one Active + recent_and_awkward → fires (positive baseline)', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({ recent_reaching: 'recent_and_awkward' }),
      makeDirectionOutputs({ creator: { quadrant: 'active' } }),
    );
    expect(findOutput(out, 'mid_process').fires).toBe(true);
  });
});

describe('E. Mid-process — both conditions required', () => {
  it('no Active + recent_and_awkward → not fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({ recent_reaching: 'recent_and_awkward' }),
      makeDirectionOutputs(),
    );
    expect(findOutput(out, 'mid_process').fires).toBe(false);
  });

  it('one Active + long_established → not fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({ recent_reaching: 'long_established' }),
      makeDirectionOutputs({ creator: { quadrant: 'active' } }),
    );
    expect(findOutput(out, 'mid_process').fires).toBe(false);
  });

  it('both → fires', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({ recent_reaching: 'recent_and_awkward' }),
      makeDirectionOutputs({ creator: { quadrant: 'active' } }),
    );
    expect(findOutput(out, 'mid_process').fires).toBe(true);
  });
});



describe('H. Output structure', () => {
  it('returns exactly 2 entries', () => {
    const out = computeCrossCuttingOutputs(makeInputMap(), makeDirectionOutputs());
    expect(out).toHaveLength(2);
  });

  it('canonical order: between_shapes, mid_process', () => {
    const out = computeCrossCuttingOutputs(makeInputMap(), makeDirectionOutputs());
    expect(out[0]!.output).toBe('between_shapes');
    expect(out[1]!.output).toBe('mid_process');
  });

  it('each entry has exactly two keys: output, fires', () => {
    const out = computeCrossCuttingOutputs(makeInputMap(), makeDirectionOutputs());
    for (const entry of out) {
      expect(Object.keys(entry).sort()).toEqual(['fires', 'output']);
    }
  });
});

describe('I. Independence between rules', () => {
  it('both fire simultaneously', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({
        recent_life_shape_change: 'yes',
        replacement_structure_exists: 'no',
        recent_reaching: 'recent_and_awkward',
      }),
      makeDirectionOutputs({ creator: { quadrant: 'active' } }),
    );
    expect(findOutput(out, 'between_shapes').fires).toBe(true);
    expect(findOutput(out, 'mid_process').fires).toBe(true);
  });

  it('only between_shapes fires alone', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({
        recent_life_shape_change: 'yes',
        replacement_structure_exists: 'no',
      }),
      makeDirectionOutputs(),
    );
    expect(findOutput(out, 'between_shapes').fires).toBe(true);
    expect(findOutput(out, 'mid_process').fires).toBe(false);
  });

  it('only mid_process fires alone', () => {
    const out = computeCrossCuttingOutputs(
      makeInputMap({ recent_reaching: 'recent_and_awkward' }),
      makeDirectionOutputs({ creator: { quadrant: 'active' } }),
    );
    expect(findOutput(out, 'between_shapes').fires).toBe(false);
    expect(findOutput(out, 'mid_process').fires).toBe(true);
  });
});
