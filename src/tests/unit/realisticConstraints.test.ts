import { describe, it, expect } from 'vitest';
import { computeRealisticConstraintsOutputs } from '@/engine/scoring/realisticConstraints';
import type { InputMap, PermissionSubShape } from '@/engine/types';

function makeConstraints(
  overrides: Partial<InputMap['constraints']> = {},
): InputMap['constraints'] {
  return {
    energy_availability: 80,
    time_availability: 80,
    body_capacity: 80,
    permission: 80,
    permission_sub_shape: 'present',
    ...overrides,
  };
}

function makeInputMap(
  overrides: { constraints?: Partial<InputMap['constraints']> } = {},
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
    constraints: makeConstraints(overrides.constraints),
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

function run(constraints: Partial<InputMap['constraints']>, sci = 0) {
  return computeRealisticConstraintsOutputs(
    makeInputMap({ constraints }),
    sci,
  );
}

/* ------------------------------------------------------------------ */

describe('A. Energy banding', () => {
  const cases: Array<[number, 'full' | 'moderate' | 'heavy_depletion']> = [
    [100, 'full'],
    [70, 'full'],
    [69.99, 'moderate'],
    [55, 'moderate'],
    [40, 'moderate'],
    [39.99, 'heavy_depletion'],
    [0, 'heavy_depletion'],
  ];
  for (const [v, expected] of cases) {
    it(`energy_availability=${v} → ${expected}`, () => {
      expect(run({ energy_availability: v }).energy.band).toBe(expected);
    });
  }
});

describe('B. Time banding', () => {
  const cases: Array<[number, 'open' | 'moderate' | 'heavy_time_pressure']> = [
    [100, 'open'],
    [70, 'open'],
    [69.99, 'moderate'],
    [55, 'moderate'],
    [40, 'moderate'],
    [39.99, 'heavy_time_pressure'],
    [0, 'heavy_time_pressure'],
  ];
  for (const [v, expected] of cases) {
    it(`time_availability=${v} → ${expected}`, () => {
      expect(run({ time_availability: v }).time.band).toBe(expected);
    });
  }
});

describe('C. Body banding', () => {
  const cases: Array<[number, 'full' | 'shifted' | 'limited']> = [
    [100, 'full'],
    [70, 'full'],
    [69.99, 'shifted'],
    [55, 'shifted'],
    [40, 'shifted'],
    [39.99, 'limited'],
    [0, 'limited'],
  ];
  for (const [v, expected] of cases) {
    it(`body_capacity=${v} → ${expected}`, () => {
      expect(run({ body_capacity: v }).body_capacity.band).toBe(expected);
    });
  }
});

describe('D. Permission banding', () => {
  const cases: Array<[number, 'present' | 'partial' | 'blocked']> = [
    [100, 'present'],
    [70, 'present'],
    [69.99, 'partial'],
    [55, 'partial'],
    [40, 'partial'],
    [39.99, 'blocked'],
    [0, 'blocked'],
  ];
  for (const [v, expected] of cases) {
    it(`permission=${v} → ${expected}`, () => {
      expect(run({ permission: v }).permission.band).toBe(expected);
    });
  }
});

describe('E. Energy fires', () => {
  it('full → fires=false', () => {
    expect(run({ energy_availability: 80 }).energy.fires).toBe(false);
  });
  it('moderate → fires=true', () => {
    expect(run({ energy_availability: 50 }).energy.fires).toBe(true);
  });
  it('heavy_depletion → fires=true', () => {
    expect(run({ energy_availability: 10 }).energy.fires).toBe(true);
  });
});

describe('F. Time fires', () => {
  it('open → fires=false', () => {
    expect(run({ time_availability: 80 }).time.fires).toBe(false);
  });
  it('moderate → fires=true', () => {
    expect(run({ time_availability: 50 }).time.fires).toBe(true);
  });
  it('heavy_time_pressure → fires=true', () => {
    expect(run({ time_availability: 10 }).time.fires).toBe(true);
  });
});

describe('G. Body fires', () => {
  it('full → fires=false', () => {
    expect(run({ body_capacity: 80 }).body_capacity.fires).toBe(false);
  });
  it('shifted → fires=true', () => {
    expect(run({ body_capacity: 50 }).body_capacity.fires).toBe(true);
  });
  it('limited → fires=true', () => {
    expect(run({ body_capacity: 10 }).body_capacity.fires).toBe(true);
  });
});

describe('H. Permission fires — all eight (tier × sub_shape) combinations', () => {
  const subs: PermissionSubShape[] = [
    'present',
    'want_block',
    'say_block',
    'act_block',
  ];

  for (const sub of subs) {
    it(`permission=80, sub_shape=${sub} → fires=false`, () => {
      const r = run({ permission: 80, permission_sub_shape: sub });
      expect(r.permission.fires).toBe(false);
      expect(r.permission.sub_shape).toBe(sub);
    });
  }

  for (const sub of subs) {
    it(`permission=50, sub_shape=${sub} → fires=true`, () => {
      const r = run({ permission: 50, permission_sub_shape: sub });
      expect(r.permission.fires).toBe(true);
      expect(r.permission.sub_shape).toBe(sub);
    });
  }

  it('boundary permission=70, sub_shape=want_block → fires=false', () => {
    const r = run({ permission: 70, permission_sub_shape: 'want_block' });
    expect(r.permission.fires).toBe(false);
  });

  it('boundary permission=69.99, sub_shape=present → fires=true', () => {
    const r = run({ permission: 69.99, permission_sub_shape: 'present' });
    expect(r.permission.fires).toBe(true);
  });
});

describe('I. Raw value passthrough', () => {
  it('integer values pass through verbatim', () => {
    const r = run({
      energy_availability: 33,
      time_availability: 21,
      body_capacity: 64,
      permission: 17,
    });
    expect(r.energy.value).toBe(33);
    expect(r.time.value).toBe(21);
    expect(r.body_capacity.value).toBe(64);
    expect(r.permission.value).toBe(17);
  });

  it('non-integer values pass through verbatim (no rounding/clipping)', () => {
    const r = run({
      energy_availability: 47.5,
      time_availability: 39.999,
      body_capacity: 70.0001,
      permission: 0.5,
    });
    expect(r.energy.value).toBe(47.5);
    expect(r.time.value).toBe(39.999);
    expect(r.body_capacity.value).toBe(70.0001);
    expect(r.permission.value).toBe(0.5);
  });
});

describe('J. sub_shape passthrough — always present', () => {
  const subs: PermissionSubShape[] = [
    'present',
    'want_block',
    'say_block',
    'act_block',
  ];

  for (const sub of subs) {
    it(`permission=80 (no fire) + sub_shape=${sub} still passes through`, () => {
      const r = run({ permission: 80, permission_sub_shape: sub });
      expect(r.permission.fires).toBe(false);
      expect(r.permission.sub_shape).toBe(sub);
    });
  }

  for (const sub of subs) {
    it(`permission=50 (fires) + sub_shape=${sub} passes through`, () => {
      const r = run({ permission: 50, permission_sub_shape: sub });
      expect(r.permission.fires).toBe(true);
      expect(r.permission.sub_shape).toBe(sub);
    });
  }
});

describe('K. sustained_constraint_intensity passthrough', () => {
  for (const sci of [0, 50, 100, 73.4]) {
    it(`SCI=${sci} passed through verbatim`, () => {
      // Use constraint values that would compute a very different SCI
      // (high availability → low SCI), to confirm the parameter wins.
      const r = computeRealisticConstraintsOutputs(
        makeInputMap({
          constraints: {
            energy_availability: 100,
            time_availability: 100,
            body_capacity: 100,
            permission: 100,
          },
        }),
        sci,
      );
      expect(r.sustained_constraint_intensity).toBe(sci);
    });
  }
});

describe('L. Output structure', () => {
  it('top-level keys are exactly the five expected', () => {
    const r = run({});
    expect(Object.keys(r).sort()).toEqual(
      [
        'body_capacity',
        'energy',
        'permission',
        'sustained_constraint_intensity',
        'time',
      ].sort(),
    );
  });

  it('energy/time/body_capacity each have exactly value, band, fires (no sub_shape)', () => {
    const r = run({});
    expect(Object.keys(r.energy).sort()).toEqual(['band', 'fires', 'value']);
    expect(Object.keys(r.time).sort()).toEqual(['band', 'fires', 'value']);
    expect(Object.keys(r.body_capacity).sort()).toEqual([
      'band',
      'fires',
      'value',
    ]);
  });

  it('permission has exactly value, band, sub_shape, fires', () => {
    const r = run({});
    expect(Object.keys(r.permission).sort()).toEqual([
      'band',
      'fires',
      'sub_shape',
      'value',
    ]);
  });
});
