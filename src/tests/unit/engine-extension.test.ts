// Engine extension tests (ENGINE.md v3): life_texture_band (§4.4),
// expression_space[d] (§4.5), Pull state split (§5.1), and validity rules
// 6-9 (§3.1). Separate from the pre-extension unit tests to keep the
// migration legible.

import { describe, expect, it } from 'vitest';
import {
  computeExpressionSpace,
  computeLifeTextureBand,
} from '../../engine/derivations';
import { computeDirectionOutputs } from '../../engine/scoring/direction';
import { validateInputMap } from '../../engine/validation';
import type {
  DirectionOutput,
  InputMap,
  PerDirectionInputs,
  WeekShapeFlags,
} from '../../engine/types';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function allFalseWeekShape(): WeekShapeFlags {
  return {
    work_dominates: false,
    weekends_consumed: false,
    weekly_activity: false,
    sees_people: false,
    makes_things: false,
    active_body: false,
    belongs_to_group: false,
    solo_practice: false,
    varied_week: false,
  };
}

function makeDirectionInputs(
  o: Partial<PerDirectionInputs> = {},
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
    ...o,
  };
}

function makeInputMap(
  opts: {
    week_shape?: Partial<WeekShapeFlags>;
    creator?: Partial<PerDirectionInputs>;
    capacity_strain?: 'yes' | 'no';
  } = {},
): InputMap {
  return {
    directions: {
      contributor: makeDirectionInputs(),
      experience_seeker: makeDirectionInputs(),
      freedom_designer: makeDirectionInputs(),
      growth_focused: makeDirectionInputs(),
      creator: makeDirectionInputs(opts.creator),
      relationship_rebuilder: makeDirectionInputs(),
    },
    cross_direction: {
      direction_chosen: 'none',
      capacity_strain: opts.capacity_strain ?? 'no',
      life_shape_duration: 'recent',
      week_shape: { ...allFalseWeekShape(), ...(opts.week_shape ?? {}) },
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
      time_as_yours: { current_state: 50, past_presence: 'yes' },
      energy_as_resource: { current_state: 50, past_presence: 'yes' },
      felt_aliveness: { current_state: 50, past_presence: 'yes' },
      body_physical_aliveness: { current_state: 50, past_presence: 'yes' },
      curiosity: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      making: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      conversation_depth: {
        current_state: 50,
        past_presence: 'yes',
        wanting: 'wants',
      },
      being_known: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      friendship: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      intimacy: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      mattering: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
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
      replacement_structure_exists: 'no',
      recent_reaching: 'no_current_reaching',
    },
    self_report: { named_absences: [] },
  };
}

/* ------------------------------------------------------------------ */
/* §4.4 life_texture_band                                              */
/* ------------------------------------------------------------------ */

describe('life_texture_band (§4.4)', () => {
  it('empty: zero texture and zero pressure', () => {
    expect(computeLifeTextureBand(allFalseWeekShape())).toBe('empty');
  });

  it('depleted: zero texture and pressure >= 1', () => {
    expect(
      computeLifeTextureBand({ ...allFalseWeekShape(), work_dominates: true }),
    ).toBe('depleted');
    expect(
      computeLifeTextureBand({
        ...allFalseWeekShape(),
        work_dominates: true,
        weekends_consumed: true,
      }),
    ).toBe('depleted');
  });

  it('mixed: 1-3 texture flags regardless of pressure', () => {
    expect(
      computeLifeTextureBand({ ...allFalseWeekShape(), sees_people: true }),
    ).toBe('mixed');
    expect(
      computeLifeTextureBand({
        ...allFalseWeekShape(),
        sees_people: true,
        makes_things: true,
        solo_practice: true,
      }),
    ).toBe('mixed');
    expect(
      computeLifeTextureBand({
        ...allFalseWeekShape(),
        sees_people: true,
        work_dominates: true,
        weekends_consumed: true,
      }),
    ).toBe('mixed');
  });

  it('textured: 4+ texture flags', () => {
    expect(
      computeLifeTextureBand({
        ...allFalseWeekShape(),
        weekly_activity: true,
        sees_people: true,
        makes_things: true,
        active_body: true,
      }),
    ).toBe('textured');
    expect(
      computeLifeTextureBand({
        ...allFalseWeekShape(),
        weekly_activity: true,
        sees_people: true,
        makes_things: true,
        active_body: true,
        belongs_to_group: true,
        solo_practice: true,
      }),
    ).toBe('textured');
  });

  it('varied_week is excluded from the count', () => {
    expect(
      computeLifeTextureBand({ ...allFalseWeekShape(), varied_week: true }),
    ).toBe('empty');
  });
});

/* ------------------------------------------------------------------ */
/* §4.5 expression_space[d]                                            */
/* ------------------------------------------------------------------ */

