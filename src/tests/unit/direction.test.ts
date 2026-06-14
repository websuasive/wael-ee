import { describe, it, expect } from 'vitest';
import { computeDirectionOutputs } from '@/engine/scoring/direction';
import { computePull, computeMovement } from '@/engine/derivations';
import type {
  InputMap,
  PerDirectionInputs,
  DirectionName,
  DomainName,
  DomainPresenceOutput,
  DirectionOutput,
} from '@/engine/types';

const DIRECTION_NAMES: readonly DirectionName[] = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
];

const DOMAIN_NAMES: readonly DomainName[] = [
  'time_as_yours',
  'energy_as_resource',
  'felt_aliveness',
  'body_physical_aliveness',
  'curiosity',
  'making',
  'conversation_depth',
  'being_known',
  'friendship',
  'intimacy',
  'mattering',
  'spiritual',
];

function makeDirectionInputs(
  overrides: Partial<PerDirectionInputs> = {},
): PerDirectionInputs {
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
    ...overrides,
  };
}

type InputMapOverrides = {
  directions?: Partial<Record<DirectionName, Partial<PerDirectionInputs>>>;
  cross_direction?: Partial<InputMap['cross_direction']>;
  domains?: Partial<InputMap['domains']>;
  constraints?: Partial<InputMap['constraints']>;
  cross_cutting?: Partial<InputMap['cross_cutting']>;
};

function makeInputMap(overrides: InputMapOverrides = {}): InputMap {
  const dirOverrides = overrides.directions ?? {};
  const directions = {
    contributor: makeDirectionInputs(dirOverrides.contributor),
    experience_seeker: makeDirectionInputs(dirOverrides.experience_seeker),
    freedom_designer: makeDirectionInputs(dirOverrides.freedom_designer),
    growth_focused: makeDirectionInputs(dirOverrides.growth_focused),
    creator: makeDirectionInputs(dirOverrides.creator),
    relationship_rebuilder: makeDirectionInputs(dirOverrides.relationship_rebuilder),
  };
  return {
    directions,
    cross_direction: {
      direction_chosen: 'none',
      capacity_strain: 'no',
      life_shape_duration: 'recent',
      // v3 defaults: all week_shape flags true so every direction has has_space.
      week_shape: {
        work_dominates: true,
        weekends_consumed: true,
        weekly_activity: true,
        sees_people: true,
        makes_things: true,
        active_body: true,
        belongs_to_group: true,
        solo_practice: true,
        varied_week: true,
      },
      life_stage: 'drifting',
      sociality_default: 'balanced',
      paid_work_relationship: 'functional',
      primary_load: 'none',
      psychological_filtering: 'filters_some',
      role_consolidation: 'role_inflected',
      attention_pattern: 'intermittent',
      relational_presence: 'partial',
      ...overrides.cross_direction,
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
      spiritual: { current_state: 20, past_presence: 'no', wanting: 'doesnt_want' },
      ...overrides.domains,
    },
    constraints: {
      energy_availability: 50,
      time_availability: 50,
      body_capacity: 50,
      permission: 50,
      permission_sub_shape: 'present',
      ...overrides.constraints,
    },
    cross_cutting: {
      recent_life_shape_change: 'no',
      replacement_structure_exists: 'yes',
      recent_reaching: 'mid_stream',
      ...overrides.cross_cutting,
    },
    self_report: {
      named_absences: [],
    },
  };
}

function makeDomainOutputs(
  overrides: Partial<Record<DomainName, Partial<DomainPresenceOutput>>> = {},
): DomainPresenceOutput[] {
  return DOMAIN_NAMES.map((name) => ({
    domain: name,
    current_state: 80,
    fires: false,
    value: 'intact',
    ...overrides[name],
  }));
}

function findDirection(
  outputs: DirectionOutput[],
  name: DirectionName,
): DirectionOutput {
  const match = outputs.find((o) => o.direction === name);
  if (!match) throw new Error(`direction not found: ${name}`);
  return match;
}

/* ------------------------------------------------------------------ */

describe('A. Output structure', () => {
  it('always returns 6 entries, one per direction name', () => {
    const out = computeDirectionOutputs(makeInputMap(), makeDomainOutputs(), 0);
    expect(out).toHaveLength(6);
    const names = out.map((o) => o.direction).sort();
    expect(names).toEqual([
      'contributor',
      'creator',
      'experience_seeker',
      'freedom_designer',
      'growth_focused',
      'relationship_rebuilder',
    ]);
  });

  it('sorts by pull desc with alphabetical tiebreak', () => {
    // contribution pull=80, freedom & making pull=50, others pull=0
    const input = makeInputMap({
      directions: {
        contributor: {
          stated_strength: 100,
          felt_cost: 50,
          anticipation: 'quickening',
          recent_action: 'recent',
        },
        freedom_designer: { stated_strength: 100, recent_action: 'recent' },
        creator: { stated_strength: 100, recent_action: 'recent' },
      },
    });
    const out = computeDirectionOutputs(input, makeDomainOutputs(), 0);
    expect(out.map((o) => o.direction)).toEqual([
      'contributor',
      'creator',
      'freedom_designer',
      'experience_seeker',
      'growth_focused',
      'relationship_rebuilder',
    ]);
  });
});

describe('B. Pull and movement passthrough', () => {
  it('pull and movement match derivation outputs', () => {
    const dir = makeDirectionInputs({
      stated_strength: 70,
      felt_cost: 40,
      anticipation: 'mild',
      current_movement: 33,
      recent_action: 'some',
      specificity: 'partial',
    });
    const input = makeInputMap({ directions: { creator: dir } });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.pull).toBeCloseTo(computePull(dir), 6);
    expect(out.movement).toBeCloseTo(computeMovement(dir), 6);
  });
});

