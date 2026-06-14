import { describe, it, expect } from 'vitest';
import { runEngine } from '@/engine/engine';
import type {
  InputMap,
  PerDirectionInputs,
  PerDomainInputs,
  DirectionName,
  DomainName,
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

const UNIVERSAL_WANTING: readonly DomainName[] = [
  'time_as_yours',
  'energy_as_resource',
  'felt_aliveness',
  'body_physical_aliveness',
];

const NON_UNIVERSAL_WANTING: readonly DomainName[] = [
  'curiosity',
  'making',
  'conversation_depth',
  'being_known',
  'friendship',
  'intimacy',
  'mattering',
  'spiritual',
];

function baseDir(): PerDirectionInputs {
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

type DomainOverride = Partial<PerDomainInputs> & { omitWanting?: true };

function buildDomains(
  overrides: Partial<Record<DomainName, DomainOverride>> = {},
): InputMap['domains'] {
  function build(name: DomainName, isUniversal: boolean): PerDomainInputs {
    const raw = overrides[name];
    const omitWanting = raw?.omitWanting === true || (isUniversal && !raw);
    const ov: Partial<PerDomainInputs> = { ...raw };
    delete (ov as { omitWanting?: true }).omitWanting;
    const merged: PerDomainInputs = {
      current_state: 0,
      past_presence: 'no',
      ...(isUniversal ? {} : { wanting: 'doesnt_want' as const }),
      ...ov,
    };
    if (omitWanting) {
      delete (merged as { wanting?: PerDomainInputs['wanting'] }).wanting;
    }
    return merged;
  }
  return {
    time_as_yours: build('time_as_yours', true),
    energy_as_resource: build('energy_as_resource', true),
    felt_aliveness: build('felt_aliveness', true),
    body_physical_aliveness: build('body_physical_aliveness', true),
    curiosity: build('curiosity', false),
    making: build('making', false),
    conversation_depth: build('conversation_depth', false),
    being_known: build('being_known', false),
    friendship: build('friendship', false),
    intimacy: build('intimacy', false),
    mattering: build('mattering', false),
    spiritual: build('spiritual', false),
  };
}

type EngineInputOverrides = {
  directions?: Partial<Record<DirectionName, Partial<PerDirectionInputs>>>;
  cross_direction?: Partial<InputMap['cross_direction']>;
  domains?: Partial<Record<DomainName, DomainOverride>>;
  constraints?: Partial<InputMap['constraints']>;
  cross_cutting?: Partial<InputMap['cross_cutting']>;
};

function makeInputMap(overrides: EngineInputOverrides = {}): InputMap {
  const dirOv = overrides.directions ?? {};
  return {
    directions: {
      contributor: { ...baseDir(), ...dirOv.contributor },
      experience_seeker: { ...baseDir(), ...dirOv.experience_seeker },
      freedom_designer: { ...baseDir(), ...dirOv.freedom_designer },
      growth_focused: { ...baseDir(), ...dirOv.growth_focused },
      creator: { ...baseDir(), ...dirOv.creator },
      relationship_rebuilder: { ...baseDir(), ...dirOv.relationship_rebuilder },
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
      ...overrides.cross_direction,
    },
    domains: buildDomains(overrides.domains),
    constraints: {
      energy_availability: 0,
      time_availability: 0,
      body_capacity: 0,
      permission: 0,
      permission_sub_shape: 'present',
      ...overrides.constraints,
    },
    cross_cutting: {
      recent_life_shape_change: 'no',
      replacement_structure_exists: 'no',
      recent_reaching: 'long_established',
      ...overrides.cross_cutting,
    },
    self_report: {
      named_absences: [],
    },
  };
}

function findDirection(
  outputs: DirectionOutput[],
  name: DirectionName,
): DirectionOutput {
  const m = outputs.find((o) => o.direction === name);
  if (!m) throw new Error(`direction not found: ${name}`);
  return m;
}

/* ------------------------------------------------------------------ */

describe('A. Validation flow', () => {
  it('runEngine(null) → errors', () => {
    const r = runEngine(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
  });

  it('runEngine(undefined) → errors', () => {
    const r = runEngine(undefined);
    expect(r.ok).toBe(false);
  });

  it('runEngine("not an InputMap") → errors', () => {
    const r = runEngine('not an InputMap');
    expect(r.ok).toBe(false);
  });

  it('runEngine({}) → errors', () => {
    const r = runEngine({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
  });

  it('valid InputMap → ok with EngineOutput', () => {
    const r = runEngine(makeInputMap());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.output).toBeDefined();
      expect(Array.isArray(r.output.directions)).toBe(true);
    }
  });

  it('failure errors have ValidationError shape', () => {
    const r = runEngine({});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const first = r.errors[0]!;
      expect(typeof first.code).toBe('string');
      expect(typeof first.path).toBe('string');
      expect(typeof first.message).toBe('string');
    }
  });
});

describe('B. Output structure invariants', () => {
  it('output has exactly five top-level keys (engine extension adds cross_direction)', () => {
    const r = runEngine(makeInputMap());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.output).sort()).toEqual([
        'constraints',
        'cross_cutting',
        'cross_direction',
        'directions',
        'domains',
      ]);
    }
  });

  it('directions has exactly 6 entries', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) expect(r.output.directions).toHaveLength(6);
  });

  it('domains has exactly 12 entries', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) expect(r.output.domains).toHaveLength(12);
  });

  it('cross_cutting has exactly 2 entries', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) expect(r.output.cross_cutting).toHaveLength(2);
  });

  it('constraints has exactly the five expected keys', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      expect(Object.keys(r.output.constraints).sort()).toEqual([
        'body_capacity',
        'energy',
        'permission',
        'sustained_constraint_intensity',
        'time',
      ]);
    }
  });

  it('sustained_constraint_intensity is a number', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      expect(typeof r.output.constraints.sustained_constraint_intensity).toBe(
        'number',
      );
    }
  });
});

