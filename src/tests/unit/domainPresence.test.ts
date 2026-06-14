import { describe, it, expect } from 'vitest';
import { computeDomainPresenceOutputs } from '@/engine/scoring/domainPresence';
import type {
  InputMap,
  PerDomainInputs,
  DomainName,
  DomainPresenceOutput,
} from '@/engine/types';

const CANONICAL_ORDER: readonly DomainName[] = [
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

const UNIVERSAL_WANTING: readonly DomainName[] = [
  'time_as_yours',
  'energy_as_resource',
  'felt_aliveness',
  'body_physical_aliveness',
];

function makePerDomainInputs(
  overrides: Partial<PerDomainInputs> = {},
): PerDomainInputs {
  return {
    current_state: 80,
    past_presence: 'no',
    wanting: 'doesnt_want',
    ...overrides,
  };
}

type DomainOverride = Partial<PerDomainInputs> & { omitWanting?: true };

function makeInputMap(
  domainOverrides: Partial<Record<DomainName, DomainOverride>> = {},
): InputMap {
  const domains = {} as InputMap['domains'];
  for (const name of CANONICAL_ORDER) {
    const raw = domainOverrides[name];
    const omitWanting = raw?.omitWanting === true;
    const ov: Partial<PerDomainInputs> = { ...raw };
    delete (ov as { omitWanting?: true }).omitWanting;
    const merged = makePerDomainInputs(ov);
    if (omitWanting) {
      delete (merged as { wanting?: PerDomainInputs['wanting'] }).wanting;
    }
    domains[name] = merged;
  }
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
    domains,
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

function findDomain(
  outputs: DomainPresenceOutput[],
  name: DomainName,
): DomainPresenceOutput {
  const match = outputs.find((o) => o.domain === name);
  if (!match) throw new Error(`domain not found: ${name}`);
  return match;
}

/* ------------------------------------------------------------------ */

describe('A. Five-branch rule (curiosity)', () => {
  it('current_state >= 60 short-circuits to intact', () => {
    const out = findDomain(
      computeDomainPresenceOutputs(
        makeInputMap({
          curiosity: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
        }),
      ),
      'curiosity',
    );
    expect(out.value).toBe('intact');
    expect(out.fires).toBe(false);
  });

  it('< 60, past=yes, wants → reduced_wants_back', () => {
    const out = findDomain(
      computeDomainPresenceOutputs(
        makeInputMap({
          curiosity: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
        }),
      ),
      'curiosity',
    );
    expect(out.value).toBe('reduced_wants_back');
    expect(out.fires).toBe(true);
  });

  it('< 60, past=yes, doesnt_want → reduced_at_peace', () => {
    const out = findDomain(
      computeDomainPresenceOutputs(
        makeInputMap({
          curiosity: { current_state: 50, past_presence: 'yes', wanting: 'doesnt_want' },
        }),
      ),
      'curiosity',
    );
    expect(out.value).toBe('reduced_at_peace');
    expect(out.fires).toBe(true);
  });

  it('< 60, past=no, wants → wants_but_never_had', () => {
    const out = findDomain(
      computeDomainPresenceOutputs(
        makeInputMap({
          curiosity: { current_state: 50, past_presence: 'no', wanting: 'wants' },
        }),
      ),
      'curiosity',
    );
    expect(out.value).toBe('wants_but_never_had');
    expect(out.fires).toBe(true);
  });

  it('< 60, past=no, doesnt_want → never_been_part_of_his_life', () => {
    const out = findDomain(
      computeDomainPresenceOutputs(
        makeInputMap({
          curiosity: { current_state: 50, past_presence: 'no', wanting: 'doesnt_want' },
        }),
      ),
      'curiosity',
    );
    expect(out.value).toBe('never_been_part_of_his_life');
    expect(out.fires).toBe(true);
  });
});

describe('B. Boundary at current_state = 60', () => {
  it('current_state = 60 → intact', () => {
    const out = findDomain(
      computeDomainPresenceOutputs(
        makeInputMap({
          curiosity: { current_state: 60, past_presence: 'yes', wanting: 'wants' },
        }),
      ),
      'curiosity',
    );
    expect(out.value).toBe('intact');
    expect(out.fires).toBe(false);
  });

  it('current_state = 59 → fires (reduced_wants_back)', () => {
    const out = findDomain(
      computeDomainPresenceOutputs(
        makeInputMap({
          curiosity: { current_state: 59, past_presence: 'yes', wanting: 'wants' },
        }),
      ),
      'curiosity',
    );
    expect(out.value).toBe('reduced_wants_back');
    expect(out.fires).toBe(true);
  });

  it('current_state = 0 → fires', () => {
    const out = findDomain(
      computeDomainPresenceOutputs(
        makeInputMap({
          curiosity: { current_state: 0, past_presence: 'no', wanting: 'wants' },
        }),
      ),
      'curiosity',
    );
    expect(out.fires).toBe(true);
  });

  it('current_state = 100 → intact', () => {
    const out = findDomain(
      computeDomainPresenceOutputs(
        makeInputMap({
          curiosity: { current_state: 100, past_presence: 'no', wanting: 'wants' },
        }),
      ),
      'curiosity',
    );
    expect(out.value).toBe('intact');
    expect(out.fires).toBe(false);
  });
});

describe('C. current_state passthrough', () => {
  for (const v of [0, 47.5, 59, 60, 80.25, 100]) {
    it(`passthrough current_state=${v}`, () => {
      const out = findDomain(
        computeDomainPresenceOutputs(
          makeInputMap({ curiosity: { current_state: v } }),
        ),
        'curiosity',
      );
      expect(out.current_state).toBe(v);
    });
  }
});

describe('D. Universal-wanting default — wanting omitted', () => {
  for (const dom of UNIVERSAL_WANTING) {
    it(`${dom}: omitted + past=yes → reduced_wants_back`, () => {
      const out = findDomain(
        computeDomainPresenceOutputs(
          makeInputMap({
            [dom]: { current_state: 50, past_presence: 'yes', omitWanting: true },
          }),
        ),
        dom,
      );
      expect(out.value).toBe('reduced_wants_back');
      expect(out.fires).toBe(true);
    });

    it(`${dom}: omitted + past=no → wants_but_never_had`, () => {
      const out = findDomain(
        computeDomainPresenceOutputs(
          makeInputMap({
            [dom]: { current_state: 50, past_presence: 'no', omitWanting: true },
          }),
        ),
        dom,
      );
      expect(out.value).toBe('wants_but_never_had');
      expect(out.fires).toBe(true);
    });
  }
});

describe('E. Universal-wanting — wanting explicit "wants"', () => {
  for (const dom of UNIVERSAL_WANTING) {
    it(`${dom}: explicit wants + past=yes → reduced_wants_back (matches omitted)`, () => {
      const out = findDomain(
        computeDomainPresenceOutputs(
          makeInputMap({
            [dom]: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
          }),
        ),
        dom,
      );
      expect(out.value).toBe('reduced_wants_back');
    });
  }
});

describe('F. fires flag', () => {
  it('fires === false iff value === "intact" (across all five values)', () => {
    const cases: Array<{
      domain: DomainName;
      inputs: Partial<PerDomainInputs>;
      expectedValue: DomainPresenceOutput['value'];
    }> = [
      {
        domain: 'curiosity',
        inputs: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
        expectedValue: 'intact',
      },
      {
        domain: 'curiosity',
        inputs: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
        expectedValue: 'reduced_wants_back',
      },
      {
        domain: 'curiosity',
        inputs: { current_state: 50, past_presence: 'yes', wanting: 'doesnt_want' },
        expectedValue: 'reduced_at_peace',
      },
      {
        domain: 'curiosity',
        inputs: { current_state: 50, past_presence: 'no', wanting: 'wants' },
        expectedValue: 'wants_but_never_had',
      },
      {
        domain: 'curiosity',
        inputs: { current_state: 50, past_presence: 'no', wanting: 'doesnt_want' },
        expectedValue: 'never_been_part_of_his_life',
      },
    ];
    for (const c of cases) {
      const out = findDomain(
        computeDomainPresenceOutputs(makeInputMap({ [c.domain]: c.inputs })),
        c.domain,
      );
      expect(out.value).toBe(c.expectedValue);
      expect(out.fires).toBe(c.expectedValue !== 'intact');
    }
  });
});

describe('G. Output structure', () => {
  it('always returns 12 entries', () => {
    expect(computeDomainPresenceOutputs(makeInputMap())).toHaveLength(12);
  });

  it('returned in canonical order', () => {
    const out = computeDomainPresenceOutputs(makeInputMap());
    expect(out.map((o) => o.domain)).toEqual([...CANONICAL_ORDER]);
  });

  it('canonical order independent of input shape', () => {
    const out = computeDomainPresenceOutputs(
      makeInputMap({
        mattering: { current_state: 30, past_presence: 'yes', wanting: 'wants' },
        time_as_yours: { current_state: 30, past_presence: 'yes' },
      }),
    );
    for (let i = 0; i < CANONICAL_ORDER.length; i++) {
      expect(out[i]!.domain).toBe(CANONICAL_ORDER[i]);
    }
  });
});

describe('H. Independence between domains', () => {
  it('mixed scenario: each domain resolves independently', () => {
    const input = makeInputMap({
      curiosity: { current_state: 30, past_presence: 'yes', wanting: 'wants' },
      friendship: { current_state: 80, past_presence: 'no', wanting: 'doesnt_want' },
      mattering: { current_state: 0, past_presence: 'no', wanting: 'wants' },
      time_as_yours: { current_state: 30, past_presence: 'no', omitWanting: true },
    });
    const out = computeDomainPresenceOutputs(input);

    expect(findDomain(out, 'curiosity').value).toBe('reduced_wants_back');
    expect(findDomain(out, 'friendship').value).toBe('intact');
    expect(findDomain(out, 'mattering').value).toBe('wants_but_never_had');
    expect(findDomain(out, 'time_as_yours').value).toBe('wants_but_never_had');

    for (const name of CANONICAL_ORDER) {
      if (
        name === 'curiosity' ||
        name === 'friendship' ||
        name === 'mattering' ||
        name === 'time_as_yours'
      )
        continue;
      expect(findDomain(out, name).value).toBe('intact');
    }
  });

  it('modifying one domain does not affect another', () => {
    const baseline = computeDomainPresenceOutputs(
      makeInputMap({
        curiosity: { current_state: 80, past_presence: 'yes', wanting: 'wants' },
      }),
    );
    const perturbed = computeDomainPresenceOutputs(
      makeInputMap({
        curiosity: { current_state: 10, past_presence: 'no', wanting: 'doesnt_want' },
      }),
    );
    expect(findDomain(perturbed, 'friendship')).toEqual(
      findDomain(baseline, 'friendship'),
    );
  });
});