describe('C. Quadrant', () => {
  it('high pull + high movement → active', () => {
    const input = makeInputMap({
      directions: {
        creator: {
          stated_strength: 100,
          felt_cost: 100,
          anticipation: 'quickening',
          recent_action: 'recent',
          specificity: 'strong',
          current_movement: 80,
        },
      },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.quadrant).toBe('active');
  });

  it('high pull + low movement → blocked', () => {
    const input = makeInputMap({
      directions: {
        creator: {
          stated_strength: 100,
          recent_action: 'recent',
          current_movement: 10,
        },
      },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.quadrant).toBe('blocked');
  });

  it('low pull + high movement → habit', () => {
    const input = makeInputMap({
      directions: {
        creator: { current_movement: 80 },
      },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.quadrant).toBe('habit');
  });

  it('low pull + low movement → quiet', () => {
    const input = makeInputMap();
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.quadrant).toBe('quiet');
  });

  it('boundary pull=50 movement=50 → active', () => {
    const input = makeInputMap({
      directions: {
        creator: {
          stated_strength: 100,
          recent_action: 'recent',
          current_movement: 50,
        },
      },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.pull).toBeCloseTo(50, 6);
    expect(out.movement).toBeCloseTo(50, 6);
    expect(out.quadrant).toBe('active');
  });

  it('boundary pull=49.7 movement=50 → habit', () => {
    const input = makeInputMap({
      directions: {
        creator: {
          stated_strength: 99,
          recent_action: 'recent',
          current_movement: 50,
        },
      },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.pull).toBeLessThan(50);
    expect(out.quadrant).toBe('habit');
  });
});

describe('D. Past relationship', () => {
  const highPull = {
    stated_strength: 100,
    recent_action: 'recent' as const,
  };

  it('high pull + past_presence yes → returning', () => {
    const input = makeInputMap({
      directions: { creator: { ...highPull, past_presence: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.past_relationship).toBe('returning');
  });

  it('high pull + past_presence no → new', () => {
    const input = makeInputMap({
      directions: { creator: { ...highPull, past_presence: 'no' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.past_relationship).toBe('new');
  });

  it('low pull + past_presence yes → was_once', () => {
    const input = makeInputMap({
      directions: { creator: { past_presence: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.past_relationship).toBe('was_once');
  });

  it('low pull + past_presence no → never_been_part_of_life', () => {
    const input = makeInputMap({
      directions: { creator: { past_presence: 'no' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.past_relationship).toBe('never_been_part_of_life');
  });
});

describe('E. Specificity (identity)', () => {
  for (const v of ['none', 'partial', 'strong'] as const) {
    it(`passes through specificity="${v}"`, () => {
      const input = makeInputMap({
        directions: { creator: { specificity: v } },
      });
      const out = findDirection(
        computeDirectionOutputs(input, makeDomainOutputs(), 0),
        'creator',
      );
      expect(out.specificity).toBe(v);
    });
  }
});

describe('F. Pull state', () => {
  it('held_attributed_with_expression fires when specificity=strong and has_space', () => {
    const input = makeInputMap({
      directions: { creator: { specificity: 'strong' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.pull_state).toContain('held_attributed_with_expression');
  });

  it('stopped_expecting fires when stopped_expecting=yes', () => {
    const input = makeInputMap({
      directions: { creator: { stopped_expecting: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.pull_state).toContain('stopped_expecting');
  });

  it('capacity_strain fires when capacity_strain=yes AND pull>=50', () => {
    const input = makeInputMap({
      cross_direction: {
        direction_chosen: 'none',
        capacity_strain: 'yes',
        life_shape_duration: 'recent',
      },
      directions: {
        creator: { stated_strength: 100, recent_action: 'recent' },
      },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.pull).toBeCloseTo(50, 6);
    expect(out.pull_state).toContain('capacity_strain');
  });

  it('capacity_strain does NOT fire when pull<50 even if capacity_strain=yes', () => {
    const input = makeInputMap({
      cross_direction: {
        direction_chosen: 'none',
        capacity_strain: 'yes',
        life_shape_duration: 'recent',
      },
      directions: { creator: {} },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.pull_state).not.toContain('capacity_strain');
  });

  it('all three co-fire when all three conditions hold; correct order', () => {
    const input = makeInputMap({
      cross_direction: {
        direction_chosen: 'none',
        capacity_strain: 'yes',
        life_shape_duration: 'recent',
      },
      directions: {
        creator: {
          stated_strength: 100,
          recent_action: 'recent',
          specificity: 'strong',
          stopped_expecting: 'yes',
        },
      },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.pull_state).toEqual([
      'held_attributed_with_expression',
      'stopped_expecting',
      'capacity_strain',
    ]);
  });

  it('empty array when no condition holds', () => {
    const input = makeInputMap();
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.pull_state).toEqual([]);
  });
});

describe('G. was_once_renders — Growth special case', () => {
  it('low pull + past_presence yes → true (regardless of domains)', () => {
    const input = makeInputMap({
      directions: { growth_focused: { past_presence: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'growth_focused',
    );
    expect(out.past_relationship).toBe('was_once');
    expect(out.was_once_renders).toBe(true);
  });

  it('low pull + past_presence no → false', () => {
    const input = makeInputMap({
      directions: { growth_focused: { past_presence: 'no' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'growth_focused',
    );
    expect(out.was_once_renders).toBe(false);
  });

  it('high pull + past_presence yes → false (returning, not was_once)', () => {
    const input = makeInputMap({
      directions: {
        growth_focused: {
          stated_strength: 100,
          recent_action: 'recent',
          past_presence: 'yes',
        },
      },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'growth_focused',
    );
    expect(out.past_relationship).toBe('returning');
    expect(out.was_once_renders).toBe(false);
  });
});

describe('H. was_once_renders — single-domain pairs', () => {
  function inputWasOnce(direction: DirectionName): InputMap {
    return makeInputMap({ directions: { [direction]: { past_presence: 'yes' } } });
  }

  it('Freedom: was_once + time_as_yours fires → true', () => {
    const out = findDirection(
      computeDirectionOutputs(
        inputWasOnce('freedom_designer'),
        makeDomainOutputs({ time_as_yours: { fires: true } }),
        0,
      ),
      'freedom_designer',
    );
    expect(out.was_once_renders).toBe(true);
  });

  it('Freedom: was_once + time_as_yours intact → false', () => {
    const out = findDirection(
      computeDirectionOutputs(inputWasOnce('freedom_designer'), makeDomainOutputs(), 0),
      'freedom_designer',
    );
    expect(out.past_relationship).toBe('was_once');
    expect(out.was_once_renders).toBe(false);
  });

  it('Freedom: high pull (returning) + time_as_yours fires → false', () => {
    const input = makeInputMap({
      directions: {
        freedom_designer: {
          stated_strength: 100,
          recent_action: 'recent',
          past_presence: 'yes',
        },
      },
    });
    const out = findDirection(
      computeDirectionOutputs(
        input,
        makeDomainOutputs({ time_as_yours: { fires: true } }),
        0,
      ),
      'freedom_designer',
    );
    expect(out.was_once_renders).toBe(false);
  });

  it('Making: was_once + making domain fires → true', () => {
    const out = findDirection(
      computeDirectionOutputs(
        inputWasOnce('creator'),
        makeDomainOutputs({ making: { fires: true } }),
        0,
      ),
      'creator',
    );
    expect(out.was_once_renders).toBe(true);
  });

  it('Making: was_once + making domain intact → false', () => {
    const out = findDirection(
      computeDirectionOutputs(inputWasOnce('creator'), makeDomainOutputs(), 0),
      'creator',
    );
    expect(out.was_once_renders).toBe(false);
  });

  it('Contribution: was_once + mattering fires → true', () => {
    const out = findDirection(
      computeDirectionOutputs(
        inputWasOnce('contributor'),
        makeDomainOutputs({ mattering: { fires: true } }),
        0,
      ),
      'contributor',
    );
    expect(out.was_once_renders).toBe(true);
  });

  it('Contribution: was_once + mattering intact → false', () => {
    const out = findDirection(
      computeDirectionOutputs(
        inputWasOnce('contributor'),
        makeDomainOutputs(),
        0,
      ),
      'contributor',
    );
    expect(out.was_once_renders).toBe(false);
  });
});

describe('I. was_once_renders — multi-domain pairs', () => {
  it('Experience: was_once + curiosity fires → true', () => {
    const input = makeInputMap({
      directions: { experience_seeker: { past_presence: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(
        input,
        makeDomainOutputs({ curiosity: { fires: true } }),
        0,
      ),
      'experience_seeker',
    );
    expect(out.was_once_renders).toBe(true);
  });

  it('Experience: was_once + felt_aliveness fires → true', () => {
    const input = makeInputMap({
      directions: { experience_seeker: { past_presence: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(
        input,
        makeDomainOutputs({ felt_aliveness: { fires: true } }),
        0,
      ),
      'experience_seeker',
    );
    expect(out.was_once_renders).toBe(true);
  });

  it('Experience: was_once + both intact → false', () => {
    const input = makeInputMap({
      directions: { experience_seeker: { past_presence: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'experience_seeker',
    );
    expect(out.was_once_renders).toBe(false);
  });

  it('Experience: was_once + both fire → true', () => {
    const input = makeInputMap({
      directions: { experience_seeker: { past_presence: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(
        input,
        makeDomainOutputs({
          curiosity: { fires: true },
          felt_aliveness: { fires: true },
        }),
        0,
      ),
      'experience_seeker',
    );
    expect(out.was_once_renders).toBe(true);
  });

  it('Relationship: was_once + only friendship fires → true', () => {
    const input = makeInputMap({
      directions: { relationship_rebuilder: { past_presence: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(
        input,
        makeDomainOutputs({ friendship: { fires: true } }),
        0,
      ),
      'relationship_rebuilder',
    );
    expect(out.was_once_renders).toBe(true);
  });

  it('Relationship: was_once + all four intact → false', () => {
    const input = makeInputMap({
      directions: { relationship_rebuilder: { past_presence: 'yes' } },
    });
    const out = findDirection(
      computeDirectionOutputs(input, makeDomainOutputs(), 0),
      'relationship_rebuilder',
    );
    expect(out.was_once_renders).toBe(false);
  });
});

describe('J. Surfacing — threshold met', () => {
  it('one direction with pull=60, others 0 → only that one surfaced', () => {
    const input = makeInputMap({
      directions: {
        creator: {
          stated_strength: 100,
          felt_cost: 50,
          recent_action: 'recent',
        },
      },
    });
    const out = computeDirectionOutputs(input, makeDomainOutputs(), 0);
    for (const o of out) {
      expect(o.surfaced).toBe(o.direction === 'creator');
    }
  });

  it('one direction with movement=60, pull=0 → that one surfaced', () => {
    const input = makeInputMap({
      directions: { creator: { current_movement: 60 } },
    });
    const out = computeDirectionOutputs(input, makeDomainOutputs(), 0);
    expect(findDirection(out, 'creator').surfaced).toBe(true);
    for (const o of out) {
      if (o.direction !== 'creator') expect(o.surfaced).toBe(false);
    }
  });

  it('three directions cross threshold → all three surface', () => {
    const input = makeInputMap({
      directions: {
        creator: { stated_strength: 100, recent_action: 'recent' },
        freedom_designer: { stated_strength: 100, recent_action: 'recent' },
        experience_seeker: { current_movement: 90 },
      },
    });
    const out = computeDirectionOutputs(input, makeDomainOutputs(), 0);
    const surfacedNames = out.filter((o) => o.surfaced).map((o) => o.direction).sort();
    expect(surfacedNames).toEqual(['creator', 'experience_seeker', 'freedom_designer']);
  });

  it('boundary pull=50 surfaces; pull=49.7 does not (with another direction crossing threshold)', () => {
    const input = makeInputMap({
      directions: {
        creator: {
          stated_strength: 100,
          felt_cost: 50,
          anticipation: 'quickening',
          recent_action: 'recent',
        }, // pull=80
        contributor: { stated_strength: 100, recent_action: 'recent' }, // pull=50
        freedom_designer: { stated_strength: 99, recent_action: 'recent' }, // pull=49.7
      },
    });
    const out = computeDirectionOutputs(input, makeDomainOutputs(), 0);
    expect(findDirection(out, 'creator').surfaced).toBe(true);
    expect(findDirection(out, 'contributor').surfaced).toBe(true);
    expect(findDirection(out, 'freedom_designer').surfaced).toBe(false);
  });

  it('boundary movement=50 surfaces; movement=49.999 does not', () => {
    const input = makeInputMap({
      directions: {
        creator: {
          stated_strength: 100,
          felt_cost: 50,
          anticipation: 'quickening',
          recent_action: 'recent',
        }, // crosses threshold so fallback won't fire
        contributor: { current_movement: 50 },
        freedom_designer: { current_movement: 49.999 },
      },
    });
    const out = computeDirectionOutputs(input, makeDomainOutputs(), 0);
    expect(findDirection(out, 'contributor').surfaced).toBe(true);
    expect(findDirection(out, 'freedom_designer').surfaced).toBe(false);
  });
});

describe('K. Surfacing — threshold not met (fallback)', () => {
  it('contribution pull=30, others 10 → only contribution surfaced', () => {
    const input = makeInputMap({
      directions: {
        contributor: { stated_strength: 100 }, // pull=30
        experience_seeker: { anticipation: 'mild' }, // pull=10
        freedom_designer: { anticipation: 'mild' },
        growth_focused: { anticipation: 'mild' },
        creator: { anticipation: 'mild' },
        relationship_rebuilder: { anticipation: 'mild' },
      },
    });
    const out = computeDirectionOutputs(input, makeDomainOutputs(), 0);
    for (const o of out) {
      expect(o.surfaced).toBe(o.direction === 'contributor');
    }
  });

  it('tiebreak alphabetical: contribution and experience tied at top → contribution surfaces', () => {
    const input = makeInputMap({
      directions: {
        contributor: { stated_strength: 100 }, // pull=30
        experience_seeker: { stated_strength: 100 }, // pull=30
        freedom_designer: { anticipation: 'mild' }, // pull=10
        growth_focused: { anticipation: 'mild' },
        creator: { anticipation: 'mild' },
        relationship_rebuilder: { anticipation: 'mild' },
      },
    });
    const out = computeDirectionOutputs(input, makeDomainOutputs(), 0);
    expect(findDirection(out, 'contributor').surfaced).toBe(true);
    expect(findDirection(out, 'experience_seeker').surfaced).toBe(false);
  });

  it('all six pull=0 movement=0 → only contribution surfaces', () => {
    const out = computeDirectionOutputs(makeInputMap(), makeDomainOutputs(), 0);
    for (const o of out) {
      expect(o.surfaced).toBe(o.direction === 'contributor');
    }
  });

  it('at least one direction always surfaces', () => {
    for (const _scenario of [
      makeInputMap(),
      makeInputMap({ directions: { creator: { current_movement: 80 } } }),
      makeInputMap({
        directions: { contributor: { stated_strength: 100, recent_action: 'recent' } },
      }),
    ]) {
      const out = computeDirectionOutputs(_scenario, makeDomainOutputs(), 0);
      expect(out.some((o) => o.surfaced)).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Pull-quality test helpers                                          */
/* ------------------------------------------------------------------ */

function pullQualityFor(
  directionInputs: Partial<PerDirectionInputs>,
  opts: {
    sustained?: number;
    life_shape_duration?: InputMap['cross_direction']['life_shape_duration'];
    direction_chosen?: InputMap['cross_direction']['direction_chosen'];
    capacity_strain?: 'yes' | 'no';
    direction?: DirectionName;
    /** Per-direction would_reach_for overrides. Defaults to "no" for all. */
    reach?: Partial<Record<DirectionName, 'yes' | 'no'>>;
  } = {},
) {
  const target: DirectionName = opts.direction ?? 'creator';
  const reach = opts.reach ?? {};
  const dirOverrides: Partial<Record<DirectionName, Partial<PerDirectionInputs>>> = {};
  for (const n of DIRECTION_NAMES) {
    dirOverrides[n] = { would_reach_for: reach[n] ?? 'no' };
  }
  // target's per-direction inputs override
  dirOverrides[target] = {
    ...dirOverrides[target],
    ...directionInputs,
    would_reach_for: directionInputs.would_reach_for ?? reach[target] ?? 'no',
  };

  const input = makeInputMap({
    directions: dirOverrides,
    cross_direction: {
      direction_chosen: opts.direction_chosen ?? 'none',
      capacity_strain: opts.capacity_strain ?? 'no',
      life_shape_duration: opts.life_shape_duration ?? 'recent',
    },
  });
  const out = computeDirectionOutputs(
    input,
    makeDomainOutputs(),
    opts.sustained ?? 0,
  );
  return findDirection(out, target).pull_quality;
}

/* ------------------------------------------------------------------ */
/* M. Preconditions                                                   */
/* ------------------------------------------------------------------ */

describe('M. Pull-quality preconditions', () => {
  it('neither precondition holds → empty', () => {
    const q = pullQualityFor({}, { sustained: 30, life_shape_duration: 'recent' });
    expect(q).toEqual([]);
  });

  it('preA holds via pull>=30 → branches evaluated; benign baseline → ["real"]', () => {
    const q = pullQualityFor(
      { stated_strength: 40, recent_action: 'recent' },
      { sustained: 30 },
    );
    expect(q).toEqual(['real']);
  });

  it('preA holds via stated_strength>=50 → branches evaluated; non-empty', () => {
    const q = pullQualityFor({ stated_strength: 50 }, { sustained: 30 });
    expect(q.length).toBeGreaterThan(0);
  });

  it('only preB holds → exactly ["suppressed"], even with saturation=yes', () => {
    const q = pullQualityFor(
      { stated_strength: 0, past_presence: 'yes', saturation: 'yes' },
      { sustained: 70, life_shape_duration: 'long' },
    );
    expect(q).toEqual(['suppressed']);
  });

  it('both preconditions hold → all branches; deep fires; suppressed included', () => {
    const q = pullQualityFor(
      {
        stated_strength: 40,
        recent_action: 'recent',
        past_presence: 'yes',
      },
      { sustained: 70, life_shape_duration: 'long' },
    );
    expect(q).toContain('suppressed');
  });

  it('both preconditions + saturation=yes → both saturated and suppressed fire', () => {
    const q = pullQualityFor(
      {
        stated_strength: 40,
        recent_action: 'recent',
        past_presence: 'yes',
        saturation: 'yes',
      },
      { sustained: 70, life_shape_duration: 'long' },
    );
    expect(q).toContain('saturated');
    expect(q).toContain('suppressed');
  });

  it('boundary preA via pull=30 exactly → preA holds; pull_quality non-empty (real)', () => {
    const q = pullQualityFor(
      { recent_action: 'recent', specificity: 'strong' },
      { sustained: 30 },
    );
    expect(q).toEqual(['real']);
  });

  it('boundary preA via pull=25 (just below 30) → empty', () => {
    const q = pullQualityFor(
      { anticipation: 'mild', recent_action: 'some', specificity: 'partial' },
      { sustained: 30 },
    );
    expect(q).toEqual([]);
  });

  it('boundary preA via stated_strength=50 → non-empty; stated_strength=49 → empty', () => {
    expect(pullQualityFor({ stated_strength: 50 }, { sustained: 30 }).length).toBeGreaterThan(0);
    expect(pullQualityFor({ stated_strength: 49 }, { sustained: 30 })).toEqual([]);
  });

  it('boundary preB sustained=70 satisfies; =69 fails (with stated low, past=yes, life=long)', () => {
    expect(
      pullQualityFor(
        { stated_strength: 0, past_presence: 'yes' },
        { sustained: 70, life_shape_duration: 'long' },
      ),
    ).toEqual(['suppressed']);
    expect(
      pullQualityFor(
        { stated_strength: 0, past_presence: 'yes' },
        { sustained: 69, life_shape_duration: 'long' },
      ),
    ).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* N. Branches in isolation                                           */
/* ------------------------------------------------------------------ */

// B1 re-pointed phantom/phantom_partial from stated_strength to stated_allocation.
// These tests assert the pre-B1 stated_strength-keyed mechanism and are expected to fail
// until the suite is rebuilt to drive stated_allocation (and, once the £70 question ships,
// to run through the full pipeline). Do not 'fix' by setting stated_allocation here — that
// would test an unreachable production value. See b1-allocation-phantom.test.ts for the
// new-behaviour coverage.

describe('N. Pull-quality branches in isolation', () => {
  it('Saturated alone', () => {
    const q = pullQualityFor(
      {
        stated_strength: 0,
        recent_action: 'recent',
        anticipation: 'quickening',
        saturation: 'yes',
      },
      { sustained: 30 },
    );
    expect(q).toEqual(['saturated']);
  });

  // RECALIBRATION PENDING: Phantom threshold (allocation≥50) is provisional pending real £70 data.
  it('Phantom alone', () => {
    const q = pullQualityFor(
      {
        stated_allocation: 50,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        would_reach_for: 'no',
        past_presence: 'no',
        saturation: 'no',
      },
      { sustained: 40, direction_chosen: 'none' },
    );
    expect(q).toEqual(['phantom']);
  });

  // RECALIBRATION PENDING: Phantom_partial threshold (allocation≥35 & <50) is provisional pending real £70 data.
  it('Phantom (partial) alone', () => {
    const q = pullQualityFor(
      {
        stated_allocation: 35,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        would_reach_for: 'no',
        past_presence: 'no',
        saturation: 'no',
      },
      { sustained: 40, direction_chosen: 'none' },
    );
    expect(q).toEqual(['phantom_partial']);
  });

  it('Suppressed standard alone (felt_cost path)', () => {
    const q = pullQualityFor(
      {
        stated_strength: 30,
        felt_cost: 60,
        anticipation: 'mild',
        past_presence: 'yes',
      },
      { sustained: 60, life_shape_duration: 'sustained' },
    );
    expect(q).toEqual(['suppressed']);
  });

  it('Suppressed standard alone (anticipation path)', () => {
    const q = pullQualityFor(
      {
        stated_strength: 30,
        felt_cost: 0,
        anticipation: 'quickening',
        recent_action: 'some',
        past_presence: 'yes',
      },
      { sustained: 60, life_shape_duration: 'sustained' },
    );
    expect(q).toEqual(['suppressed']);
  });

  it('Suppressed deep within preA (preA holds via pull)', () => {
    const q = pullQualityFor(
      {
        stated_strength: 30,
        recent_action: 'recent',
        specificity: 'strong',
        past_presence: 'yes',
      },
      { sustained: 70, life_shape_duration: 'long' },
    );
    expect(q).toEqual(['suppressed']);
  });

  it('Behaviourally divergent alone (direction_chosen = different direction)', () => {
    const q = pullQualityFor(
      {
        stated_strength: 60,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        past_presence: 'yes',
        saturation: 'no',
      },
      {
        sustained: 30,
        direction: 'creator',
        direction_chosen: 'freedom_designer',
        reach: { freedom_designer: 'yes' },
      },
    );
    expect(q).toEqual(['behaviourally_divergent']);
  });

  it('Behaviourally divergent fires when direction_chosen = "rest"', () => {
    const q = pullQualityFor(
      {
        stated_strength: 60,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        past_presence: 'yes',
        saturation: 'no',
      },
      { sustained: 30, direction_chosen: 'rest' },
    );
    expect(q).toEqual(['behaviourally_divergent']);
  });

  it('Behaviourally divergent does NOT fire when direction_chosen = "none" → real', () => {
    const q = pullQualityFor(
      {
        stated_strength: 60,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        past_presence: 'yes',
        saturation: 'no',
      },
      { sustained: 30, direction_chosen: 'none' },
    );
    expect(q).toEqual(['real']);
  });

  it('Behaviourally divergent does NOT fire when direction_chosen = same direction → real', () => {
    const q = pullQualityFor(
      {
        stated_strength: 60,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        past_presence: 'yes',
        saturation: 'no',
      },
      {
        sustained: 30,
        direction: 'creator',
        direction_chosen: 'creator',
        reach: { creator: 'yes' },
      },
    );
    expect(q).toEqual(['real']);
  });

  it('Real alone', () => {
    // past_presence=yes closes Phantom/Phantom-partial (which require "no");
    // stated_strength=50 closes Suppressed (needs <50) and BD (needs >=60).
    const q = pullQualityFor(
      {
        stated_strength: 50,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        past_presence: 'yes',
        saturation: 'no',
      },
      { sustained: 30, direction_chosen: 'none' },
    );
    expect(q).toEqual(['real']);
  });
});

/* ------------------------------------------------------------------ */
/* O. Conjunctive condition coverage                                  */
/* ------------------------------------------------------------------ */

// B1 re-pointed phantom/phantom_partial from stated_strength to stated_allocation.
// These tests assert the pre-B1 stated_strength-keyed mechanism and are expected to fail
// until the suite is rebuilt to drive stated_allocation (and, once the £70 question ships,
// to run through the full pipeline). Do not 'fix' by setting stated_allocation here — that
// would test an unreachable production value. See b1-allocation-phantom.test.ts for the
// new-behaviour coverage.

describe('O. Phantom one-off failure tests', () => {
  // RECALIBRATION PENDING: Phantom threshold (allocation≥50) is provisional pending real £70 data.
  const phantomBase: Partial<PerDirectionInputs> = {
    stated_allocation: 50,
    felt_cost: 0,
    anticipation: 'none',
    recent_action: 'none',
    would_reach_for: 'no',
    past_presence: 'no',
    saturation: 'no',
  };
  const phantomOpts = { sustained: 40, direction_chosen: 'none' as const };

  it('baseline fires phantom', () => {
    expect(pullQualityFor(phantomBase, phantomOpts)).toEqual(['phantom']);
  });

  // RECALIBRATION PENDING: Phantom threshold (allocation≥50) is provisional pending real £70 data.
  it('allocation=50 → phantom; allocation=49 → phantom_partial (50-boundary)', () => {
    const q50 = pullQualityFor({ ...phantomBase, stated_allocation: 50 }, phantomOpts);
    expect(q50).toContain('phantom');
    expect(q50).not.toContain('phantom_partial');

    const q49 = pullQualityFor({ ...phantomBase, stated_allocation: 49 }, phantomOpts);
    expect(q49).toContain('phantom_partial');
    expect(q49).not.toContain('phantom');
  });

  it('felt_cost=30 → not phantom', () => {
    const q = pullQualityFor({ ...phantomBase, felt_cost: 30 }, phantomOpts);
    expect(q).not.toContain('phantom');
  });

  it('anticipation=quickening → not phantom', () => {
    const q = pullQualityFor(
      { ...phantomBase, anticipation: 'quickening' },
      phantomOpts,
    );
    expect(q).not.toContain('phantom');
  });

  it('recent_action=some → not phantom', () => {
    const q = pullQualityFor(
      { ...phantomBase, recent_action: 'some' },
      phantomOpts,
    );
    expect(q).not.toContain('phantom');
  });

  it('would_reach_for=yes → not phantom', () => {
    const q = pullQualityFor(
      { ...phantomBase, would_reach_for: 'yes' },
      phantomOpts,
    );
    expect(q).not.toContain('phantom');
  });

  it('past_presence=yes → not phantom', () => {
    const q = pullQualityFor(
      { ...phantomBase, past_presence: 'yes' },
      phantomOpts,
    );
    expect(q).not.toContain('phantom');
  });

  it('sustained=50 → not phantom', () => {
    const q = pullQualityFor(phantomBase, { ...phantomOpts, sustained: 50 });
    expect(q).not.toContain('phantom');
  });
});

// B1 re-pointed phantom/phantom_partial from stated_strength to stated_allocation.
// These tests assert the pre-B1 stated_strength-keyed mechanism and are expected to fail
// until the suite is rebuilt to drive stated_allocation (and, once the £70 question ships,
// to run through the full pipeline). Do not 'fix' by setting stated_allocation here — that
// would test an unreachable production value. See b1-allocation-phantom.test.ts for the
// new-behaviour coverage.

describe('O. Phantom partial one-off failure tests', () => {
  // RECALIBRATION PENDING: Phantom_partial threshold (allocation≥35 & <50) is provisional pending real £70 data.
  const base: Partial<PerDirectionInputs> = {
    stated_allocation: 35,
    felt_cost: 0,
    anticipation: 'none',
    recent_action: 'none',
    would_reach_for: 'no',
    past_presence: 'no',
    saturation: 'no',
  };
  const opts = { sustained: 40, direction_chosen: 'none' as const };

  it('baseline fires phantom_partial', () => {
    expect(pullQualityFor(base, opts)).toEqual(['phantom_partial']);
  });

  // RECALIBRATION PENDING: Phantom_partial threshold (allocation≥35) is provisional pending real £70 data.
  it('allocation=35 → phantom_partial; allocation=34 → real (35-boundary)', () => {
    const q35 = pullQualityFor({ ...base, stated_allocation: 35 }, opts);
    expect(q35).toContain('phantom_partial');
    expect(q35).not.toContain('phantom');

    const q34 = pullQualityFor({ ...base, stated_allocation: 34 }, opts);
    expect(q34).toEqual(['real']);
    expect(q34).not.toContain('phantom_partial');
    expect(q34).not.toContain('phantom');
  });

  it('felt_cost=30 → not phantom_partial', () => {
    const q = pullQualityFor({ ...base, felt_cost: 30 }, opts);
    expect(q).not.toContain('phantom_partial');
  });

  it('anticipation=quickening → not phantom_partial', () => {
    const q = pullQualityFor({ ...base, anticipation: 'quickening' }, opts);
    expect(q).not.toContain('phantom_partial');
  });

  it('recent_action=some → not phantom_partial', () => {
    const q = pullQualityFor({ ...base, recent_action: 'some' }, opts);
    expect(q).not.toContain('phantom_partial');
  });

  it('would_reach_for=yes → not phantom_partial', () => {
    const q = pullQualityFor({ ...base, would_reach_for: 'yes' }, opts);
    expect(q).not.toContain('phantom_partial');
  });

  it('past_presence=yes → not phantom_partial', () => {
    const q = pullQualityFor({ ...base, past_presence: 'yes' }, opts);
    expect(q).not.toContain('phantom_partial');
  });

  it('sustained=50 → not phantom_partial', () => {
    const q = pullQualityFor(base, { ...opts, sustained: 50 });
    expect(q).not.toContain('phantom_partial');
  });
});

describe('O. Suppressed standard one-off failure tests', () => {
  const base: Partial<PerDirectionInputs> = {
    stated_strength: 30,
    felt_cost: 60,
    anticipation: 'mild',
    past_presence: 'yes',
  };
  const opts = { sustained: 60, life_shape_duration: 'sustained' as const };

  it('baseline fires suppressed (standard)', () => {
    expect(pullQualityFor(base, opts)).toEqual(['suppressed']);
  });

  it('stated_strength=50 → not suppressed', () => {
    const q = pullQualityFor({ ...base, stated_strength: 50 }, opts);
    expect(q).not.toContain('suppressed');
  });

  it('felt_cost=49 with anticipation=mild → not suppressed', () => {
    const q = pullQualityFor(
      { ...base, felt_cost: 49, anticipation: 'mild' },
      opts,
    );
    expect(q).not.toContain('suppressed');
  });

  it('past_presence=no → not suppressed', () => {
    const q = pullQualityFor({ ...base, past_presence: 'no' }, opts);
    expect(q).not.toContain('suppressed');
  });

  it('sustained=59 → not suppressed', () => {
    const q = pullQualityFor(base, { ...opts, sustained: 59 });
    expect(q).not.toContain('suppressed');
  });

  it('life_shape_duration=recent → not suppressed', () => {
    const q = pullQualityFor(base, {
      ...opts,
      life_shape_duration: 'recent',
    });
    expect(q).not.toContain('suppressed');
  });
});

describe('O. Suppressed deep one-off failure tests', () => {
  // Set base such that ONLY deep is eligible (standard branch's felt_cost/anticipation
  // path is closed) and preA holds via pull, so we are in the all-branches-evaluated path.
  const base: Partial<PerDirectionInputs> = {
    stated_strength: 30,
    felt_cost: 0,
    anticipation: 'none',
    recent_action: 'recent',
    specificity: 'strong',
    past_presence: 'yes',
  };
  const opts = { sustained: 70, life_shape_duration: 'long' as const };

  it('baseline fires suppressed (deep only)', () => {
    expect(pullQualityFor(base, opts)).toEqual(['suppressed']);
  });

  it('stated_strength=50 → not suppressed (preB closed; standard also closed)', () => {
    const q = pullQualityFor({ ...base, stated_strength: 50 }, opts);
    expect(q).not.toContain('suppressed');
  });

  it('past_presence=no → not suppressed', () => {
    const q = pullQualityFor({ ...base, past_presence: 'no' }, opts);
    expect(q).not.toContain('suppressed');
  });

  it('sustained=69 → not suppressed', () => {
    const q = pullQualityFor(base, { ...opts, sustained: 69 });
    expect(q).not.toContain('suppressed');
  });

  it('life_shape_duration=sustained → not suppressed', () => {
    const q = pullQualityFor(base, {
      ...opts,
      life_shape_duration: 'sustained',
    });
    expect(q).not.toContain('suppressed');
  });
});

/* ------------------------------------------------------------------ */
/* P. Co-firing                                                       */
/* ------------------------------------------------------------------ */

describe('P. Pull-quality co-firing', () => {
  // RECALIBRATION PENDING: Phantom threshold (allocation≥50) is provisional pending real £70 data.
  it('Saturated + Phantom (in push order)', () => {
    const q = pullQualityFor(
      {
        stated_allocation: 50,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        would_reach_for: 'no',
        past_presence: 'no',
        saturation: 'yes',
      },
      { sustained: 40, direction_chosen: 'none' },
    );
    expect(q).toEqual(['saturated', 'phantom']);
  });

  // RECALIBRATION PENDING: Phantom_partial threshold (allocation≥35) is provisional pending real £70 data.
  it('Saturated + Phantom (partial)', () => {
    const q = pullQualityFor(
      {
        stated_allocation: 35,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        would_reach_for: 'no',
        past_presence: 'no',
        saturation: 'yes',
      },
      { sustained: 40, direction_chosen: 'none' },
    );
    expect(q).toEqual(['saturated', 'phantom_partial']);
  });

  it('Saturated + Suppressed', () => {
    const q = pullQualityFor(
      {
        stated_strength: 30,
        felt_cost: 60,
        anticipation: 'mild',
        past_presence: 'yes',
        saturation: 'yes',
      },
      { sustained: 60, life_shape_duration: 'sustained' },
    );
    expect(q).toEqual(['saturated', 'suppressed']);
  });

  it('Saturated + Behaviourally divergent', () => {
    const q = pullQualityFor(
      {
        stated_strength: 60,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        past_presence: 'yes',
        saturation: 'yes',
      },
      {
        sustained: 30,
        direction: 'creator',
        direction_chosen: 'freedom_designer',
        reach: { freedom_designer: 'yes' },
      },
    );
    expect(q).toEqual(['saturated', 'behaviourally_divergent']);
  });

  // B1-d REGRESSION CHECK: Phantom must block behaviourally_divergent.
  // RECALIBRATION PENDING: Phantom threshold (allocation≥50) is provisional pending real £70 data.
  it('Saturated + Phantom blocks Behaviourally divergent', () => {
    const q = pullQualityFor(
      {
        stated_allocation: 50,
        stated_strength: 60,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        would_reach_for: 'no',
        past_presence: 'no',
        saturation: 'yes',
      },
      {
        sustained: 40,
        direction: 'creator',
        direction_chosen: 'freedom_designer',
        reach: { freedom_designer: 'yes' },
      },
    );
    expect(q).toEqual(['saturated', 'phantom']);
    expect(q).not.toContain('behaviourally_divergent');
  });

  it('Real fires alone — never co-fires', () => {
    const q = pullQualityFor(
      {
        stated_strength: 50,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        past_presence: 'yes',
        saturation: 'no',
      },
      { sustained: 30, direction_chosen: 'none' },
    );
    expect(q).toEqual(['real']);
    expect(q).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* Q. Mutual exclusivity                                              */
/* ------------------------------------------------------------------ */

// B1 re-pointed phantom/phantom_partial from stated_strength to stated_allocation.
// These tests assert the pre-B1 stated_strength-keyed mechanism and are expected to fail
// until the suite is rebuilt to drive stated_allocation (and, once the £70 question ships,
// to run through the full pipeline). Do not 'fix' by setting stated_allocation here — that
// would test an unreachable production value. See b1-allocation-phantom.test.ts for the
// new-behaviour coverage.

describe('Q. Phantom / Phantom-partial mutual exclusivity', () => {
  // RECALIBRATION PENDING: Phantom thresholds (allocation≥50, ≥35) are provisional pending real £70 data.
  const baseConditions: Partial<PerDirectionInputs> = {
    felt_cost: 0,
    anticipation: 'none',
    recent_action: 'none',
    would_reach_for: 'no',
    past_presence: 'no',
    saturation: 'no',
  };

  it('allocation=35 → phantom_partial only (mutual exclusivity)', () => {
    const q = pullQualityFor(
      { ...baseConditions, stated_allocation: 35 },
      { sustained: 40, direction_chosen: 'none' },
    );
    expect(q).toContain('phantom_partial');
    expect(q).not.toContain('phantom');
  });

  it('allocation=50 → phantom only (mutual exclusivity)', () => {
    const q = pullQualityFor(
      { ...baseConditions, stated_allocation: 50 },
      { sustained: 40, direction_chosen: 'none' },
    );
    expect(q).toContain('phantom');
    expect(q).not.toContain('phantom_partial');
  });

  it('Phantom and Suppressed cannot co-fire (structural via past_presence)', () => {
    // stated=75, past_presence=yes ⇒ Phantom fails (needs no), Suppressed needs <50.
    const q = pullQualityFor(
      {
        stated_strength: 75,
        felt_cost: 0,
        anticipation: 'none',
        recent_action: 'none',
        would_reach_for: 'no',
        past_presence: 'yes',
        saturation: 'no',
      },
      { sustained: 40, direction_chosen: 'none' },
    );
    expect(q).not.toContain('phantom');
    expect(q).not.toContain('suppressed');
    expect(q).toEqual(['real']);
  });
});

/* ------------------------------------------------------------------ */
/* R. Output structure                                                */
/* ------------------------------------------------------------------ */

describe('R. Pull-quality output structure', () => {
  it('pull_quality is always an array (never null/undefined)', () => {
    const out = computeDirectionOutputs(makeInputMap(), makeDomainOutputs(), 0);
    for (const o of out) {
      expect(Array.isArray(o.pull_quality)).toBe(true);
    }
  });

  it('each direction\'s pull_quality is independent of other directions\' inputs', () => {
    const baseline = computeDirectionOutputs(
      makeInputMap({
        directions: {
          creator: {
            stated_strength: 70,
            felt_cost: 0,
            anticipation: 'none',
            recent_action: 'none',
            past_presence: 'no',
          },
        },
      }),
      makeDomainOutputs(),
      40,
    );
    const perturbed = computeDirectionOutputs(
      makeInputMap({
        directions: {
          creator: {
            stated_strength: 70,
            felt_cost: 0,
            anticipation: 'none',
            recent_action: 'none',
            past_presence: 'no',
          },
          // Perturb a different direction.
          freedom_designer: {
            stated_strength: 100,
            saturation: 'yes',
            past_presence: 'yes',
          },
        },
      }),
      makeDomainOutputs(),
      40,
    );
    expect(findDirection(baseline, 'creator').pull_quality).toEqual(
      findDirection(perturbed, 'creator').pull_quality,
    );
  });
});

describe('Trust validated input — DIRECTION_NAMES sanity', () => {
  it('every direction in DIRECTION_NAMES appears exactly once in output', () => {
    const out = computeDirectionOutputs(makeInputMap(), makeDomainOutputs(), 0);
    for (const name of DIRECTION_NAMES) {
      expect(out.filter((o) => o.direction === name)).toHaveLength(1);
    }
  });
});
