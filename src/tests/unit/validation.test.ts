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

function corrupt(fn: (m: any) => void): unknown {
  const c: any = structuredClone(makeBaseline());
  fn(c);
  return c;
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

function expectFail(result: ReturnType<typeof validateInputMap>): ValidationError[] {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('unreachable');
  expect(result.errors.length).toBeGreaterThan(0);
  return result.errors;
}

describe('validateInputMap — happy paths', () => {
  it('accepts a complete valid InputMap', () => {
    const baseline = makeBaseline();
    const result = validateInputMap(baseline);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(baseline);
    }
  });

  it('accepts wanting omitted on all four universal-wanting domains and does not normalize', () => {
    const input = corrupt((m) => {
      delete m.domains.time_as_yours.wanting;
      delete m.domains.energy_as_resource.wanting;
      delete m.domains.felt_aliveness.wanting;
      delete m.domains.body_physical_aliveness.wanting;
    });
    const result = validateInputMap(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.domains.time_as_yours).not.toHaveProperty('wanting');
      expect(result.value.domains.energy_as_resource).not.toHaveProperty('wanting');
      expect(result.value.domains.felt_aliveness).not.toHaveProperty('wanting');
      expect(result.value.domains.body_physical_aliveness).not.toHaveProperty('wanting');
    }
  });

  it('accepts wanting="wants" on universal-wanting domains', () => {
    const input = corrupt((m) => {
      m.domains.time_as_yours.wanting = 'wants';
      m.domains.energy_as_resource.wanting = 'wants';
      m.domains.felt_aliveness.wanting = 'wants';
      m.domains.body_physical_aliveness.wanting = 'wants';
    });
    const result = validateInputMap(input);
    expect(result.ok).toBe(true);
  });

  it('accepts boundary numeric values 0 and 100', () => {
    const input = corrupt((m) => {
      m.directions.creator.stated_strength = 0;
      m.directions.creator.felt_cost = 100;
      m.constraints.energy_availability = 0;
      m.constraints.permission = 100;
      m.domains.curiosity.current_state = 0;
    });
    const result = validateInputMap(input);
    expect(result.ok).toBe(true);
  });
});

