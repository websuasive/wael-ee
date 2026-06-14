// Unit tests for synthesis predicates: shape sentence iteration (first-match-wins) and matched-direction extraction (SYNTHESIS.md sections 7.0 and 8).

import { describe, it, expect } from 'vitest';
import type {
  EngineOutput,
  InputMap,
  DirectionName,
  DirectionOutput,
  PerDirectionInputs,
  DomainName,
  DomainPresenceOutput,
} from '@/engine';
import {
  findFirstMatchingSentence,
  extractMatchedDirection,
  allBandsAt,
} from '@/synthesis/predicates';
import { shapeSentences } from '@/synthesis/data/shape_sentences';

/* ------------------------------------------------------------------ */
/* Test helpers — minimal valid baselines                             */
/* ------------------------------------------------------------------ */

const DIRECTION_NAMES: DirectionName[] = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
];

const DOMAIN_NAMES: DomainName[] = [
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
];

function baselineDirectionOutput(name: DirectionName): DirectionOutput {
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

function baselineDomainOutput(name: DomainName): DomainPresenceOutput {
  return {
    domain: name,
    current_state: 80,
    fires: false,
    value: 'intact',
  };
}

function makeEngineOutput(
  directionOverrides: Partial<Record<DirectionName, Partial<DirectionOutput>>> = {},
  domainOverrides: Partial<Record<DomainName, Partial<DomainPresenceOutput>>> = {},
  rest: {
    sustained_constraint_intensity?: number;
    permission_sub_shape?: 'present' | 'want_block' | 'say_block' | 'act_block';
    cross_cutting?: Partial<
      Record<'between_shapes' | 'mid_process', boolean>
    >;
  } = {},
): EngineOutput {
  const directions = DIRECTION_NAMES.map((name) => ({
    ...baselineDirectionOutput(name),
    ...(directionOverrides[name] ?? {}),
  }));
  const domains = DOMAIN_NAMES.map((name) => ({
    ...baselineDomainOutput(name),
    ...(domainOverrides[name] ?? {}),
  }));
  return {
    directions,
    domains,
    constraints: {
      sustained_constraint_intensity: rest.sustained_constraint_intensity ?? 0,
      energy: { value: 80, band: 'full', fires: false },
      time: { value: 80, band: 'open', fires: false },
      body_capacity: { value: 80, band: 'full', fires: false },
      permission: {
        value: 80,
        band: 'present',
        sub_shape: rest.permission_sub_shape ?? 'present',
        fires: false,
      },
    },
    cross_cutting: [
      {
        output: 'between_shapes',
        fires: rest.cross_cutting?.between_shapes ?? false,
      },
      {
        output: 'mid_process',
        fires: rest.cross_cutting?.mid_process ?? false,
      },
    ],
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

function baselinePerDirectionInputs(): PerDirectionInputs {
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

function makeInputMap(
  directionOverrides: Partial<
    Record<DirectionName, Partial<PerDirectionInputs>>
  > = {},
  rest: {
    life_shape_duration?: 'recent' | 'sustained' | 'long';
    capacity_strain?: 'no' | 'yes';
  } = {},
): InputMap {
  const dirs = Object.fromEntries(
    DIRECTION_NAMES.map((name) => [
      name,
      { ...baselinePerDirectionInputs(), ...(directionOverrides[name] ?? {}) },
    ]),
  ) as InputMap['directions'];
  return {
    directions: dirs,
    cross_direction: {
      direction_chosen: 'none',
      capacity_strain: rest.capacity_strain ?? 'no',
      life_shape_duration: rest.life_shape_duration ?? 'recent',
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
      conversation_depth: {
        current_state: 80,
        past_presence: 'yes',
        wanting: 'wants',
      },
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
      recent_reaching: 'no_current_reaching',
    },
    self_report: {
      named_absences: [],
    },
  };
}

function findById(id: string) {
  return shapeSentences.find((s) => s.id === id);
}

/* ------------------------------------------------------------------ */
/* A — findFirstMatchingSentence: slot iteration                      */
/* ------------------------------------------------------------------ */

describe('findFirstMatchingSentence — slot iteration', () => {
  it('returns null when no predicate matches the baseline profile', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap();
    expect(findFirstMatchingSentence('pattern_paragraph', out, inp)).toBeNull();
  });

  it('returns the saturated match when only saturated predicate holds', () => {
    const out = makeEngineOutput({
      creator: { pull_quality: ['saturated'] },
    });
    const inp = makeInputMap();
    const match = findFirstMatchingSentence('pattern_paragraph', out, inp);
    expect(match).not.toBeNull();
    expect(match!.id).toBe('saturated');
    expect(match!.sentence).toBe('Wanting present on a direction, but soured.');
    expect(match!.matched_direction).toBeNull();
  });

  it('respects array order: desired_direction_partial wins over desired_direction_full when both could fire', () => {
    // Configure profile so both _partial and _full predicates are simultaneously true:
    //   one direction has 'phantom_partial', another has 'phantom',
    //   and no direction has 'real' / 'suppressed' / 'saturated' / 'behaviourally_divergent'.
    const out = makeEngineOutput({
      creator: { pull_quality: ['phantom_partial'], pull: 60 },
      freedom_designer: { pull_quality: ['phantom'], pull: 50 },
    });
    const inp = makeInputMap();
    const match = findFirstMatchingSentence('pattern_paragraph', out, inp);
    expect(match).not.toBeNull();
    expect(match!.id).toBe('desired_direction_partial');
  });
});

/* ------------------------------------------------------------------ */
/* B — slot scoping                                                   */
/* ------------------------------------------------------------------ */

describe('findFirstMatchingSentence — slot scoping', () => {
  it('only considers entries matching the requested slot', () => {
    const out = makeEngineOutput({
      creator: { pull_quality: ['saturated'] },
    });
    const inp = makeInputMap();
    const pp = findFirstMatchingSentence('pattern_paragraph', out, inp);
    const card = findFirstMatchingSentence('direction_card_summary', out, inp);
    expect(pp?.id).toBe('saturated');
    expect(card?.id).toBe('card_saturated');
    expect(pp?.id).not.toBe(card?.id);
  });
});

/* ------------------------------------------------------------------ */
/* C — order is load-bearing                                          */
/* ------------------------------------------------------------------ */

describe('findFirstMatchingSentence — order is load-bearing', () => {
  it('deep_suppression_multi (index 0) wins over suppressed_standard_multi (index 1) when both are configurable', () => {
    // deep_suppression_multi requires SCI >= 70 AND life_shape_duration === 'long'.
    // suppressed_standard_multi requires 60 <= SCI < 70 AND life_shape_duration !== 'long'.
    // The two SCI/duration conditions are mutually exclusive by spec.
    // Construct the deep_suppression_multi conditions; verify it fires and wins.
    const out = makeEngineOutput(
      {
        creator: { pull_quality: ['suppressed'] },
        freedom_designer: { pull_quality: ['suppressed'] },
        contributor: { pull_quality: ['suppressed'] },
      },
      {},
      { sustained_constraint_intensity: 80 },
    );
    const inp = makeInputMap(
      {
        creator: { past_presence: 'yes', felt_cost: 60 },
        freedom_designer: { past_presence: 'yes', felt_cost: 60 },
        contributor: { past_presence: 'yes', felt_cost: 60 },
      },
      { life_shape_duration: 'long' },
    );
    // Sanity: deep_suppression_multi predicate fires.
    const deep = findById('deep_suppression_multi')!;
    expect(deep.predicate(out, inp)).toBe(true);
    // First match wins.
    const match = findFirstMatchingSentence('pattern_paragraph', out, inp);
    expect(match?.id).toBe('deep_suppression_multi');
  });
});

/* ------------------------------------------------------------------ */
/* D — extractMatchedDirection: active_with_tension                   */
/* ------------------------------------------------------------------ */

describe('extractMatchedDirection — active_with_tension', () => {
  it('returns the highest-pull direction matching the predicate', () => {
    // output.directions array order acts as the pull-descending order per engine guarantee.
    // We'll place 'creator' first with pull=80 and 'freedom_designer' later with pull=70.
    const out = makeEngineOutput({
      creator: { pull: 80, quadrant: 'active', pull_state: ['capacity_strain'] },
      freedom_designer: { pull: 70, quadrant: 'active', pull_state: ['capacity_strain'] },
    });
    // The baseline directions array is alphabetical; the engine's actual output
    // is pull-sorted descending. For this test we manually reorder.
    const reordered: EngineOutput = {
      ...out,
      directions: [...out.directions].sort((a, b) => b.pull - a.pull),
    };
    const inp = makeInputMap();
    expect(
      extractMatchedDirection('active_with_tension', reordered, inp),
    ).toBe('creator');
  });

  it('returns null when no direction matches', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap();
    expect(extractMatchedDirection('active_with_tension', out, inp)).toBeNull();
  });

  it('boundary: pull = 70 satisfies the >= 70 clause', () => {
    const out = makeEngineOutput({
      creator: { pull: 70, quadrant: 'active', pull_state: ['capacity_strain'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('active_with_tension', out, inp)).toBe(
      'creator',
    );
  });

  it('boundary: pull = 69 does not match', () => {
    const out = makeEngineOutput({
      creator: { pull: 69, quadrant: 'active', pull_state: ['capacity_strain'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('active_with_tension', out, inp)).toBeNull();
  });

  it('multi-direction match in alphabetical-order array selects highest pull (regression: defensive sort)', () => {
    // Three directions all match: experience (pull 75), making (pull 90), relationship (pull 80).
    // makeEngineOutput emits directions in alphabetical order; experience appears before making.
    // Without the defensive sort, .find would return 'experience_seeker'. The correct answer is 'creator'.
    const out = makeEngineOutput({
      experience_seeker: { pull: 75, quadrant: 'active', pull_state: ['capacity_strain'] },
      creator: { pull: 90, quadrant: 'active', pull_state: ['capacity_strain'] },
      relationship_rebuilder: { pull: 80, quadrant: 'active', pull_state: ['capacity_strain'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('active_with_tension', out, inp)).toBe(
      'creator',
    );
  });
});

/* ------------------------------------------------------------------ */
/* E — extractMatchedDirection: desired_direction_partial             */
/* ------------------------------------------------------------------ */

describe('extractMatchedDirection — desired_direction_partial', () => {
  it('returns the phantom_partial direction (not the phantom one)', () => {
    const out = makeEngineOutput({
      creator: { pull: 60, pull_quality: ['phantom'] },
      freedom_designer: { pull: 50, pull_quality: ['phantom_partial'] },
    });
    const reordered: EngineOutput = {
      ...out,
      directions: [...out.directions].sort((a, b) => b.pull - a.pull),
    };
    const inp = makeInputMap();
    expect(
      extractMatchedDirection('desired_direction_partial', reordered, inp),
    ).toBe('freedom_designer');
  });

  it('returns null when no direction has phantom_partial', () => {
    const out = makeEngineOutput({
      creator: { pull_quality: ['phantom'] },
    });
    const inp = makeInputMap();
    expect(
      extractMatchedDirection('desired_direction_partial', out, inp),
    ).toBeNull();
  });

  it('multi-direction phantom_partial in alphabetical-order array selects highest pull (regression: defensive sort)', () => {
    // Two directions both have phantom_partial. makeEngineOutput emits in alphabetical order,
    // so 'experience_seeker' (lower pull) precedes 'creator' (higher pull). The defensive sort must
    // pick 'creator'; without it, .find would return 'experience_seeker'.
    const out = makeEngineOutput({
      experience_seeker: { pull: 50, pull_quality: ['phantom_partial'] },
      creator: { pull: 80, pull_quality: ['phantom_partial'] },
    });
    const inp = makeInputMap();
    expect(
      extractMatchedDirection('desired_direction_partial', out, inp),
    ).toBe('creator');
  });
});

/* ------------------------------------------------------------------ */
/* F — extractMatchedDirection: desired_direction_full                */
/* ------------------------------------------------------------------ */

describe('extractMatchedDirection — desired_direction_full', () => {
  it('returns the highest-pull phantom direction', () => {
    const out = makeEngineOutput({
      creator: { pull: 80, pull_quality: ['phantom'] },
      freedom_designer: { pull: 60, pull_quality: ['phantom'] },
    });
    const reordered: EngineOutput = {
      ...out,
      directions: [...out.directions].sort((a, b) => b.pull - a.pull),
    };
    const inp = makeInputMap();
    expect(
      extractMatchedDirection('desired_direction_full', reordered, inp),
    ).toBe('creator');
  });

  it('returns null when no direction has phantom', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap();
    expect(
      extractMatchedDirection('desired_direction_full', out, inp),
    ).toBeNull();
  });

  it('multi-direction phantom in alphabetical-order array selects highest pull (regression: defensive sort)', () => {
    // Two directions both have phantom. makeEngineOutput emits in alphabetical order,
    // so 'experience_seeker' (lower pull) precedes 'creator' (higher pull). The defensive sort must
    // pick 'creator'; without it, .find would return 'experience_seeker'.
    const out = makeEngineOutput({
      experience_seeker: { pull: 50, pull_quality: ['phantom'] },
      creator: { pull: 80, pull_quality: ['phantom'] },
    });
    const inp = makeInputMap();
    expect(
      extractMatchedDirection('desired_direction_full', out, inp),
    ).toBe('creator');
  });
});

/* ------------------------------------------------------------------ */
/* G — non-targeted IDs always return null                            */
/* ------------------------------------------------------------------ */

describe('extractMatchedDirection — non-targeted IDs', () => {
  const out = makeEngineOutput({
    creator: { pull_quality: ['saturated', 'phantom'], quadrant: 'active', pull: 80 },
  });
  const inp = makeInputMap();

  it('saturated → null', () => {
    expect(extractMatchedDirection('saturated', out, inp)).toBeNull();
  });

  it('between_shapes_clean → null', () => {
    expect(extractMatchedDirection('between_shapes_clean', out, inp)).toBeNull();
  });

  it('card_real_active_strong → null (cards.ts handles per-card mechanism separately)', () => {
    expect(
      extractMatchedDirection('card_real_active_strong', out, inp),
    ).toBeNull();
  });

  it('unknown ID → null', () => {
    expect(
      extractMatchedDirection('an_id_that_does_not_exist', out, inp),
    ).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* H — findFirstMatchingSentence populates matched_direction          */
/* ------------------------------------------------------------------ */

describe('findFirstMatchingSentence — matched_direction populated', () => {
  it('active_with_tension → matched_direction = making', () => {
    const out = makeEngineOutput({
      creator: { pull: 80, quadrant: 'active', pull_state: ['capacity_strain'] },
    });
    const reordered: EngineOutput = {
      ...out,
      directions: [...out.directions].sort((a, b) => b.pull - a.pull),
    };
    const inp = makeInputMap();
    const match = findFirstMatchingSentence(
      'pattern_paragraph',
      reordered,
      inp,
    );
    expect(match?.id).toBe('active_with_tension');
    expect(match?.matched_direction).toBe('creator');
  });

  it('desired_direction_partial → matched_direction = freedom', () => {
    const out = makeEngineOutput({
      freedom_designer: { pull: 60, pull_quality: ['phantom_partial'] },
    });
    const reordered: EngineOutput = {
      ...out,
      directions: [...out.directions].sort((a, b) => b.pull - a.pull),
    };
    const inp = makeInputMap();
    const match = findFirstMatchingSentence(
      'pattern_paragraph',
      reordered,
      inp,
    );
    expect(match?.id).toBe('desired_direction_partial');
    expect(match?.matched_direction).toBe('freedom_designer');
  });

  it('desired_direction_full → matched_direction = growth', () => {
    const out = makeEngineOutput({
      growth_focused: { pull: 60, pull_quality: ['phantom'] },
    });
    const reordered: EngineOutput = {
      ...out,
      directions: [...out.directions].sort((a, b) => b.pull - a.pull),
    };
    const inp = makeInputMap();
    const match = findFirstMatchingSentence(
      'pattern_paragraph',
      reordered,
      inp,
    );
    expect(match?.id).toBe('desired_direction_full');
    expect(match?.matched_direction).toBe('growth_focused');
  });

  it('saturated → matched_direction = null', () => {
    const out = makeEngineOutput({
      creator: { pull_quality: ['saturated'] },
    });
    const inp = makeInputMap();
    const match = findFirstMatchingSentence('pattern_paragraph', out, inp);
    expect(match?.id).toBe('saturated');
    expect(match?.matched_direction).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* I — purity                                                         */
/* ------------------------------------------------------------------ */

describe('findFirstMatchingSentence — purity', () => {
  it('two calls with identical inputs return deep-equal results', () => {
    const out = makeEngineOutput({
      creator: { pull_quality: ['saturated'] },
    });
    const inp = makeInputMap();
    const a = findFirstMatchingSentence('pattern_paragraph', out, inp);
    const b = findFirstMatchingSentence('pattern_paragraph', out, inp);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

/* ------------------------------------------------------------------ */
/* J (v4) — allBandsAt predicate helper                              */
/* ------------------------------------------------------------------ */

describe('allBandsAt — v4 predicate helper', () => {
  it('returns true when all seven bands are "high"', () => {
    const out = makeEngineOutput();
    out.cross_direction.structural_narrowing_band = 'high';
    out.cross_direction.experiential_narrowing_band = 'high';
    out.cross_direction.psychological_narrowing_band = 'high';
    out.cross_direction.identity_narrowing_band = 'high';
    out.cross_direction.energetic_narrowing_band = 'high';
    out.cross_direction.relational_narrowing_band = 'high';
    out.cross_direction.attention_narrowing_band = 'high';
    expect(allBandsAt(out, 'high')).toBe(true);
  });

  it('returns true when all seven bands are "moderate"', () => {
    const out = makeEngineOutput();
    // makeEngineOutput defaults all bands to 'moderate'
    expect(allBandsAt(out, 'moderate')).toBe(true);
  });

  it('returns false when six bands are "high" and one is "moderate"', () => {
    const out = makeEngineOutput();
    out.cross_direction.structural_narrowing_band = 'high';
    out.cross_direction.experiential_narrowing_band = 'high';
    out.cross_direction.psychological_narrowing_band = 'high';
    out.cross_direction.identity_narrowing_band = 'high';
    out.cross_direction.energetic_narrowing_band = 'high';
    out.cross_direction.relational_narrowing_band = 'high';
    out.cross_direction.attention_narrowing_band = 'moderate'; // divergent
    expect(allBandsAt(out, 'high')).toBe(false);
  });

  it('returns true when all seven bands are "low"', () => {
    const out = makeEngineOutput();
    out.cross_direction.structural_narrowing_band = 'low';
    out.cross_direction.experiential_narrowing_band = 'low';
    out.cross_direction.psychological_narrowing_band = 'low';
    out.cross_direction.identity_narrowing_band = 'low';
    out.cross_direction.energetic_narrowing_band = 'low';
    out.cross_direction.relational_narrowing_band = 'low';
    out.cross_direction.attention_narrowing_band = 'low';
    expect(allBandsAt(out, 'low')).toBe(true);
  });

  it('returns false when all seven bands are "low" but checking for "moderate"', () => {
    const out = makeEngineOutput();
    out.cross_direction.structural_narrowing_band = 'low';
    out.cross_direction.experiential_narrowing_band = 'low';
    out.cross_direction.psychological_narrowing_band = 'low';
    out.cross_direction.identity_narrowing_band = 'low';
    out.cross_direction.energetic_narrowing_band = 'low';
    out.cross_direction.relational_narrowing_band = 'low';
    out.cross_direction.attention_narrowing_band = 'low';
    expect(allBandsAt(out, 'moderate')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* K — extractMatchedDirection: held_unexpressed_strong               */
/* ------------------------------------------------------------------ */

describe('extractMatchedDirection — held_unexpressed_strong', () => {
  it('returns the highest-pull direction with held_attributed_unexpressed when multiple directions satisfy', () => {
    const out = makeEngineOutput({
      creator: { pull: 80, pull_state: ['held_attributed_unexpressed'] },
      freedom_designer: { pull: 60, pull_state: ['held_attributed_unexpressed'] },
      experience_seeker: { pull: 90, pull_state: [] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('held_unexpressed_strong', out, inp)).toBe('creator');
  });

  it('returns the single direction with held_attributed_unexpressed', () => {
    const out = makeEngineOutput({
      freedom_designer: { pull: 50, pull_state: ['held_attributed_unexpressed'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('held_unexpressed_strong', out, inp)).toBe('freedom_designer');
  });

  it('returns null when no direction has held_attributed_unexpressed', () => {
    const out = makeEngineOutput({
      creator: { pull: 80, pull_state: ['capacity_strain'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('held_unexpressed_strong', out, inp)).toBeNull();
  });

  it('tiebreak: two directions with identical pull, returns alphabetically-first by engine name', () => {
    const out = makeEngineOutput({
      creator: { pull: 70, pull_state: ['held_attributed_unexpressed'] },
      freedom_designer: { pull: 70, pull_state: ['held_attributed_unexpressed'] },
    });
    const inp = makeInputMap();
    // Alphabetically: contributor, creator, experience, freedom, growth, relationship
    // Both 'freedom_designer' and 'creator' have pull=70 and held_attributed_unexpressed.
    // Alphabetically, 'creator' comes before 'freedom_designer'.
    expect(extractMatchedDirection('held_unexpressed_strong', out, inp)).toBe('creator');
  });

  it('defensive sort: selects highest-pull from alphabetically-ordered array', () => {
    const out = makeEngineOutput({
      experience_seeker: { pull: 50, pull_state: ['held_attributed_unexpressed'] },
      creator: { pull: 90, pull_state: ['held_attributed_unexpressed'] },
      relationship_rebuilder: { pull: 70, pull_state: ['held_attributed_unexpressed'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('held_unexpressed_strong', out, inp)).toBe('creator');
  });
});

/* ------------------------------------------------------------------ */
/* L — extractMatchedDirection: held_unexpressed_moderate             */
/* ------------------------------------------------------------------ */

describe('extractMatchedDirection — held_unexpressed_moderate', () => {
  it('returns the highest-pull direction with held_attributed_unexpressed when multiple directions satisfy', () => {
    const out = makeEngineOutput({
      creator: { pull: 65, pull_state: ['held_attributed_unexpressed'] },
      freedom_designer: { pull: 55, pull_state: ['held_attributed_unexpressed'] },
      experience_seeker: { pull: 80, pull_state: [] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('held_unexpressed_moderate', out, inp)).toBe('creator');
  });

  it('returns the single direction with held_attributed_unexpressed', () => {
    const out = makeEngineOutput({
      growth_focused: { pull: 40, pull_state: ['held_attributed_unexpressed'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('held_unexpressed_moderate', out, inp)).toBe('growth_focused');
  });

  it('returns null when no direction has held_attributed_unexpressed', () => {
    const out = makeEngineOutput({
      creator: { pull: 50, pull_state: [] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('held_unexpressed_moderate', out, inp)).toBeNull();
  });

  it('tiebreak: two directions with identical pull, returns alphabetically-first', () => {
    const out = makeEngineOutput({
      contributor: { pull: 60, pull_state: ['held_attributed_unexpressed'] },
      relationship_rebuilder: { pull: 60, pull_state: ['held_attributed_unexpressed'] },
    });
    const inp = makeInputMap();
    // Alphabetically: contribution comes before relationship
    expect(extractMatchedDirection('held_unexpressed_moderate', out, inp)).toBe('contributor');
  });
});

/* ------------------------------------------------------------------ */
/* M — extractMatchedDirection: depleted_band_with_held               */
/* ------------------------------------------------------------------ */

describe('extractMatchedDirection — depleted_band_with_held', () => {
  it('returns the highest-pull direction with held_attributed_unexpressed AND specificity=strong when multiple satisfy', () => {
    const out = makeEngineOutput({
      creator: { pull: 75, pull_state: ['held_attributed_unexpressed'], specificity: 'strong' },
      freedom_designer: { pull: 65, pull_state: ['held_attributed_unexpressed'], specificity: 'strong' },
      experience_seeker: { pull: 85, pull_state: ['held_attributed_unexpressed'], specificity: 'partial' },
    });
    const inp = makeInputMap();
    // 'experience_seeker' has higher pull but specificity='partial', so it doesn't match.
    // 'creator' has the highest pull among strong-specificity unexpressed directions.
    expect(extractMatchedDirection('depleted_band_with_held', out, inp)).toBe('creator');
  });

  it('returns the single direction with held_attributed_unexpressed AND specificity=strong', () => {
    const out = makeEngineOutput({
      relationship_rebuilder: { pull: 50, pull_state: ['held_attributed_unexpressed'], specificity: 'strong' },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('depleted_band_with_held', out, inp)).toBe('relationship_rebuilder');
  });

  it('returns null when no direction has both held_attributed_unexpressed AND specificity=strong', () => {
    const out = makeEngineOutput({
      creator: { pull: 80, pull_state: ['held_attributed_unexpressed'], specificity: 'partial' },
      freedom_designer: { pull: 70, pull_state: [], specificity: 'strong' },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('depleted_band_with_held', out, inp)).toBeNull();
  });

  it('tiebreak: two directions with identical pull and both conditions, returns alphabetically-first', () => {
    const out = makeEngineOutput({
      growth_focused: { pull: 70, pull_state: ['held_attributed_unexpressed'], specificity: 'strong' },
      creator: { pull: 70, pull_state: ['held_attributed_unexpressed'], specificity: 'strong' },
    });
    const inp = makeInputMap();
    // Alphabetically: creator comes before growth
    expect(extractMatchedDirection('depleted_band_with_held', out, inp)).toBe('creator');
  });

  it('defensive sort: selects highest-pull from alphabetically-ordered array', () => {
    const out = makeEngineOutput({
      experience_seeker: { pull: 55, pull_state: ['held_attributed_unexpressed'], specificity: 'strong' },
      creator: { pull: 85, pull_state: ['held_attributed_unexpressed'], specificity: 'strong' },
      relationship_rebuilder: { pull: 65, pull_state: ['held_attributed_unexpressed'], specificity: 'strong' },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('depleted_band_with_held', out, inp)).toBe('creator');
  });
});

/* ------------------------------------------------------------------ */
/* N — extractMatchedDirection: empty_band_with_phantom               */
/* ------------------------------------------------------------------ */

describe('extractMatchedDirection — empty_band_with_phantom', () => {
  it('returns the highest-pull direction with phantom or phantom_partial when multiple directions satisfy', () => {
    const out = makeEngineOutput({
      creator: { pull: 70, pull_quality: ['phantom'] },
      freedom_designer: { pull: 60, pull_quality: ['phantom_partial'] },
      experience_seeker: { pull: 80, pull_quality: ['real'] },
    });
    const inp = makeInputMap();
    // 'creator' has the highest pull among phantom/phantom_partial directions
    expect(extractMatchedDirection('empty_band_with_phantom', out, inp)).toBe('creator');
  });

  it('returns the single direction with phantom', () => {
    const out = makeEngineOutput({
      contributor: { pull: 55, pull_quality: ['phantom'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('empty_band_with_phantom', out, inp)).toBe('contributor');
  });

  it('returns the single direction with phantom_partial', () => {
    const out = makeEngineOutput({
      growth_focused: { pull: 45, pull_quality: ['phantom_partial'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('empty_band_with_phantom', out, inp)).toBe('growth_focused');
  });

  it('returns null when no direction has phantom or phantom_partial', () => {
    const out = makeEngineOutput({
      creator: { pull: 80, pull_quality: ['real'] },
      freedom_designer: { pull: 70, pull_quality: ['suppressed'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('empty_band_with_phantom', out, inp)).toBeNull();
  });

  it('tiebreak: two directions with identical pull, returns alphabetically-first', () => {
    const out = makeEngineOutput({
      experience_seeker: { pull: 65, pull_quality: ['phantom'] },
      freedom_designer: { pull: 65, pull_quality: ['phantom_partial'] },
    });
    const inp = makeInputMap();
    // Alphabetically: experience comes before freedom
    expect(extractMatchedDirection('empty_band_with_phantom', out, inp)).toBe('experience_seeker');
  });

  it('prefers phantom over phantom_partial when phantom has higher pull', () => {
    const out = makeEngineOutput({
      creator: { pull: 75, pull_quality: ['phantom'] },
      freedom_designer: { pull: 60, pull_quality: ['phantom_partial'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('empty_band_with_phantom', out, inp)).toBe('creator');
  });

  it('prefers phantom_partial over phantom when phantom_partial has higher pull', () => {
    const out = makeEngineOutput({
      creator: { pull: 55, pull_quality: ['phantom'] },
      freedom_designer: { pull: 70, pull_quality: ['phantom_partial'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('empty_band_with_phantom', out, inp)).toBe('freedom_designer');
  });

  it('defensive sort: selects highest-pull from alphabetically-ordered array', () => {
    const out = makeEngineOutput({
      experience_seeker: { pull: 50, pull_quality: ['phantom'] },
      creator: { pull: 90, pull_quality: ['phantom_partial'] },
      relationship_rebuilder: { pull: 70, pull_quality: ['phantom'] },
    });
    const inp = makeInputMap();
    expect(extractMatchedDirection('empty_band_with_phantom', out, inp)).toBe('creator');
  });
});

/* ------------------------------------------------------------------ */
/* O — extractMatchedDirection: unknown sentence IDs                  */
/* ------------------------------------------------------------------ */

describe('extractMatchedDirection — unknown sentence IDs for Phase 6', () => {
  const out = makeEngineOutput({
    creator: { pull: 80, pull_state: ['held_attributed_unexpressed'], specificity: 'strong' },
  });
  const inp = makeInputMap();

  it('unknown_sentence_id → null', () => {
    expect(extractMatchedDirection('unknown_sentence_id', out, inp)).toBeNull();
  });

  it('held_unexpressed_typo → null', () => {
    expect(extractMatchedDirection('held_unexpressed_typo', out, inp)).toBeNull();
  });
});