describe('expression_space (§4.5)', () => {
  // Making -> makes_things
  it('Making has_space iff makes_things', () => {
    const w = allFalseWeekShape();
    expect(computeExpressionSpace('creator', w)).toBe('no_space');
    expect(
      computeExpressionSpace('creator', { ...w, makes_things: true }),
    ).toBe('has_space');
  });

  // Relationship -> sees_people
  it('Relationship has_space iff sees_people', () => {
    const w = allFalseWeekShape();
    expect(computeExpressionSpace('relationship_rebuilder', w)).toBe('no_space');
    expect(
      computeExpressionSpace('relationship_rebuilder', { ...w, sees_people: true }),
    ).toBe('has_space');
  });

  // Experience -> weekly_activity AND varied_week
  it('Experience requires BOTH weekly_activity and varied_week', () => {
    const w = allFalseWeekShape();
    expect(computeExpressionSpace('experience_seeker', w)).toBe('no_space');
    expect(
      computeExpressionSpace('experience_seeker', { ...w, weekly_activity: true }),
    ).toBe('no_space');
    expect(
      computeExpressionSpace('experience_seeker', { ...w, varied_week: true }),
    ).toBe('no_space');
    expect(
      computeExpressionSpace('experience_seeker', {
        ...w,
        weekly_activity: true,
        varied_week: true,
      }),
    ).toBe('has_space');
  });

  // Freedom -> solo_practice OR (NOT work_dominates AND NOT weekends_consumed)
  it('Freedom has_space via solo_practice OR unconsumed time', () => {
    const w = allFalseWeekShape();
    // All-false (no work, no weekends): unconsumed time path fires.
    expect(computeExpressionSpace('freedom_designer', w)).toBe('has_space');
    // work_dominates alone: unconsumed path blocked, solo absent → no_space.
    expect(
      computeExpressionSpace('freedom_designer', { ...w, work_dominates: true }),
    ).toBe('no_space');
    // Both load flags, solo present → solo path carries it.
    expect(
      computeExpressionSpace('freedom_designer', {
        ...w,
        work_dominates: true,
        weekends_consumed: true,
        solo_practice: true,
      }),
    ).toBe('has_space');
    // Only weekends_consumed: unconsumed path blocked, solo absent → no_space.
    expect(
      computeExpressionSpace('freedom_designer', { ...w, weekends_consumed: true }),
    ).toBe('no_space');
  });

  // Growth -> active_body OR weekly_activity
  it('Growth has_space via active_body OR weekly_activity', () => {
    const w = allFalseWeekShape();
    expect(computeExpressionSpace('growth_focused', w)).toBe('no_space');
    expect(
      computeExpressionSpace('growth_focused', { ...w, active_body: true }),
    ).toBe('has_space');
    expect(
      computeExpressionSpace('growth_focused', { ...w, weekly_activity: true }),
    ).toBe('has_space');
  });

  // Contribution -> belongs_to_group OR sees_people
  it('Contribution has_space via belongs_to_group OR sees_people', () => {
    const w = allFalseWeekShape();
    expect(computeExpressionSpace('contributor', w)).toBe('no_space');
    expect(
      computeExpressionSpace('contributor', { ...w, belongs_to_group: true }),
    ).toBe('has_space');
    expect(
      computeExpressionSpace('contributor', { ...w, sees_people: true }),
    ).toBe('has_space');
  });
});

/* ------------------------------------------------------------------ */
/* §5.1 Pull state split                                               */
/* ------------------------------------------------------------------ */