describe('Rule 1 — missing fields', () => {
  it('reports missing top-level directions', () => {
    const input = corrupt((m) => {
      delete m.directions;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'directions');
  });

  it('reports missing one of six direction entries', () => {
    const input = corrupt((m) => {
      delete m.directions.creator;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'directions.creator');
  });

  it('reports missing per-direction field stated_strength', () => {
    const input = corrupt((m) => {
      delete m.directions.creator.stated_strength;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'directions.creator.stated_strength');
  });

  it('reports missing one of eleven domain entries', () => {
    const input = corrupt((m) => {
      delete m.domains.curiosity;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'domains.curiosity');
  });

  it('reports missing per-domain field current_state', () => {
    const input = corrupt((m) => {
      delete m.domains.curiosity.current_state;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'domains.curiosity.current_state');
  });

  it('reports missing wanting on a non-universal-wanting domain (curiosity)', () => {
    const input = corrupt((m) => {
      delete m.domains.curiosity.wanting;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'domains.curiosity.wanting');
  });

  it('reports missing wanting on a non-universal-wanting domain (friendship)', () => {
    const input = corrupt((m) => {
      delete m.domains.friendship.wanting;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'domains.friendship.wanting');
  });

  it('reports missing constraints.permission_sub_shape', () => {
    const input = corrupt((m) => {
      delete m.constraints.permission_sub_shape;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'constraints.permission_sub_shape');
  });

  it('reports missing cross_direction.life_shape_duration', () => {
    const input = corrupt((m) => {
      delete m.cross_direction.life_shape_duration;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'cross_direction.life_shape_duration');
  });

});

describe('Strict — unknown fields', () => {
  it('reports unknown field at top level', () => {
    const input = corrupt((m) => {
      m.extra_top = 1;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'unknown_field', 'extra_top');
  });

  it('reports unknown field inside directions.creator', () => {
    const input = corrupt((m) => {
      m.directions.creator.bonus = 'x';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'unknown_field', 'directions.creator.bonus');
  });

  it('reports unknown field inside domains.curiosity', () => {
    const input = corrupt((m) => {
      m.domains.curiosity.extra = 1;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'unknown_field', 'domains.curiosity.extra');
  });

  it('reports unknown field inside constraints', () => {
    const input = corrupt((m) => {
      m.constraints.bonus = 1;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'unknown_field', 'constraints.bonus');
  });

  it('reports unknown field inside cross_cutting', () => {
    const input = corrupt((m) => {
      m.cross_cutting.extra = 'no';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'unknown_field', 'cross_cutting.extra');
  });
});

describe('Rule 2 — numeric range and type', () => {
  it('reports out_of_range for stated_strength=101', () => {
    const input = corrupt((m) => {
      m.directions.creator.stated_strength = 101;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'out_of_range', 'directions.creator.stated_strength');
  });

  it('reports out_of_range for energy_availability=-1', () => {
    const input = corrupt((m) => {
      m.constraints.energy_availability = -1;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'out_of_range', 'constraints.energy_availability');
  });

  it('reports out_of_range for current_state=NaN', () => {
    const input = corrupt((m) => {
      m.domains.curiosity.current_state = Number.NaN;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'out_of_range', 'domains.curiosity.current_state');
  });

  it('reports invalid_type for non-numeric stated_strength="high"', () => {
    const input = corrupt((m) => {
      m.directions.creator.stated_strength = 'high';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'invalid_type', 'directions.creator.stated_strength');
    expect(
      errors.find(
        (e) =>
          e.code === 'out_of_range' &&
          e.path === 'directions.creator.stated_strength',
      ),
    ).toBeUndefined();
  });
});

describe('Rule 3 — categorical values', () => {
  it('reports invalid_categorical for anticipation', () => {
    const input = corrupt((m) => {
      m.directions.creator.anticipation = 'sometimes';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'invalid_categorical', 'directions.creator.anticipation');
  });

  it('reports invalid_categorical for recent_action', () => {
    const input = corrupt((m) => {
      m.directions.creator.recent_action = 'maybe';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'invalid_categorical', 'directions.creator.recent_action');
  });

  it('reports invalid_categorical for direction_chosen', () => {
    const input = corrupt((m) => {
      m.cross_direction.direction_chosen = 'sleeping';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'invalid_categorical', 'cross_direction.direction_chosen');
  });

  it('reports invalid_categorical for permission_sub_shape', () => {
    const input = corrupt((m) => {
      m.constraints.permission_sub_shape = 'garbage';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'invalid_categorical', 'constraints.permission_sub_shape');
  });

  it('reports invalid_categorical for recent_reaching', () => {
    const input = corrupt((m) => {
      m.cross_cutting.recent_reaching = 'someday';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'invalid_categorical', 'cross_cutting.recent_reaching');
  });

  it('reports invalid_categorical for wanting on a non-universal-wanting domain', () => {
    const input = corrupt((m) => {
      m.domains.curiosity.wanting = 'maybe';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'invalid_categorical', 'domains.curiosity.wanting');
  });

  it('reports invalid_type when categorical given a non-string', () => {
    const input = corrupt((m) => {
      m.directions.creator.anticipation = 42;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'invalid_type', 'directions.creator.anticipation');
  });
});

describe('Rule 4 — would_reach_for / direction_chosen consistency', () => {
  it('accepts baseline (direction_chosen="creator", yes only on making)', () => {
    const result = validateInputMap(makeBaseline());
    expect(result.ok).toBe(true);
  });

  it('reports inconsistent when chosen direction has would_reach_for="no"', () => {
    const input = corrupt((m) => {
      m.directions.creator.would_reach_for = 'no';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(
      errors,
      'would_reach_for_inconsistent',
      'cross_direction.direction_chosen',
    );
  });

  it('reports inconsistent when two directions have would_reach_for="yes"', () => {
    const input = corrupt((m) => {
      m.directions.experience_seeker.would_reach_for = 'yes';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(
      errors,
      'would_reach_for_inconsistent',
      'cross_direction.direction_chosen',
    );
  });

  it('with direction_chosen="rest", any would_reach_for="yes" is inconsistent', () => {
    const input = corrupt((m) => {
      m.cross_direction.direction_chosen = 'rest';
      // baseline has making="yes"; need to set all to "no" then put one back to yes
      m.directions.creator.would_reach_for = 'yes';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(
      errors,
      'would_reach_for_inconsistent',
      'cross_direction.direction_chosen',
    );
  });

  it('with direction_chosen="rest" and all would_reach_for="no", valid', () => {
    const input = corrupt((m) => {
      m.cross_direction.direction_chosen = 'rest';
      m.directions.creator.would_reach_for = 'no';
    });
    const result = validateInputMap(input);
    expect(result.ok).toBe(true);
  });

  it('with direction_chosen="none", any would_reach_for="yes" is inconsistent', () => {
    const input = corrupt((m) => {
      m.cross_direction.direction_chosen = 'none';
      // baseline: making="yes" — leave it to trigger inconsistency
    });
    const errors = expectFail(validateInputMap(input));
    expectError(
      errors,
      'would_reach_for_inconsistent',
      'cross_direction.direction_chosen',
    );
  });

  it('with direction_chosen="none" and all would_reach_for="no", valid', () => {
    const input = corrupt((m) => {
      m.cross_direction.direction_chosen = 'none';
      m.directions.creator.would_reach_for = 'no';
    });
    const result = validateInputMap(input);
    expect(result.ok).toBe(true);
  });

  it('skips rule 4 when direction_chosen is invalid (only categorical error reported)', () => {
    const input = corrupt((m) => {
      m.cross_direction.direction_chosen = 'sleeping';
    });
    const errors = expectFail(validateInputMap(input));
    expect(
      errors.some((e) => e.code === 'would_reach_for_inconsistent'),
    ).toBe(false);
    expectError(errors, 'invalid_categorical', 'cross_direction.direction_chosen');
  });

  it('skips rule 4 when a would_reach_for is malformed', () => {
    const input = corrupt((m) => {
      m.directions.creator.would_reach_for = 'kinda';
    });
    const errors = expectFail(validateInputMap(input));
    expect(
      errors.some((e) => e.code === 'would_reach_for_inconsistent'),
    ).toBe(false);
    expectError(errors, 'invalid_categorical', 'directions.creator.would_reach_for');
  });
});

describe('Rule 5 — wanting on universal-wanting domains', () => {
  const universals = [
    'time_as_yours',
    'energy_as_resource',
    'felt_aliveness',
    'body_physical_aliveness',
  ] as const;

  for (const dom of universals) {
    it(`rejects wanting="doesnt_want" on ${dom}`, () => {
      const input = corrupt((m) => {
        m.domains[dom].wanting = 'doesnt_want';
      });
      const errors = expectFail(validateInputMap(input));
      expectError(errors, 'invalid_universal_wanting', `domains.${dom}.wanting`);
    });

    it(`accepts wanting="wants" on ${dom}`, () => {
      const input = corrupt((m) => {
        m.domains[dom].wanting = 'wants';
      });
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });

    it(`accepts wanting omitted on ${dom}`, () => {
      const input = corrupt((m) => {
        delete m.domains[dom].wanting;
      });
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    });
  }
});

describe('Multiple errors', () => {
  it('collects errors across multiple branches', () => {
    const input = corrupt((m) => {
      m.directions.creator.stated_strength = 200;
      m.domains.curiosity.current_state = 'high';
      m.cross_direction.capacity_strain = 'maybe';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'out_of_range', 'directions.creator.stated_strength');
    expectError(errors, 'invalid_type', 'domains.curiosity.current_state');
    expectError(errors, 'invalid_categorical', 'cross_direction.capacity_strain');
  });
});

describe('Completely malformed input', () => {
  it('rejects null', () => {
    expectFail(validateInputMap(null));
  });
  it('rejects undefined', () => {
    expectFail(validateInputMap(undefined));
  });
  it('rejects string', () => {
    expectFail(validateInputMap('hello'));
  });
  it('rejects array', () => {
    expectFail(validateInputMap([]));
  });
});

describe('v4 Rule 10 — psychological_filtering required', () => {
  it('accepts valid psychological_filtering values', () => {
    const filters = ['does_not_filter', 'filters_some', 'filters_pervasively'] as const;
    for (const value of filters) {
      const input = corrupt((m) => {
        m.cross_direction.psychological_filtering = value;
      });
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    }
  });

  it('rejects missing psychological_filtering', () => {
    const input = corrupt((m) => {
      delete m.cross_direction.psychological_filtering;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'cross_direction_psychological_filtering_missing', 'cross_direction.psychological_filtering');
  });

  it('rejects invalid psychological_filtering value', () => {
    const input = corrupt((m) => {
      m.cross_direction.psychological_filtering = 'invalid_value';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'cross_direction_psychological_filtering_missing', 'cross_direction.psychological_filtering');
  });
});

describe('v4 Rule 11 — role_consolidation required', () => {
  it('accepts valid role_consolidation values', () => {
    const values = ['holds_other_selves', 'role_inflected', 'role_consolidated'] as const;
    for (const value of values) {
      const input = corrupt((m) => {
        m.cross_direction.role_consolidation = value;
      });
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    }
  });

  it('rejects missing role_consolidation', () => {
    const input = corrupt((m) => {
      delete m.cross_direction.role_consolidation;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'cross_direction_role_consolidation_missing', 'cross_direction.role_consolidation');
  });

  it('rejects invalid role_consolidation value', () => {
    const input = corrupt((m) => {
      m.cross_direction.role_consolidation = 'invalid_value';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'cross_direction_role_consolidation_missing', 'cross_direction.role_consolidation');
  });
});

describe('v4 Rule 12 — attention_pattern required', () => {
  it('accepts valid attention_pattern values', () => {
    const values = ['engaged', 'intermittent', 'autopilot'] as const;
    for (const value of values) {
      const input = corrupt((m) => {
        m.cross_direction.attention_pattern = value;
      });
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    }
  });

  it('rejects missing attention_pattern', () => {
    const input = corrupt((m) => {
      delete m.cross_direction.attention_pattern;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'cross_direction_attention_pattern_missing', 'cross_direction.attention_pattern');
  });

  it('rejects invalid attention_pattern value', () => {
    const input = corrupt((m) => {
      m.cross_direction.attention_pattern = 'invalid_value';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'cross_direction_attention_pattern_missing', 'cross_direction.attention_pattern');
  });
});

describe('v4 Rule 13 — relational_presence required', () => {
  it('accepts valid relational_presence values', () => {
    const values = ['present', 'partial', 'mostly_absent'] as const;
    for (const value of values) {
      const input = corrupt((m) => {
        m.cross_direction.relational_presence = value;
      });
      const result = validateInputMap(input);
      expect(result.ok).toBe(true);
    }
  });

  it('rejects missing relational_presence', () => {
    const input = corrupt((m) => {
      delete m.cross_direction.relational_presence;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'cross_direction_relational_presence_missing', 'cross_direction.relational_presence');
  });

  it('rejects invalid relational_presence value', () => {
    const input = corrupt((m) => {
      m.cross_direction.relational_presence = 'invalid_value';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'cross_direction_relational_presence_missing', 'cross_direction.relational_presence');
  });
});

describe('v4 Rule 14 — spiritual domain with mandatory wanting', () => {
  it('accepts well-formed spiritual domain with wanting', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = { current_state: 75, past_presence: 'yes', wanting: 'wants' };
    });
    const result = validateInputMap(input);
    expect(result.ok).toBe(true);
  });

  it('accepts spiritual domain with wanting="doesnt_want"', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = { current_state: 25, past_presence: 'no', wanting: 'doesnt_want' };
    });
    const result = validateInputMap(input);
    expect(result.ok).toBe(true);
  });

  it('accepts boundary values for current_state (0 and 100)', () => {
    const input1 = corrupt((m) => {
      m.domains.spiritual = { current_state: 0, past_presence: 'no', wanting: 'doesnt_want' };
    });
    expect(validateInputMap(input1).ok).toBe(true);

    const input2 = corrupt((m) => {
      m.domains.spiritual = { current_state: 100, past_presence: 'yes', wanting: 'wants' };
    });
    expect(validateInputMap(input2).ok).toBe(true);
  });

  it('rejects spiritual domain with wanting omitted (deviation from universal-wanting)', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = { current_state: 50, past_presence: 'yes' };
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'domain_spiritual_malformed', 'domains.spiritual.wanting');
  });

  it('rejects missing spiritual domain entirely', () => {
    const input = corrupt((m) => {
      delete m.domains.spiritual;
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'domain_spiritual_missing', 'domains.spiritual');
  });

  it('rejects spiritual domain with invalid current_state type', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = { current_state: 'not_a_number', past_presence: 'yes', wanting: 'wants' };
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'domain_spiritual_malformed', 'domains.spiritual.current_state');
  });

  it('rejects spiritual domain with out-of-range current_state', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = { current_state: 150, past_presence: 'yes', wanting: 'wants' };
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'domain_spiritual_malformed', 'domains.spiritual.current_state');
  });

  it('rejects spiritual domain with invalid past_presence value', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = { current_state: 50, past_presence: 'maybe', wanting: 'wants' };
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'domain_spiritual_malformed', 'domains.spiritual.past_presence');
  });

  it('rejects spiritual domain with invalid wanting value', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = { current_state: 50, past_presence: 'yes', wanting: 'unknown' };
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'domain_spiritual_malformed', 'domains.spiritual.wanting');
  });

  it('rejects spiritual domain with missing current_state', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = { past_presence: 'yes', wanting: 'wants' };
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'domains.spiritual.current_state');
  });

  it('rejects spiritual domain with missing past_presence', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = { current_state: 50, wanting: 'wants' };
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'missing_field', 'domains.spiritual.past_presence');
  });

  it('rejects spiritual domain that is not an object', () => {
    const input = corrupt((m) => {
      m.domains.spiritual = 'not_an_object';
    });
    const errors = expectFail(validateInputMap(input));
    expectError(errors, 'domain_spiritual_malformed', 'domains.spiritual');
  });
});
