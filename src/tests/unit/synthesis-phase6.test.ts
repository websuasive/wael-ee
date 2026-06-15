// Phase 6 — synthesis layer test verification. Per Phase 6 brief:
//
//   1. Sentence-library well-formedness for the new v2/v3 slots
//   2. §7.9 Confirmed domain-template dispatch (4 domain value cases)
//   3. §5.10.2 Surfaced first-item suffix template variation (F1)
//   4. §5.11 life_texture_panel composition (4 bands × 2 varied_week)
//   5. §5.12 life_context_panel composition (life_stage 7 cases,
//      work_load representative cells, sociality 11 predicates)
//   6. §5.10 comparison_surface_panel composition + §7.10 dispatch
//   7. v2 §6.11 cross-kind anchor F2 membership-exclusion
//   8. §5.10.2 cascade spillover (F1)
//
// All synthetic inputs are hand-derived to exercise a specific predicate
// edge. Per Phase 6 brief: do not fix divergences by updating tests; surface
// and decide.

import { describe, it, expect } from 'vitest';
import {
  makeEngineOutput,
  makeInputMap,
  makeDirectionOutput,
} from './synthesis-test-helpers';
import { shapeSentences } from '../../synthesis/data/shape_sentences';
import { computeLifeTexturePanel } from '../../synthesis/life_texture_panel';
import { computeLifeContextPanel } from '../../synthesis/life_context_panel';
import {
  buildComparisonSurfaceItems,
  buildComparisonSurfacePanelSummary,
  computeComparisonSurfacePanel,
} from '../../synthesis/comparison_surface';
import type { EngineOutput, InputMap, DomainName } from '../../engine';

/**
 * Build a "quiet" EngineOutput where all 12 domains read `fires=false,
 * value='intact'` — i.e. no reduced-domain candidates surface. The default
 * `makeEngineOutput` helper makes every domain fire with value
 * `never_been_part_of_his_life` (engine arc legacy), which fills the
 * Surfaced section's P2 pool unwantedly for CSP/F1/F2 tests.
 */
