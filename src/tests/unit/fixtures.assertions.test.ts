import { describe, it, expect } from 'vitest';
import {
  runAssertions,
  formatFailures,
} from '@/fixtures/assertions';
import type {
  AssertionResult,
  AssertionRunResult,
} from '@/fixtures/assertions';
import type { ExpectedAssertions } from '@/fixtures/types';
import type {
  EngineOutput,
  DirectionOutput,
  DomainPresenceOutput,
  CrossCuttingOutput,
  DirectionName,
  DomainName,
  CrossCuttingName,
} from '@/engine/types';

const DIRECTION_NAMES: readonly DirectionName[] = [
  'contributor',
  'creator',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
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

const CC_NAMES: readonly CrossCuttingName[] = [
  'between_shapes',
  'mid_process',
];

function baseDirOut(name: DirectionName): DirectionOutput {
  return {
    direction: name,
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
  };
}

function baseDomOut(name: DomainName): DomainPresenceOutput {
  return {
    domain: name,
    current_state: 0,
    fires: true,
    value: 'never_been_part_of_his_life',
  };
}

function baseCcOut(name: CrossCuttingName): CrossCuttingOutput {
  return { output: name, fires: false };
}

type Loose = Record<string, unknown>;

type EngineOverrides = {
  directions?: Partial<Record<DirectionName, Loose>>;
  domains?: Partial<Record<DomainName, Loose>>;
  constraints?: {
    sustained_constraint_intensity?: number;
    energy?: Loose;
    time?: Loose;
    body_capacity?: Loose;
    permission?: Loose;
  };
  cross_cutting?: Partial<Record<CrossCuttingName, Loose>>;
  /** Optional override of direction output array order (for lookup robustness tests). */
  directionsOrder?: readonly DirectionName[];
};

function makeEngineOutput(o: EngineOverrides = {}): EngineOutput {
  const dirOrder = o.directionsOrder ?? DIRECTION_NAMES;
  const directions = dirOrder.map((name) => ({
    ...baseDirOut(name),
    ...(o.directions?.[name] ?? {}),
  })) as unknown as DirectionOutput[];
  const domains = DOMAIN_NAMES.map((name) => ({
    ...baseDomOut(name),
    ...(o.domains?.[name] ?? {}),
  })) as unknown as DomainPresenceOutput[];
  const cross_cutting = CC_NAMES.map((name) => ({
    ...baseCcOut(name),
    ...(o.cross_cutting?.[name] ?? {}),
  })) as unknown as CrossCuttingOutput[];
  return {
    directions,
    domains,
    constraints: {
      sustained_constraint_intensity:
        o.constraints?.sustained_constraint_intensity ?? 0,
      energy: {
        value: 0,
        band: 'heavy_depletion',
        fires: true,
        ...o.constraints?.energy,
      } as EngineOutput['constraints']['energy'],
      time: {
        value: 0,
        band: 'heavy_time_pressure',
        fires: true,
        ...o.constraints?.time,
      } as EngineOutput['constraints']['time'],
      body_capacity: {
        value: 0,
        band: 'limited',
        fires: true,
        ...o.constraints?.body_capacity,
      } as EngineOutput['constraints']['body_capacity'],
      permission: {
        value: 0,
        band: 'blocked',
        sub_shape: 'present',
        fires: true,
        ...o.constraints?.permission,
      } as EngineOutput['constraints']['permission'],
    },
    cross_cutting,
    cross_direction: {
      life_stage: 'drifting',
      sociality_default: 'balanced',
      paid_work_relationship: 'functional',
      primary_load: 'none',
      psychological_filtering: 'filters_some',
      role_consolidation: 'role_inflected',
      attention_pattern: 'intermittent',
      relational_presence: 'partial',
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
      life_texture_band: 'empty',
      structural_narrowing_band: 'moderate',
      experiential_narrowing_band: 'moderate',
      psychological_narrowing_band: 'moderate',
      identity_narrowing_band: 'moderate',
      energetic_narrowing_band: 'moderate',
      relational_narrowing_band: 'moderate',
      attention_narrowing_band: 'moderate',
    },
  };
}

function findResult(
  results: AssertionResult[],
  path: string,
): AssertionResult {
  const r = results.find((x) => x.path === path);
  if (!r) throw new Error(`result not found at path: ${path}`);
  return r;
}

function run(
  expected: ExpectedAssertions,
  overrides: EngineOverrides = {},
): AssertionRunResult {
  return runAssertions(expected, makeEngineOutput(overrides));
}

/* ------------------------------------------------------------------ */

describe('A. Empty expected', () => {
  it('{} → empty results', () => {
    const r = run({});
    expect(r.results).toEqual([]);
    expect(r.passed).toBe(0);
    expect(r.failed).toBe(0);
    expect(r.total).toBe(0);
  });
});

describe('B. Exact matcher', () => {
  it('bare boolean passes', () => {
    const r = run(
      { directions: { creator: { surfaced: true } } },
      { directions: { creator: { surfaced: true } } },
    );
    expect(r.results).toHaveLength(1);
    const x = r.results[0]!;
    expect(x.matcher).toBe('exact');
    expect(x.expected).toBe(true);
    expect(x.actual).toBe(true);
    expect(x.passed).toBe(true);
  });

  it('bare boolean mismatch fails with reason', () => {
    const r = run(
      { directions: { creator: { surfaced: true } } },
      { directions: { creator: { surfaced: false } } },
    );
    const x = r.results[0]!;
    expect(x.passed).toBe(false);
    expect(x.reason).toMatch(/true/);
    expect(x.reason).toMatch(/false/);
  });

  it('bare number passes', () => {
    const r = run(
      { directions: { creator: { pull: 50 } } },
      { directions: { creator: { pull: 50 } } },
    );
    expect(r.results[0]!.passed).toBe(true);
  });

  it('bare string passes', () => {
    const r = run(
      { constraints: { energy: { band: 'moderate' } } },
      { constraints: { energy: { band: 'moderate' } } },
    );
    expect(r.results[0]!.passed).toBe(true);
  });

  it('bare array deep-equal passes', () => {
    const r = run(
      { directions: { creator: { pull_state: ['held_attributed_with_expression'] } } },
      { directions: { creator: { pull_state: ['held_attributed_with_expression'] } } },
    );
    expect(r.results[0]!.passed).toBe(true);
  });

  it('bare array different elements fails', () => {
    const r = run(
      { directions: { creator: { pull_state: ['held_attributed_with_expression'] } } },
      { directions: { creator: { pull_state: ['stopped_expecting'] } } },
    );
    expect(r.results[0]!.passed).toBe(false);
  });

  it('bare array different order fails (exact match is order-sensitive)', () => {
    const r = run(
      { directions: { creator: { pull_state: ['a', 'b'] } } },
      { directions: { creator: { pull_state: ['b', 'a'] } } },
    );
    expect(r.results[0]!.passed).toBe(false);
  });
});

describe('C. Between matcher', () => {
  it('in-range passes', () => {
    const r = run(
      { directions: { creator: { pull: { between: [60, 70] } } } },
      { directions: { creator: { pull: 65 } } },
    );
    const x = r.results[0]!;
    expect(x.matcher).toBe('between');
    expect(x.expected).toEqual({ between: [60, 70] });
    expect(x.actual).toBe(65);
    expect(x.passed).toBe(true);
  });

  it('boundary low (inclusive)', () => {
    const r = run(
      { directions: { creator: { pull: { between: [60, 70] } } } },
      { directions: { creator: { pull: 60 } } },
    );
    expect(r.results[0]!.passed).toBe(true);
  });

  it('boundary high (inclusive)', () => {
    const r = run(
      { directions: { creator: { pull: { between: [60, 70] } } } },
      { directions: { creator: { pull: 70 } } },
    );
    expect(r.results[0]!.passed).toBe(true);
  });

  it('out of range fails with reason mentioning range', () => {
    const r = run(
      { directions: { creator: { pull: { between: [60, 70] } } } },
      { directions: { creator: { pull: 50 } } },
    );
    const x = r.results[0]!;
    expect(x.passed).toBe(false);
    expect(x.reason).toMatch(/\[60, 70\]/);
    expect(x.reason).toMatch(/50/);
  });

  it('non-number actual fails', () => {
    const r = run(
      { directions: { creator: { quadrant: { between: [60, 70] } } } },
      { directions: { creator: { quadrant: 'active' } } },
    );
    expect(r.results[0]!.passed).toBe(false);
  });
});

describe('D. Contains matcher', () => {
  it('singleton present passes', () => {
    const r = run(
      { directions: { creator: { pull_quality: { contains: ['suppressed'] } } } },
      { directions: { creator: { pull_quality: ['suppressed'] } } },
    );
    expect(r.results[0]!.passed).toBe(true);
    expect(r.results[0]!.matcher).toBe('contains');
  });

  it('extras allowed', () => {
    const r = run(
      { directions: { creator: { pull_quality: { contains: ['suppressed'] } } } },
      { directions: { creator: { pull_quality: ['suppressed', 'saturated'] } } },
    );
    expect(r.results[0]!.passed).toBe(true);
  });

  it('missing item fails with reason', () => {
    const r = run(
      { directions: { creator: { pull_quality: { contains: ['suppressed'] } } } },
      { directions: { creator: { pull_quality: ['saturated'] } } },
    );
    const x = r.results[0]!;
    expect(x.passed).toBe(false);
    expect(x.reason).toMatch(/missing/);
    expect(x.reason).toMatch(/suppressed/);
  });

  it('empty actual fails', () => {
    const r = run(
      { directions: { creator: { pull_quality: { contains: ['suppressed'] } } } },
      { directions: { creator: { pull_quality: [] } } },
    );
    expect(r.results[0]!.passed).toBe(false);
  });

  it('multiple required, partial match fails; full match passes', () => {
    const ab = run(
      { directions: { creator: { pull_state: { contains: ['a', 'b'] } } } },
      { directions: { creator: { pull_state: ['a', 'c'] } } },
    );
    expect(ab.results[0]!.passed).toBe(false);
    const abc = run(
      { directions: { creator: { pull_state: { contains: ['a', 'b'] } } } },
      { directions: { creator: { pull_state: ['a', 'b', 'c'] } } },
    );
    expect(abc.results[0]!.passed).toBe(true);
  });

  it('non-array actual fails', () => {
    const r = run(
      { directions: { creator: { quadrant: { contains: ['x'] } } } },
      { directions: { creator: { quadrant: 'active' } } },
    );
    expect(r.results[0]!.passed).toBe(false);
  });

  it('empty contains passes vacuously', () => {
    const r = run(
      { directions: { creator: { pull_state: { contains: [] } } } },
      { directions: { creator: { pull_state: ['anything'] } } },
    );
    expect(r.results[0]!.passed).toBe(true);
  });
});

describe('E. Equals matcher (multiset)', () => {
  it('singleton equal passes', () => {
    const r = run(
      { directions: { creator: { pull_state: { equals: ['a'] } } } },
      { directions: { creator: { pull_state: ['a'] } } },
    );
    expect(r.results[0]!.passed).toBe(true);
    expect(r.results[0]!.matcher).toBe('equals');
  });

  it('order-insensitive', () => {
    const r = run(
      { directions: { creator: { pull_state: { equals: ['b', 'a'] } } } },
      { directions: { creator: { pull_state: ['a', 'b'] } } },
    );
    expect(r.results[0]!.passed).toBe(true);
  });

  it('length differs fails', () => {
    const r = run(
      { directions: { creator: { pull_state: { equals: ['a', 'b'] } } } },
      { directions: { creator: { pull_state: ['a', 'b', 'c'] } } },
    );
    expect(r.results[0]!.passed).toBe(false);
  });

  it('subset fails', () => {
    const r = run(
      { directions: { creator: { pull_state: { equals: ['a', 'b'] } } } },
      { directions: { creator: { pull_state: ['a'] } } },
    );
    expect(r.results[0]!.passed).toBe(false);
  });

  it('non-array fails', () => {
    const r = run(
      { directions: { creator: { quadrant: { equals: ['a'] } } } },
      { directions: { creator: { quadrant: 'active' } } },
    );
    expect(r.results[0]!.passed).toBe(false);
  });

  it('empty equals: actual empty passes; actual non-empty fails', () => {
    const ok = run(
      { directions: { creator: { pull_state: { equals: [] } } } },
      { directions: { creator: { pull_state: [] } } },
    );
    expect(ok.results[0]!.passed).toBe(true);
    const bad = run(
      { directions: { creator: { pull_state: { equals: [] } } } },
      { directions: { creator: { pull_state: ['x'] } } },
    );
    expect(bad.results[0]!.passed).toBe(false);
  });

  it('multiset semantics: duplicates respected', () => {
    const a1 = run(
      { directions: { creator: { pull_state: { equals: ['a'] } } } },
      { directions: { creator: { pull_state: ['a', 'a'] } } },
    );
    expect(a1.results[0]!.passed).toBe(false);
    const a2 = run(
      { directions: { creator: { pull_state: { equals: ['a', 'a'] } } } },
      { directions: { creator: { pull_state: ['a', 'a'] } } },
    );
    expect(a2.results[0]!.passed).toBe(true);
    const ab = run(
      { directions: { creator: { pull_state: { equals: ['a', 'a'] } } } },
      { directions: { creator: { pull_state: ['a', 'b'] } } },
    );
    expect(ab.results[0]!.passed).toBe(false);
  });
});

describe('F. Walk order — deterministic', () => {
  it('ordering is directions → domains → constraints → cross_cutting; canonical order within', () => {
    const expected: ExpectedAssertions = {
      directions: {
        relationship_rebuilder: { surfaced: false },
        creator: { surfaced: false },
        contributor: { surfaced: false },
      },
      domains: {
        mattering: { fires: true },
        time_as_yours: { fires: true },
      },
      constraints: {
        sustained_constraint_intensity: 0,
        permission: { fires: true },
        energy: { fires: true },
      },
      cross_cutting: {
        between_shapes: { fires: false },
      },
    };
    const r1 = run(expected);
    const r2 = run(expected);
    const paths = r1.results.map((x) => x.path);
    expect(paths).toEqual([
      'directions.contributor.surfaced',
      'directions.creator.surfaced',
      'directions.relationship_rebuilder.surfaced',
      'domains.time_as_yours.fires',
      'domains.mattering.fires',
      'constraints.sustained_constraint_intensity',
      'constraints.energy.fires',
      'constraints.permission.fires',
      'cross_cutting.between_shapes.fires',
    ]);
    expect(r2.results.map((x) => x.path)).toEqual(paths);
  });
});

describe('G. Path correctness across leaf types', () => {
  const expected: ExpectedAssertions = {
    directions: {
      creator: {
        pull: 0,
        pull_state: [],
      },
    },
    domains: { curiosity: { value: 'never_been_part_of_his_life' } },
    constraints: {
      sustained_constraint_intensity: 0,
      energy: { band: 'heavy_depletion' },
      permission: { sub_shape: 'present' },
    },
    cross_cutting: { between_shapes: { fires: false } },
  };

  it('emits all expected paths', () => {
    const r = run(expected);
    const paths = r.results.map((x) => x.path);
    expect(paths).toContain('directions.creator.pull');
    expect(paths).toContain('directions.creator.pull_state');
    expect(paths).toContain('domains.curiosity.value');
    expect(paths).toContain('constraints.sustained_constraint_intensity');
    expect(paths).toContain('constraints.energy.band');
    expect(paths).toContain('constraints.permission.sub_shape');
    expect(paths).toContain('cross_cutting.between_shapes.fires');
  });
});

describe('H. Lookup robustness', () => {
  it('finds direction by name regardless of array order', () => {
    const r = run(
      { directions: { creator: { pull: 42 } } },
      {
        directionsOrder: ['relationship_rebuilder', 'creator', 'freedom_designer', 'growth_focused', 'experience_seeker', 'contributor'],
        directions: { creator: { pull: 42 } },
      },
    );
    expect(r.results[0]!.passed).toBe(true);
    expect(r.results[0]!.actual).toBe(42);
  });
});

describe('I. Aggregate counts', () => {
  it('all pass', () => {
    const r = run(
      {
        directions: { creator: { pull: 0 } },
        domains: { curiosity: { fires: true } },
        cross_cutting: { between_shapes: { fires: false } },
      },
    );
    expect(r).toMatchObject({ passed: 3, failed: 0, total: 3 });
  });

  it('mixed', () => {
    const r = run(
      {
        directions: { creator: { pull: 0 } }, // pass
        domains: { curiosity: { fires: false } }, // fail
        cross_cutting: { between_shapes: { fires: false } }, // pass
      },
    );
    expect(r).toMatchObject({ passed: 2, failed: 1, total: 3 });
  });

  it('all fail', () => {
    const r = run(
      {
        directions: { creator: { pull: 99 } },
        domains: { curiosity: { fires: false } },
        cross_cutting: { between_shapes: { fires: true } },
      },
    );
    expect(r).toMatchObject({ passed: 0, failed: 3, total: 3 });
  });
});

describe('J. Result entries — matcher and expected fields', () => {
  it('exact: matcher="exact", expected is bare value', () => {
    const r = run(
      { directions: { creator: { pull: 0 } } },
    );
    const x = r.results[0]!;
    expect(x.matcher).toBe('exact');
    expect(x.expected).toBe(0);
  });

  it('between: matcher="between", expected is the matcher object', () => {
    const r = run(
      { directions: { creator: { pull: { between: [0, 10] } } } },
    );
    const x = r.results[0]!;
    expect(x.matcher).toBe('between');
    expect(x.expected).toEqual({ between: [0, 10] });
  });

  it('contains: matcher="contains", expected is the matcher object', () => {
    const r = run(
      { directions: { creator: { pull_state: { contains: ['x'] } } } },
      { directions: { creator: { pull_state: ['x'] } } },
    );
    const x = r.results[0]!;
    expect(x.matcher).toBe('contains');
    expect(x.expected).toEqual({ contains: ['x'] });
  });

  it('equals: matcher="equals", expected is the matcher object', () => {
    const r = run(
      { directions: { creator: { pull_state: { equals: ['x'] } } } },
      { directions: { creator: { pull_state: ['x'] } } },
    );
    const x = r.results[0]!;
    expect(x.matcher).toBe('equals');
    expect(x.expected).toEqual({ equals: ['x'] });
  });
});

describe('K. Reason field discipline', () => {
  it('passing assertions have no reason', () => {
    const r = run({ directions: { creator: { pull: 0 } } });
    expect(r.results[0]!.reason).toBeUndefined();
  });

  it('failing exact reason mentions both expected and actual', () => {
    const r = run(
      { directions: { creator: { pull: 99 } } },
      { directions: { creator: { pull: 5 } } },
    );
    const reason = r.results[0]!.reason!;
    expect(reason).toMatch(/99/);
    expect(reason).toMatch(/5/);
  });

  it('failing between reason mentions the range', () => {
    const r = run(
      { directions: { creator: { pull: { between: [10, 20] } } } },
      { directions: { creator: { pull: 50 } } },
    );
    const reason = r.results[0]!.reason!;
    expect(reason).toMatch(/\[10, 20\]/);
  });

  it('failing contains reason mentions missing items', () => {
    const r = run(
      { directions: { creator: { pull_state: { contains: ['x'] } } } },
      { directions: { creator: { pull_state: [] } } },
    );
    const reason = r.results[0]!.reason!;
    expect(reason).toMatch(/x/);
  });

  it('failing equals reason mentions expected array', () => {
    const r = run(
      { directions: { creator: { pull_state: { equals: ['a', 'b'] } } } },
      { directions: { creator: { pull_state: ['a'] } } },
    );
    const reason = r.results[0]!.reason!;
    expect(reason).toMatch(/a/);
    expect(reason).toMatch(/b/);
  });
});

describe('L. formatFailures', () => {
  it('empty result returns ""', () => {
    expect(formatFailures(run({}))).toBe('');
  });

  it('all-pass returns ""', () => {
    const r = run({ directions: { creator: { pull: 0 } } });
    expect(formatFailures(r)).toBe('');
  });

  it('with failures returns multi-line string starting with summary', () => {
    const r = run(
      {
        directions: { creator: { pull: 99 } },
        domains: { curiosity: { fires: false } },
      },
    );
    const s = formatFailures(r);
    const lines = s.split('\n');
    expect(lines[0]).toBe('2 of 2 assertions failed:');
    expect(lines[1]).toMatch(/^ {2}directions\.creator\.pull: /);
    expect(lines[2]).toMatch(/^ {2}domains\.curiosity\.fires: /);
  });

  it('failure lines preserve results order', () => {
    const r = run(
      {
        directions: {
          creator: { pull: 99 }, // fail
        },
        cross_cutting: { between_shapes: { fires: true } }, // fail
      },
    );
    const s = formatFailures(r);
    const failurePaths = s
      .split('\n')
      .slice(1)
      .map((line) => line.trim().split(':')[0]);
    expect(failurePaths).toEqual([
      'directions.creator.pull',
      'cross_cutting.between_shapes.fires',
    ]);
  });
});

describe('M. Cross-block end-to-end', () => {
  it('integrates four blocks with mixed matchers', () => {
    const expected: ExpectedAssertions = {
      directions: {
        creator: {
          surfaced: true,
          pull: { between: [50, 70] },
          pull_quality: { contains: ['suppressed'] },
          pull_state: { equals: ['held_attributed_with_expression'] },
        },
      },
      domains: {
        curiosity: { fires: true, value: 'reduced_wants_back' },
      },
      constraints: {
        permission: {
          band: 'blocked',
          fires: true,
          sub_shape: 'say_block',
        },
      },
      cross_cutting: {
        between_shapes: { fires: false },
      },
    };
    const r = run(expected, {
      directions: {
        creator: {
          surfaced: true,
          pull: 60,
          pull_quality: ['suppressed', 'saturated'],
          pull_state: ['held_attributed_with_expression'],
        },
      },
      domains: { curiosity: { fires: true, value: 'reduced_wants_back' } },
      constraints: {
        permission: {
          band: 'blocked',
          fires: true,
          sub_shape: 'say_block',
        },
      },
    });
    expect(r.failed).toBe(0);
    expect(findResult(r.results, 'directions.creator.pull').matcher).toBe(
      'between',
    );
    expect(findResult(r.results, 'directions.creator.pull_quality').matcher).toBe(
      'contains',
    );
    expect(findResult(r.results, 'directions.creator.pull_state').matcher).toBe(
      'equals',
    );
    expect(findResult(r.results, 'constraints.permission.sub_shape').passed).toBe(
      true,
    );
  });
});