describe('Pull state split (§5.1)', () => {
  function makingPullState(input: InputMap): DirectionOutput['pull_state'] {
    const out = computeDirectionOutputs(
      input,
      // Minimal domain presence outputs; irrelevant to Pull state.
      [
        'time_as_yours',
        'energy_as_resource',
        'felt_aliveness',
        'body_physical_aliveness',
        'curiosity',
        'creator',
        'conversation_depth',
        'being_known',
        'friendship',
        'intimacy',
        'mattering',
      ].map((d) => ({
        domain: d as never,
        current_state: 50,
        fires: false,
        value: 'intact' as const,
      })),
      0,
    );
    return out.find((o) => o.direction === 'creator')!.pull_state;
  }

  it('specificity:strong + has_space → held_attributed_with_expression', () => {
    const input = makeInputMap({
      creator: { specificity: 'strong' },
      week_shape: { makes_things: true },
    });
    expect(makingPullState(input)).toContain('held_attributed_with_expression');
    expect(makingPullState(input)).not.toContain('held_attributed_unexpressed');
  });

  it('specificity:strong + no_space → held_attributed_unexpressed', () => {
    const input = makeInputMap({
      creator: { specificity: 'strong' },
      week_shape: { makes_things: false },
    });
    expect(makingPullState(input)).toContain('held_attributed_unexpressed');
    expect(makingPullState(input)).not.toContain(
      'held_attributed_with_expression',
    );
  });

  it('specificity:partial → neither held-attributed value fires', () => {
    const input = makeInputMap({
      creator: { specificity: 'partial' },
      week_shape: { makes_things: true },
    });
    const s = makingPullState(input);
    expect(s).not.toContain('held_attributed_with_expression');
    expect(s).not.toContain('held_attributed_unexpressed');
  });

  it('the two held-attributed values are mutually exclusive per §5.1', () => {
    // Either specificity:strong fires exactly one of the two, or neither.
    for (const makes of [true, false]) {
      for (const spec of ['none', 'partial', 'strong'] as const) {
        const input = makeInputMap({
          creator: { specificity: spec },
          week_shape: { makes_things: makes },
        });
        const s = makingPullState(input);
        const withExp = s.includes('held_attributed_with_expression');
        const unexp = s.includes('held_attributed_unexpressed');
        expect(withExp && unexp).toBe(false);
        if (spec === 'strong') {
          expect(withExp || unexp).toBe(true);
        } else {
          expect(withExp || unexp).toBe(false);
        }
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* §3.1 Validity rules 6, 7, 8, 9                                      */
/* ------------------------------------------------------------------ */

describe('Validity rule 6 — week_shape completeness (§3.1)', () => {
  it('missing flag rejected by name', () => {
    const m = makeInputMap();
    delete (m.cross_direction.week_shape as Record<string, unknown>)
      .makes_things;
    const r = validateInputMap(m);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(
        r.errors.some(
          (e) =>
            e.code === 'missing_field' &&
            e.path === 'cross_direction.week_shape.makes_things',
        ),
      ).toBe(true);
    }
  });

  it('non-boolean flag rejected with invalid_type', () => {
    const m = makeInputMap();
    (m.cross_direction.week_shape as Record<string, unknown>).sees_people =
      'yes';
    const r = validateInputMap(m);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(
        r.errors.some(
          (e) =>
            e.code === 'invalid_type' &&
            e.path === 'cross_direction.week_shape.sees_people',
        ),
      ).toBe(true);
    }
  });

  it('all nine flags as booleans accepted', () => {
    expect(validateInputMap(makeInputMap()).ok).toBe(true);
  });
});

describe('Validity rule 7 — axis enum values (§3.1)', () => {
  const invalid: Array<[keyof InputMap['cross_direction'], string]> = [
    ['life_stage', 'rumbling'],
    ['sociality_default', 'introverted'],
    ['paid_work_relationship', 'vocation'],
    ['primary_load', 'parenting'],
  ];
  for (const [field, bad] of invalid) {
    it(`${field} rejects unknown value`, () => {
      const m = makeInputMap();
      (m.cross_direction as Record<string, unknown>)[field] = bad;
      const r = validateInputMap(m);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(
          r.errors.some(
            (e) =>
              e.code === 'invalid_categorical' &&
              e.path === `cross_direction.${field}`,
          ),
        ).toBe(true);
      }
    });
  }

  it('enduring (Round 1 addition) accepted as life_stage', () => {
    const m = makeInputMap();
    m.cross_direction.life_stage = 'enduring';
    expect(validateInputMap(m).ok).toBe(true);
  });
});

describe('Validity rule 8 — self_report shape (§3.1)', () => {
  it('non-array named_absences rejected', () => {
    const m = makeInputMap();
    (m.self_report as Record<string, unknown>).named_absences = 'none';
    const r = validateInputMap(m);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(
        r.errors.some(
          (e) =>
            e.code === 'invalid_type' &&
            e.path === 'self_report.named_absences',
        ),
      ).toBe(true);
    }
  });

  it('unknown SelfReportItemId rejected', () => {
    const m = makeInputMap();
    (m.self_report.named_absences as unknown[]) = ['more_holidays'];
    const r = validateInputMap(m);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(
        r.errors.some(
          (e) =>
            e.code === 'invalid_categorical' &&
            e.path === 'self_report.named_absences[0]',
        ),
      ).toBe(true);
    }
  });

  it('empty array accepted', () => {
    expect(validateInputMap(makeInputMap()).ok).toBe(true);
  });
});

describe('Validity rule 9 — cap and nothing_really exclusion (§3.1)', () => {
  it('four entries rejected with self_report_cap_exceeded', () => {
    const m = makeInputMap();
    m.self_report.named_absences = [
      'more_friends',
      'more_time_to_myself',
      'more_energy',
      'proper_conversation',
    ];
    const r = validateInputMap(m);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(
        r.errors.some((e) => e.code === 'self_report_cap_exceeded'),
      ).toBe(true);
    }
  });

  it('three entries accepted', () => {
    const m = makeInputMap();
    m.self_report.named_absences = [
      'more_friends',
      'more_time_to_myself',
      'more_energy',
    ];
    expect(validateInputMap(m).ok).toBe(true);
  });

  it('nothing_really alone accepted', () => {
    const m = makeInputMap();
    m.self_report.named_absences = ['nothing_really'];
    expect(validateInputMap(m).ok).toBe(true);
  });

  it('nothing_really with another item rejected', () => {
    const m = makeInputMap();
    m.self_report.named_absences = ['nothing_really', 'more_friends'];
    const r = validateInputMap(m);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(
        r.errors.some(
          (e) => e.code === 'self_report_nothing_really_exclusive',
        ),
      ).toBe(true);
    }
  });
});