describe('C. domains → directions (was_once_renders)', () => {
  it('making domain fires → making direction was_once_renders=true', () => {
    const r = runEngine(
      makeInputMap({
        directions: { creator: { past_presence: 'yes' } },
        domains: {
          making: {
            current_state: 0,
            past_presence: 'yes',
            wanting: 'wants',
          },
        },
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      const m = findDirection(r.output.directions, 'creator');
      expect(m.past_relationship).toBe('was_once');
      expect(m.was_once_renders).toBe(true);
    }
  });

  it('making domain intact → making direction was_once_renders=false', () => {
    const r = runEngine(
      makeInputMap({
        directions: { creator: { past_presence: 'yes' } },
        domains: {
          making: {
            current_state: 80,
            past_presence: 'yes',
            wanting: 'wants',
          },
        },
      }),
    );
    if (r.ok) {
      const m = findDirection(r.output.directions, 'creator');
      expect(m.past_relationship).toBe('was_once');
      expect(m.was_once_renders).toBe(false);
    }
  });
});

describe('D. directions → cross_cutting (mid_process)', () => {
  it('one Active + recent_and_awkward → mid_process fires', () => {
    const r = runEngine(
      makeInputMap({
        directions: {
          creator: {
            stated_strength: 100,
            recent_action: 'recent',
            current_movement: 100,
          },
        },
        cross_cutting: { recent_reaching: 'recent_and_awkward' },
      }),
    );
    if (r.ok) {
      expect(r.output.cross_cutting[1]!.output).toBe('mid_process');
      expect(r.output.cross_cutting[1]!.fires).toBe(true);
    }
  });

  it('one Active + long_established → mid_process not fires', () => {
    const r = runEngine(
      makeInputMap({
        directions: {
          creator: {
            stated_strength: 100,
            recent_action: 'recent',
            current_movement: 100,
          },
        },
        cross_cutting: { recent_reaching: 'long_established' },
      }),
    );
    if (r.ok) {
      expect(r.output.cross_cutting[1]!.fires).toBe(false);
    }
  });
});


describe('F. SCI propagation', () => {
  it('all R-inputs at 100 → SCI=0 in constraints output', () => {
    const r = runEngine(
      makeInputMap({
        constraints: {
          energy_availability: 100,
          time_availability: 100,
          body_capacity: 100,
          permission: 100,
        },
      }),
    );
    if (r.ok) {
      expect(r.output.constraints.sustained_constraint_intensity).toBe(0);
    }
  });

  it('all R-inputs at 0 → SCI=100 in constraints output', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      expect(r.output.constraints.sustained_constraint_intensity).toBe(100);
    }
  });

  it('SCI=100 + life=long + making preB-eligible → pull_quality=["suppressed"]', () => {
    const r = runEngine(
      makeInputMap({
        directions: { creator: { stated_strength: 0, past_presence: 'yes' } },
        cross_direction: { life_shape_duration: 'long' },
        // constraints already at 0 in baseline → SCI = 100
      }),
    );
    if (r.ok) {
      const m = findDirection(r.output.directions, 'creator');
      expect(m.pull_quality).toEqual(['suppressed']);
    }
  });
});