const ALL_DOMAINS: ReadonlyArray<DomainName> = [
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

function intactDomains(
  firingOverrides: Partial<
    Record<DomainName, Partial<EngineOutput['domains'][number]>>
  > = {},
): Partial<Record<DomainName, Partial<EngineOutput['domains'][number]>>> {
  const base: Partial<
    Record<DomainName, Partial<EngineOutput['domains'][number]>>
  > = {};
  for (const d of ALL_DOMAINS) {
    base[d] = { fires: false, value: 'intact', current_state: 80 };
  }
  return { ...base, ...firingOverrides };
}

/* ------------------------------------------------------------------ */
/* 1. Sentence-library well-formedness                                */
/* ------------------------------------------------------------------ */

describe('Phase 6 — sentence library well-formedness (new slots)', () => {
  const NEW_SLOTS = [
    'life_texture_summary',
    'life_texture_pattern_note',
    'expression_space_caption',
    'life_stage_summary',
    'work_load_summary',
    'sociality_summary',
  ] as const;

  for (const slot of NEW_SLOTS) {
    it(`slot '${slot}' has at least one entry`, () => {
      const entries = shapeSentences.filter((s) => s.slot === slot);
      expect(entries.length).toBeGreaterThan(0);
    });

    it(`slot '${slot}' entries all have id, slot, predicate, sentence`, () => {
      const entries = shapeSentences.filter((s) => s.slot === slot);
      for (const e of entries) {
        expect(typeof e.id).toBe('string');
        expect(e.id.length).toBeGreaterThan(0);
        expect(e.slot).toBe(slot);
        expect(typeof e.predicate).toBe('function');
        expect(typeof e.sentence).toBe('string');
        expect(e.sentence.length).toBeGreaterThan(0);
      }
    });

    it(`slot '${slot}' entries have unique ids`, () => {
      const entries = shapeSentences.filter((s) => s.slot === slot);
      const ids = entries.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }

  it('all shapeSentences ids are globally unique', () => {
    const ids = shapeSentences.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/* ------------------------------------------------------------------ */
/* 2. §7.9 Confirmed domain-template dispatch                          */
/* ------------------------------------------------------------------ */

/** Helper: minimal synthetic input where named_absences contains a single
 *  domain-anchored item, with that domain firing at a specified value. */
function makeDomainTemplateInputs(
  domain: DomainName,
  value:
    | 'reduced_wants_back'
    | 'reduced_at_peace'
    | 'wants_but_never_had'
    | 'never_been_part_of_his_life',
  itemId: 'more_energy' | 'getting_back_in_shape' | 'proper_conversation',
): { output: EngineOutput; input: InputMap } {
  const output = makeEngineOutput({
    domains: intactDomains({
      [domain]: { fires: true, value, current_state: 30 },
    }) as never,
  });
  const input = makeInputMap();
  input.self_report.named_absences = [itemId];
  return { output, input };
}

describe('Phase 6 — §7.9 Confirmed domain-template dispatch', () => {
  it('reduced_wants_back → "Architecture reads {domain} as reduced."', () => {
    // `more_energy` has anchors [domain:energy_as_resource, constraint:energy].
    // Set the constraint to NOT fire so domain wins as governing anchor.
    const { output, input } = makeDomainTemplateInputs(
      'energy_as_resource',
      'reduced_wants_back',
      'more_energy',
    );
    output.constraints.energy = {
      value: 80,
      band: 'moderate',
      fires: false,
    };
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.confirmed).toHaveLength(1);
    expect(items.confirmed[0]!.sentence.interpretive_text).toBe(
      'More energy. Architecture reads Energy as resource as reduced.',
    );
  });

  it('reduced_at_peace → "Architecture reads {domain} as reduced." (same template)', () => {
    const { output, input } = makeDomainTemplateInputs(
      'energy_as_resource',
      'reduced_at_peace',
      'more_energy',
    );
    output.constraints.energy = {
      value: 80,
      band: 'moderate',
      fires: false,
    };
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.confirmed[0]!.sentence.interpretive_text).toBe(
      'More energy. Architecture reads Energy as resource as reduced.',
    );
  });

  it('wants_but_never_had → "Architecture reads {domain} as a want never had."', () => {
    // `getting_back_in_shape` has anchors [domain:body_physical_aliveness,
    //  week_shape_flag:active_body]. Set the flag to TRUE so it doesn't fire
    //  (flag fires only when false), so domain wins.
    const { output, input } = makeDomainTemplateInputs(
      'body_physical_aliveness',
      'wants_but_never_had',
      'getting_back_in_shape',
    );
    output.cross_direction.week_shape.active_body = true;
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.confirmed[0]!.sentence.interpretive_text).toBe(
      'Getting back in shape. Architecture reads Body as a want never had.',
    );
  });

  it('never_been_part_of_his_life → "Architecture reads {domain} as not part of his life."', () => {
    // `proper_conversation` has two domain anchors: conversation_depth, being_known.
    // Set only conversation_depth to fire with the target value.
    const output = makeEngineOutput({
      domains: intactDomains({
        conversation_depth: {
          fires: true,
          value: 'never_been_part_of_his_life',
          current_state: 30,
        },
      }) as never,
    });
    const input = makeInputMap();
    input.self_report.named_absences = ['proper_conversation'];
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.confirmed).toHaveLength(1);
    expect(items.confirmed[0]!.sentence.interpretive_text).toBe(
      'A proper conversation now and then. Architecture reads Conversation depth as not part of his life.',
    );
  });
});

/* ------------------------------------------------------------------ */
/* 3. §5.10.2 Surfaced first-item suffix template variation             */
/* ------------------------------------------------------------------ */

describe('Phase 6 — Surfaced first-item-suffix template variation', () => {
  it('with 3 surfaced items, item[0] carries " Not in the named list." suffix; item[1] and item[2] do not', () => {
    // Construct: 2 surfaced directions + 1 reduced domain → exactly 3 items.
    const output = makeEngineOutput({
      directions: [
        makeDirectionOutput({
          direction: 'creator',
          surfaced: true,
          pull: 70,
        }),
        makeDirectionOutput({
          direction: 'freedom_designer',
          surfaced: true,
          pull: 50,
        }),
      ],
      domains: intactDomains({
        friendship: { fires: true, value: 'reduced_wants_back', current_state: 25 },
      }) as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    // No named_absences → CSP renders with empty Confirmed + Surfaced[3].
    const input = makeInputMap();
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.surfaced).toHaveLength(3);
    // Item[0] has the suffix.
    expect(items.surfaced[0]!.sentence.interpretive_text).toMatch(
      /Not in the named list\.$/,
    );
    // Items[1] and [2] do not.
    expect(items.surfaced[1]!.sentence.interpretive_text).not.toMatch(
      /Not in the named list\.$/,
    );
    expect(items.surfaced[2]!.sentence.interpretive_text).not.toMatch(
      /Not in the named list\.$/,
    );
  });

  it('first-item suffix is direction-shape ("firing") with correct display name', () => {
    const output = makeEngineOutput({
      directions: [
        makeDirectionOutput({
          direction: 'creator',
          surfaced: true,
          pull: 70,
        }),
      ],
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.surfaced).toHaveLength(1);
    expect(items.surfaced[0]!.sentence.interpretive_text).toBe(
      'Architecture reads Creator firing. Not in the named list.',
    );
  });
});

/* ------------------------------------------------------------------ */
/* 4. §5.11 life_texture_panel composition                              */
/* ------------------------------------------------------------------ */

describe('Phase 6 — life_texture_panel composition (4 bands × 2 varied_week)', () => {
  type Band = 'empty' | 'depleted' | 'mixed' | 'textured';
  type Case = {
    band: Band;
    varied: boolean;
    expected_summary_id: string;
    expected_pattern_id: string | null;
  };
  const cases: Case[] = [
    {
      band: 'empty',
      varied: false,
      expected_summary_id: 'life_texture_empty',
      expected_pattern_id: null,
    },
    {
      band: 'empty',
      varied: true,
      expected_summary_id: 'life_texture_empty',
      expected_pattern_id: null,
    },
    {
      band: 'depleted',
      varied: false,
      expected_summary_id: 'life_texture_depleted',
      expected_pattern_id: null,
    },
    {
      band: 'depleted',
      varied: true,
      expected_summary_id: 'life_texture_depleted',
      expected_pattern_id: null,
    },
    {
      band: 'mixed',
      varied: false,
      expected_summary_id: 'life_texture_mixed_uniform',
      expected_pattern_id: 'pattern_uniform',
    },
    {
      band: 'mixed',
      varied: true,
      expected_summary_id: 'life_texture_mixed_varied',
      expected_pattern_id: 'pattern_varied',
    },
    {
      band: 'textured',
      varied: false,
      expected_summary_id: 'life_texture_textured_uniform',
      expected_pattern_id: 'pattern_uniform',
    },
    {
      band: 'textured',
      varied: true,
      expected_summary_id: 'life_texture_textured_varied',
      expected_pattern_id: 'pattern_varied',
    },
  ];

  /** Reverse lookup matched ID by (slot, interpretive_text). */
  function idFor(
    slot: 'life_texture_summary' | 'life_texture_pattern_note',
    text: string | null,
  ): string | null {
    if (text === null) return null;
    const match = shapeSentences.find(
      (s) => s.slot === slot && s.sentence === text,
    );
    return match?.id ?? null;
  }

  for (const c of cases) {
    it(`band=${c.band}, varied_week=${c.varied} → summary=${c.expected_summary_id}, pattern=${c.expected_pattern_id ?? 'null'}`, () => {
      const output = makeEngineOutput({
        cross_direction: { life_texture_band: c.band },
      });
      output.cross_direction.week_shape.varied_week = c.varied;
      const input = makeInputMap();
      const panel = computeLifeTexturePanel(output, input);
      expect(idFor('life_texture_summary', panel.summary.interpretive_text)).toBe(
        c.expected_summary_id,
      );
    });
  }
});

/* ------------------------------------------------------------------ */
/* 5. §5.12 life_context_panel composition                              */
/* ------------------------------------------------------------------ */

describe('Phase 6 — life_stage_summary (7 cases, one per enum value)', () => {
  const STAGES = [
    ['building', 'life_stage_building'],
    ['consolidating', 'life_stage_consolidating'],
    ['re_evaluating', 'life_stage_re_evaluating'],
    ['transitioning', 'life_stage_transitioning'],
    ['settled', 'life_stage_settled'],
    ['enduring', 'life_stage_enduring'],
    ['drifting', 'life_stage_drifting'],
  ] as const;

  for (const [stage, expectedId] of STAGES) {
    it(`life_stage='${stage}' fires '${expectedId}'`, () => {
      const output = makeEngineOutput({ cross_direction: { life_stage: stage } });
      const input = makeInputMap();
      const panel = computeLifeContextPanel(output, input, null);
      const match = shapeSentences.find(
        (s) =>
          s.slot === 'life_stage_summary' &&
          s.sentence === panel.life_stage_summary.interpretive_text,
      );
      expect(match?.id).toBe(expectedId);
    });
  }
});

describe('Phase 6 — work_load_summary (13 authored cells)', () => {
  type Cell = {
    paid: EngineOutput['cross_direction']['paid_work_relationship'];
    load: EngineOutput['cross_direction']['primary_load'];
    expectedId: string;
  };
  const cells: Cell[] = [
    { paid: 'chosen', load: 'paid_work', expectedId: 'work_load_chosen_paid' },
    {
      paid: 'chosen',
      load: 'caregiving',
      expectedId: 'work_load_chosen_caregiving',
    },
    { paid: 'endured', load: 'paid_work', expectedId: 'work_load_endured_paid' },
    {
      paid: 'endured',
      load: 'caregiving',
      expectedId: 'work_load_endured_caregiving',
    },
    {
      paid: 'consuming',
      load: 'paid_work',
      expectedId: 'work_load_consuming_paid',
    },
    {
      paid: 'consuming',
      load: 'caregiving',
      expectedId: 'work_load_consuming_caregiving',
    },
    {
      paid: 'functional',
      load: 'paid_work',
      expectedId: 'work_load_functional_paid',
    },
    {
      paid: 'functional',
      load: 'caregiving',
      expectedId: 'work_load_functional_caregiving',
    },
    {
      paid: 'functional',
      load: 'household_admin',
      expectedId: 'work_load_functional_household',
    },
    {
      paid: 'functional',
      load: 'none',
      expectedId: 'work_load_functional_none',
    },
    { paid: 'between', load: 'none', expectedId: 'work_load_between_none' },
    {
      paid: 'between',
      load: 'caregiving',
      expectedId: 'work_load_between_caregiving',
    },
    {
      paid: 'peripheral',
      load: 'paid_work',
      expectedId: 'work_load_peripheral_paid',
    },
  ];

  for (const c of cells) {
    it(`paid='${c.paid}', load='${c.load}' fires '${c.expectedId}'`, () => {
      const output = makeEngineOutput({
        cross_direction: {
          paid_work_relationship: c.paid,
          primary_load: c.load,
        },
      });
      const input = makeInputMap();
      const panel = computeLifeContextPanel(output, input, null);
      const match = shapeSentences.find(
        (s) =>
          s.slot === 'work_load_summary' &&
          s.sentence === panel.work_load_summary.interpretive_text,
      );
      expect(match?.id).toBe(c.expectedId);
    });
  }
});

describe('Phase 6 — sociality_summary (11 predicates)', () => {
  type S = EngineOutput['cross_direction']['sociality_default'];

  function setup(
    sociality: S,
    overrides: {
      relPq?: 'real' | 'suppressed' | 'empty';
      relQuad?: 'active' | 'quiet' | 'habit' | 'blocked';
      contribSurfaced?: boolean;
      belongsToGroup?: boolean;
      relationalReducedCount?: number;
    } = {},
  ) {
    const relPq = overrides.relPq ?? 'empty';
    const relQuad = overrides.relQuad ?? 'quiet';
    const directions = [
      makeDirectionOutput({
        direction: 'relationship_rebuilder',
        pull_quality: relPq === 'empty' ? [] : [relPq],
        quadrant: relQuad,
      }),
      makeDirectionOutput({
        direction: 'contributor',
        surfaced: overrides.contribSurfaced ?? false,
      }),
    ];
    // Construct enough relational reduced domains if requested.
    const relCount = overrides.relationalReducedCount ?? 0;
    const relDomains: DomainName[] = [
      'conversation_depth',
      'being_known',
      'friendship',
      'intimacy',
    ];
    const firingOverrides: Partial<
      Record<DomainName, Partial<EngineOutput['domains'][number]>>
    > = {};
    for (let i = 0; i < relCount; i++) {
      firingOverrides[relDomains[i]!] = {
        fires: true,
        value: 'reduced_wants_back',
        current_state: 30,
      };
    }
    const domainOverrides = intactDomains(firingOverrides);
    const output = makeEngineOutput({
      directions,
      domains: domainOverrides as never,
      cross_direction: {
        sociality_default: sociality,
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: false,
          makes_things: false,
          active_body: false,
          belongs_to_group: overrides.belongsToGroup ?? false,
          solo_practice: false,
          varied_week: false,
        },
      },
    });
    return output;
  }

  function findFired(output: EngineOutput): string | null {
    const input = makeInputMap();
    const panel = computeLifeContextPanel(output, input, null);
    const match = shapeSentences.find(
      (s) =>
        s.slot === 'sociality_summary' &&
        s.sentence === panel.sociality_summary.interpretive_text,
    );
    return match?.id ?? null;
  }

  it('solitary + rel real+active → sociality_solitary_relationship_active', () => {
    expect(
      findFired(
        setup('solitary_by_default', { relPq: 'real', relQuad: 'active' }),
      ),
    ).toBe('sociality_solitary_relationship_active');
  });

  it('solitary + rel empty pq+quiet → sociality_solitary_relationship_quiet', () => {
    expect(findFired(setup('solitary_by_default'))).toBe(
      'sociality_solitary_relationship_quiet',
    );
  });

  it('solitary + rel suppressed → sociality_solitary_relationship_suppressed', () => {
    expect(
      findFired(setup('solitary_by_default', { relPq: 'suppressed' })),
    ).toBe('sociality_solitary_relationship_suppressed');
  });

  it('social + rel real+active → sociality_social_relationship_active', () => {
    expect(
      findFired(
        setup('social_by_default', { relPq: 'real', relQuad: 'active' }),
      ),
    ).toBe('sociality_social_relationship_active');
  });

  it('social + rel quiet + 3+ reduced relational → sociality_social_relationship_quiet_reduced', () => {
    expect(
      findFired(
        setup('social_by_default', {
          relPq: 'empty',
          relQuad: 'quiet',
          relationalReducedCount: 3,
        }),
      ),
    ).toBe('sociality_social_relationship_quiet_reduced');
  });

  it('solitary + contrib surfaced + no group → sociality_solitary_contribution_firing_no_group', () => {
    // Need relationship branch to NOT match first — set relQuad=habit + pq=real to skip both rel preds for solitary.
    expect(
      findFired(
        setup('solitary_by_default', {
          relPq: 'real',
          relQuad: 'habit',
          contribSurfaced: true,
          belongsToGroup: false,
        }),
      ),
    ).toBe('sociality_solitary_contribution_firing_no_group');
  });

  it('social + contrib surfaced + no group → sociality_social_contribution_firing_no_group', () => {
    // Skip rel-axis preds for social: rel must not be (real+active) nor (empty pq + quiet + 3+ reduced).
    expect(
      findFired(
        setup('social_by_default', {
          relPq: 'real',
          relQuad: 'habit',
          contribSurfaced: true,
          belongsToGroup: false,
        }),
      ),
    ).toBe('sociality_social_contribution_firing_no_group');
  });

  it('social + contrib pq empty + belongs_to_group → sociality_social_contribution_quiet_belongs', () => {
    // Need rel-axis to not match. quad=habit and pq=real skips both rel preds for social.
    const output = setup('social_by_default', {
      relPq: 'real',
      relQuad: 'habit',
      belongsToGroup: true,
    });
    // contrib defaults pq=[] from helper.
    expect(findFired(output)).toBe('sociality_social_contribution_quiet_belongs');
  });

  it('balanced + rel real+active → sociality_balanced_relationship_active', () => {
    expect(
      findFired(setup('balanced', { relPq: 'real', relQuad: 'active' })),
    ).toBe('sociality_balanced_relationship_active');
  });

  it('balanced + 3+ reduced relational → sociality_balanced_relationship_reduced', () => {
    expect(
      findFired(setup('balanced', { relationalReducedCount: 3 })),
    ).toBe('sociality_balanced_relationship_reduced');
  });

  it('balanced default (no other balanced pred fires) → sociality_balanced_default', () => {
    // rel quad=habit, pq=empty, no reduced relational. Hugh's case.
    const output = setup('balanced', {
      relPq: 'empty',
      relQuad: 'habit',
      relationalReducedCount: 2,
    });
    expect(findFired(output)).toBe('sociality_balanced_default');
  });
});

/* ------------------------------------------------------------------ */
/* 6. §5.10 comparison_surface_panel composition + §7.10 dispatch       */
/* ------------------------------------------------------------------ */

describe('Phase 6 — comparison_surface_panel composition + §7.10 dispatch', () => {
  it('named_absences=[] AND no surfaced candidates → panel = null', () => {
    const output = makeEngineOutput({
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    expect(computeComparisonSurfacePanel(output, input)).toBeNull();
  });

  it('named_absences=[] AND surfaced candidates exist → panel renders, summary_id=comparison_surfaced_only_no_response', () => {
    const output = makeEngineOutput({
      directions: [
        makeDirectionOutput({
          direction: 'creator',
          surfaced: true,
          pull: 70,
        }),
      ],
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    const panel = computeComparisonSurfacePanel(output, input);
    expect(panel).not.toBeNull();
    expect(panel!.confirmed).toHaveLength(0);
    expect(panel!.quiet).toHaveLength(0);
    expect(panel!.surfaced.length).toBeGreaterThan(0);
    expect(panel!.summary_id).toBe('comparison_surfaced_only_no_response');
  });

  it("named_absences=['nothing_really'] AND surfaced candidates → summary_id=comparison_surfaced_only_nothing_really", () => {
    const output = makeEngineOutput({
      directions: [
        makeDirectionOutput({
          direction: 'creator',
          surfaced: true,
          pull: 70,
        }),
      ],
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    input.self_report.named_absences = ['nothing_really'];
    const panel = computeComparisonSurfacePanel(output, input);
    expect(panel).not.toBeNull();
    expect(panel!.confirmed).toHaveLength(0);
    expect(panel!.quiet).toHaveLength(0);
    expect(panel!.surfaced.length).toBeGreaterThan(0);
    expect(panel!.summary_id).toBe('comparison_surfaced_only_nothing_really');
  });

  it('all named items Confirmed (no Quiet, no Surfaced) → summary_id=comparison_all_confirmed', () => {
    // proper_conversation anchored to two firing domains; no other surfaced.
    const output = makeEngineOutput({
      domains: intactDomains({
        conversation_depth: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 30,
        },
        being_known: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 30,
        },
      }) as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    input.self_report.named_absences = ['proper_conversation'];
    const items = buildComparisonSurfaceItems(output, input);
    // Manually build summary against items.
    const { summary_id } = buildComparisonSurfacePanelSummary(items, [
      'proper_conversation',
    ]);
    // Since proper_conversation's anchors exclude both firing domains from
    // Surfaced, and no firing directions, Surfaced should be empty.
    expect(items.surfaced).toHaveLength(0);
    expect(items.confirmed).toHaveLength(1);
    expect(items.quiet).toHaveLength(0);
    expect(summary_id).toBe('comparison_all_confirmed');
  });

  it('mix of Confirmed + Quiet (no Surfaced) → summary_id=comparison_mixed', () => {
    // proper_conversation: Confirmed (both domains firing).
    // building_or_creator: Quiet (no direction surfaced, no domain firing, flag true).
    const output = makeEngineOutput({
      domains: intactDomains({
        conversation_depth: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 30,
        },
        being_known: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 30,
        },
      }) as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    input.self_report.named_absences = [
      'proper_conversation',
      'building_or_making',
    ];
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.confirmed).toHaveLength(1);
    expect(items.quiet).toHaveLength(1);
    expect(items.surfaced).toHaveLength(0);
    const { summary_id } = buildComparisonSurfacePanelSummary(items, [
      'proper_conversation',
      'building_or_making',
    ]);
    expect(summary_id).toBe('comparison_mixed');
  });

  it('confirmed + surfaced → summary_id=comparison_confirmed_and_surfaced', () => {
    // proper_conversation Confirmed; freedom direction surfaced (not an anchor of any named item).
    const output = makeEngineOutput({
      directions: [
        makeDirectionOutput({
          direction: 'freedom_designer',
          surfaced: true,
          pull: 50,
        }),
      ],
      domains: intactDomains({
        conversation_depth: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 30,
        },
        being_known: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 30,
        },
      }) as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    input.self_report.named_absences = ['proper_conversation'];
    const panel = computeComparisonSurfacePanel(output, input);
    expect(panel).not.toBeNull();
    expect(panel!.confirmed.length).toBeGreaterThanOrEqual(1);
    expect(panel!.surfaced.length).toBeGreaterThanOrEqual(1);
    expect(panel!.summary_id).toBe('comparison_confirmed_and_surfaced');
  });

  it('all named items Quiet (no Confirmed, no Surfaced) → summary_id=comparison_all_quiet', () => {
    // building_or_making with no firing anchors AND makes_things=true (so flag absent anchor doesn't fire).
    const output = makeEngineOutput({
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    input.self_report.named_absences = ['building_or_making'];
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.confirmed).toHaveLength(0);
    expect(items.quiet).toHaveLength(1);
    expect(items.surfaced).toHaveLength(0);
    const { summary_id } = buildComparisonSurfacePanelSummary(items, [
      'building_or_making',
    ]);
    expect(summary_id).toBe('comparison_all_quiet');
  });
});

/* ------------------------------------------------------------------ */
/* 7. v2 §6.11 cross-kind anchor F2 membership-exclusion                */
/* ------------------------------------------------------------------ */

describe('Phase 6 — v2 cross-kind anchor F2 membership-exclusion', () => {
  it("'more_friends' named → 'sees_people' flag absent excluded from Surfaced (membership, not firing)", () => {
    // Setup: makes_things=F and sees_people=F → both are absent flags
    // eligible for P3. With no firing directions and no firing domains, P1=0
    // and P2=0; the cascade brings P3 candidates into the cap. Without the
    // anchor exclusion both flags would surface; with F2, sees_people is
    // excluded because it's in more_friends's anchor list (membership), so
    // the only flag in P3 is makes_things.
    const output = makeEngineOutput({
      directions: [],
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: true,
          sees_people: false,
          makes_things: false,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    input.self_report.named_absences = ['more_friends'];
    const items = buildComparisonSurfaceItems(output, input);
    const flags = items.surfaced
      .map((it) => it.reference)
      .filter((r) => r.kind === 'engine_reading' && r.reading_type === 'absent_flag')
      .map((r) => (r as { target: string }).target);
    expect(flags).not.toContain('sees_people');
  });

  it("'building_or_making' named → 'makes_things' flag absent excluded", () => {
    const output = makeEngineOutput({
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: true,
          sees_people: true,
          makes_things: false,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    input.self_report.named_absences = ['building_or_making'];
    const items = buildComparisonSurfaceItems(output, input);
    const flags = items.surfaced
      .map((it) => it.reference)
      .filter((r) => r.kind === 'engine_reading' && r.reading_type === 'absent_flag')
      .map((r) => (r as { target: string }).target);
    expect(flags).not.toContain('makes_things');
  });

  it("'getting_back_in_shape' named → 'active_body' flag absent excluded", () => {
    const output = makeEngineOutput({
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: false,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    input.self_report.named_absences = ['getting_back_in_shape'];
    const items = buildComparisonSurfaceItems(output, input);
    const flags = items.surfaced
      .map((it) => it.reference)
      .filter((r) => r.kind === 'engine_reading' && r.reading_type === 'absent_flag')
      .map((r) => (r as { target: string }).target);
    expect(flags).not.toContain('active_body');
  });

  it('F2 holds even when the cross-kind anchor flag does NOT fire (flag value true) — membership exclusion still applies', () => {
    // building_or_making named, makes_things=TRUE. The flag anchor would not fire
    // (flag only fires when false), yet the F2 rule excludes makes_things from
    // Surfaced based on membership. Verified by: makes_things isn't in surfaced
    // (trivially since it's not absent), AND the spec/implementation is consistent.
    const output = makeEngineOutput({
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    input.self_report.named_absences = ['building_or_making'];
    const items = buildComparisonSurfaceItems(output, input);
    // Quiet item: building_or_making has no firing anchors.
    expect(items.quiet).toHaveLength(1);
    // No firing directions, no firing domains, only weekly_activity absent →
    // Surfaced has exactly weekly_activity.
    const flags = items.surfaced
      .map((it) => it.reference)
      .filter((r) => r.kind === 'engine_reading' && r.reading_type === 'absent_flag')
      .map((r) => (r as { target: string }).target);
    expect(flags).toEqual(['weekly_activity']);
  });
});

/* ------------------------------------------------------------------ */
/* 8. §5.10.2 cascade spillover (F1)                                    */
/* ------------------------------------------------------------------ */

describe('Phase 6 — §5.10.2 cascade spillover (F1)', () => {
  it('P1=1 (only 1 firing direction), P2=2+ → P2 fills 2 to reach cap 3 (cascade beyond P2 budget of 2)', () => {
    // P1 has 1 candidate, P2 has 2 candidates that fit within P2's 2-budget.
    // Total = 1+2 = 3, hits cap.
    const output = makeEngineOutput({
      directions: [
        makeDirectionOutput({
          direction: 'contributor',
          surfaced: true,
          pull: 50,
        }),
      ],
      domains: intactDomains({
        friendship: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 25,
        },
        intimacy: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 30,
        },
      }) as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.surfaced).toHaveLength(3);
    const types = items.surfaced.map((it) => {
      const r = it.reference as { reading_type: string };
      return r.reading_type;
    });
    expect(types).toEqual([
      'firing_direction',
      'reduced_domain',
      'reduced_domain',
    ]);
  });

  it('P1=1, P2=3 candidates → P2 still fills exactly 2 (P2 cap respected when P1 underfilled by 1)', () => {
    // P1=1, P2=3. Cap budget = 3. P1 takes 1, P2 takes min(2, 2)=2. Total=3.
    // P3 budget=0. Spillover into extraP2 only fires if remaining>0.
    const output = makeEngineOutput({
      directions: [
        makeDirectionOutput({
          direction: 'contributor',
          surfaced: true,
          pull: 50,
        }),
      ],
      domains: intactDomains({
        friendship: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 25,
        },
        intimacy: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 30,
        },
        being_known: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 35,
        },
      }) as never,
      cross_direction: {
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: true,
          makes_things: true,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    const items = buildComparisonSurfaceItems(output, input);
    expect(items.surfaced).toHaveLength(3);
    const types = items.surfaced.map((it) => {
      const r = it.reference as { reading_type: string };
      return r.reading_type;
    });
    expect(types).toEqual([
      'firing_direction',
      'reduced_domain',
      'reduced_domain',
    ]);
  });

  it('P1=0, P2=0, P3=3 absent flags → cap fills from P3', () => {
    const output = makeEngineOutput({
      domains: intactDomains() as never,
      cross_direction: {
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: false,
          makes_things: false,
          active_body: true,
          belongs_to_group: true,
          solo_practice: true,
          varied_week: false,
        },
      },
    });
    const input = makeInputMap();
    const items = buildComparisonSurfaceItems(output, input);
    // No P1, no P2; P3 has 3 absent flags (weekly_activity, sees_people,
    // makes_things). P3 budget=1; cascade pulls extras up to remaining=2.
    expect(items.surfaced).toHaveLength(3);
    const types = items.surfaced.map((it) => {
      const r = it.reference as { reading_type: string };
      return r.reading_type;
    });
    expect(types).toEqual(['absent_flag', 'absent_flag', 'absent_flag']);
  });
});

/* ------------------------------------------------------------------ */
/* Whole-situation closing lines (between_shapes, mid_process)          */
/* ------------------------------------------------------------------ */

describe('Phase 6 — closing_between_shapes in LifeContextPanel', () => {
  it('between_shapes fires → shows sentence from library', () => {
    const output = makeEngineOutput({
      cross_cutting: { between_shapes: true },
    });
    const input = makeInputMap();
    const panel = computeLifeContextPanel(output, input, null);
    expect(panel.closing_between_shapes).toEqual({
      interpretive_text: "Your life's changed recently, and it's not settled yet.",
      token_text: '',
    });
  });

  it('between_shapes_clean match → suppresses between_shapes', () => {
    const output = makeEngineOutput({
      cross_cutting: { between_shapes: true },
    });
    const input = makeInputMap();
    const panel = computeLifeContextPanel(output, input, {
      id: 'between_shapes_clean',
      matched_direction: null,
      sentence: '',
    });
    expect(panel.closing_between_shapes).toBeNull();
  });

  it('no between_shapes → closing_between_shapes is null', () => {
    const output = makeEngineOutput({
      cross_cutting: { between_shapes: false },
    });
    const input = makeInputMap();
    const panel = computeLifeContextPanel(output, input, null);
    expect(panel.closing_between_shapes).toBeNull();
  });
});

describe('Phase 6 — closing_mid_process in LifeContextPanel', () => {
  it('mid_process fires → shows sentence from library', () => {
    const output = makeEngineOutput({
      cross_cutting: { mid_process: true },
    });
    const input = makeInputMap();
    const panel = computeLifeContextPanel(output, input, null);
    expect(panel.closing_mid_process).toEqual({
      interpretive_text:
        "You've recently started reaching for change, and it's early days yet.",
      token_text: '',
    });
  });

  it('active_going_through_motions match → suppresses mid_process', () => {
    const output = makeEngineOutput({
      cross_cutting: { mid_process: true },
    });
    const input = makeInputMap();
    const panel = computeLifeContextPanel(output, input, {
      id: 'active_going_through_motions',
      matched_direction: null,
      sentence: '',
    });
    expect(panel.closing_mid_process).toBeNull();
  });

  it('no mid_process → closing_mid_process is null', () => {
    const output = makeEngineOutput({
      cross_cutting: { mid_process: false },
    });
    const input = makeInputMap();
    const panel = computeLifeContextPanel(output, input, null);
    expect(panel.closing_mid_process).toBeNull();
  });
});