describe('G. Integration smoke — baseline "all uninteresting"', () => {
  it('ok=true', () => {
    const r = runEngine(makeInputMap());
    expect(r.ok).toBe(true);
  });

  it('only contribution surfaces (alphabetical fallback at all-zero pull)', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      for (const d of r.output.directions) {
        expect(d.surfaced).toBe(d.direction === 'contributor');
      }
    }
  });

  it('all 6 directions are quiet, empty pull arrays, never_been_part_of_life', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      for (const d of r.output.directions) {
        expect(d.quadrant).toBe('quiet');
        expect(d.pull_state).toEqual([]);
        expect(d.pull_quality).toEqual([]);
        expect(d.past_relationship).toBe('never_been_part_of_life');
        expect(d.was_once_renders).toBe(false);
      }
    }
  });

  it('universal-wanting domains fire as wants_but_never_had', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      for (const name of UNIVERSAL_WANTING) {
        const d = r.output.domains.find((o) => o.domain === name)!;
        expect(d.value).toBe('wants_but_never_had');
        expect(d.fires).toBe(true);
      }
    }
  });

  it('non-universal-wanting domains fire as never_been_part_of_his_life', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      for (const name of NON_UNIVERSAL_WANTING) {
        const d = r.output.domains.find((o) => o.domain === name)!;
        expect(d.value).toBe('never_been_part_of_his_life');
        expect(d.fires).toBe(true);
      }
    }
  });

  it('all 11 domains fire (none intact)', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      for (const d of r.output.domains) {
        expect(d.fires).toBe(true);
        expect(d.value).not.toBe('intact');
      }
    }
  });

  it('all four constraints fire with worst bands; SCI=100', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      const c = r.output.constraints;
      expect(c.energy.fires).toBe(true);
      expect(c.energy.band).toBe('heavy_depletion');
      expect(c.time.fires).toBe(true);
      expect(c.time.band).toBe('heavy_time_pressure');
      expect(c.body_capacity.fires).toBe(true);
      expect(c.body_capacity.band).toBe('limited');
      expect(c.permission.fires).toBe(true);
      expect(c.permission.band).toBe('blocked');
      expect(c.sustained_constraint_intensity).toBe(100);
    }
  });

  it('all three cross-cutting outputs do not fire', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      for (const cc of r.output.cross_cutting) {
        expect(cc.fires).toBe(false);
      }
    }
  });

  it('output has exactly 6 surfaced flags total, one true', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      const surfacedCount = r.output.directions.filter((d) => d.surfaced).length;
      expect(surfacedCount).toBe(1);
    }
  });

  it('directions cover all canonical names', () => {
    const r = runEngine(makeInputMap());
    if (r.ok) {
      const names = r.output.directions.map((d) => d.direction).sort();
      expect(names).toEqual([...DIRECTION_NAMES].sort());
    }
  });
});

describe('H. Purity and idempotence', () => {
  it('two independent calls with deep-equal inputs produce deep-equal outputs', () => {
    const a = makeInputMap({
      directions: { creator: { stated_strength: 80, past_presence: 'yes' } },
    });
    const b = makeInputMap({
      directions: { creator: { stated_strength: 80, past_presence: 'yes' } },
    });
    const ra = runEngine(a);
    const rb = runEngine(b);
    expect(ra).toEqual(rb);
  });

  it('runEngine does not mutate input', () => {
    const input = makeInputMap({
      directions: { creator: { stated_strength: 50, past_presence: 'yes' } },
    });
    const snapshot = structuredClone(input);
    runEngine(input);
    expect(input).toEqual(snapshot);
  });
});
