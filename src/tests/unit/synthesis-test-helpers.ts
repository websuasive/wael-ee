// Shared test helpers for synthesis unit tests. Constructs fully-shaped baseline EngineOutput and InputMap fixtures. The makeEngineOutput.directions array is NOT re-sorted by the helper; callers are responsible for matching the engine's pull-desc + alphabetical-tiebreak contract.

import type {
  EngineOutput,
  InputMap,
  DirectionOutput,
  DirectionName,
  PerDirectionInputs,
  DomainPresenceOutput,
  DomainName,
  PerDomainInputs,
} from '../../engine';

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

const UNIVERSAL_WANTING_DOMAINS: ReadonlySet<DomainName> = new Set<DomainName>([
  'time_as_yours',
  'energy_as_resource',
  'felt_aliveness',
  'body_physical_aliveness',
]);

/* ------------------------------------------------------------------ */
/* PerDirectionInputs / PerDomainInputs                               */
/* ------------------------------------------------------------------ */

export function makeDirectionInputs(
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

export function makePerDomainInputs(
  overrides: {
    wanting?: 'wants' | 'doesnt_want' | 'omit';
    current_state?: number;
    past_presence?: 'yes' | 'no';
  } = {},
): PerDomainInputs {
  const base: PerDomainInputs = {
    current_state: overrides.current_state ?? 80,
    past_presence: overrides.past_presence ?? 'yes',
  };
  if (overrides.wanting === 'omit') {
    return base;
  }
  return { ...base, wanting: overrides.wanting ?? 'doesnt_want' };
}

/* ------------------------------------------------------------------ */
/* InputMap                                                           */
/* ------------------------------------------------------------------ */

export function makeInputMap(
  overrides: {
    directions?: Partial<Record<DirectionName, Partial<PerDirectionInputs>>>;
    domains?: Partial<Record<DomainName, Partial<PerDomainInputs>>>;
    cross_direction?: Partial<InputMap['cross_direction']>;
    constraints?: Partial<InputMap['constraints']>;
    cross_cutting?: Partial<InputMap['cross_cutting']>;
  } = {},
): InputMap {
  const directionOverrides = overrides.directions ?? {};
  const directions = {
    contributor: makeDirectionInputs(directionOverrides.contributor ?? {}),
    experience_seeker: makeDirectionInputs(directionOverrides.experience_seeker ?? {}),
    freedom_designer: makeDirectionInputs(directionOverrides.freedom_designer ?? {}),
    growth_focused: makeDirectionInputs(directionOverrides.growth_focused ?? {}),
    creator: makeDirectionInputs(directionOverrides.creator ?? {}),
    relationship_rebuilder: makeDirectionInputs(directionOverrides.relationship_rebuilder ?? {}),
  };

  const domainOverrides = overrides.domains ?? {};
  const domains = Object.fromEntries(
    DOMAIN_NAMES.map((name) => {
      const isUniversal = UNIVERSAL_WANTING_DOMAINS.has(name);
      const baseWanting: 'wants' | 'doesnt_want' | 'omit' = isUniversal
        ? 'omit'
        : 'doesnt_want';
      const o = domainOverrides[name] ?? {};
      const wantingValue: 'wants' | 'doesnt_want' | 'omit' =
        'wanting' in o
          ? (o.wanting as 'wants' | 'doesnt_want')
          : baseWanting;
      const built = makePerDomainInputs({
        wanting: wantingValue,
        ...(o.current_state !== undefined ? { current_state: o.current_state } : {}),
        ...(o.past_presence !== undefined ? { past_presence: o.past_presence } : {}),
      });
      return [name, built];
    }),
  ) as InputMap['domains'];

  return {
    directions,
    domains,
    cross_direction: {
      direction_chosen: 'none',
      capacity_strain: 'no',
      life_shape_duration: 'recent',
      // v3 defaults: all week_shape flags true so that every direction's
      // derived expression_space is has_space (preserves pre-v3 test semantics).
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
      psychological_filtering: 'does_not_filter',
      role_consolidation: 'holds_other_selves',
      attention_pattern: 'engaged',
      relational_presence: 'present',
      ...(overrides.cross_direction ?? {}),
    },
    constraints: {
      energy_availability: 80,
      time_availability: 80,
      body_capacity: 80,
      permission: 80,
      permission_sub_shape: 'present',
      ...(overrides.constraints ?? {}),
    },
    cross_cutting: {
      recent_life_shape_change: 'no',
      replacement_structure_exists: 'no',
      recent_reaching: 'no_current_reaching',
      ...(overrides.cross_cutting ?? {}),
    },
    self_report: {
      named_absences: [],
    },
  };
}

/* ------------------------------------------------------------------ */
/* DirectionOutput / DomainPresenceOutput                             */
/* ------------------------------------------------------------------ */

export function makeDirectionOutput(
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

export function makeDomainPresenceOutput(
  overrides: Partial<DomainPresenceOutput> = {},
): DomainPresenceOutput {
  return {
    domain: 'mattering',
    current_state: 0,
    fires: true,
    value: 'never_been_part_of_his_life',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* EngineOutput                                                       */
/* ------------------------------------------------------------------ */

/**
 * Build a fully-shaped EngineOutput.
 *
 * `directions` is NOT re-sorted by this helper. Callers must order entries to
 * match the engine's pull-descending + alphabetical-tiebreak contract; if you
 * want the helper to sort, do so at the call site:
 *   `entries.sort((a, b) => b.pull! - a.pull! || a.direction!.localeCompare(b.direction!))`
 *
 * If fewer than 6 directions are provided, the helper pads with baseline
 * entries for the remaining canonical direction names (in canonical order).
 */
export function makeEngineOutput(
  overrides: {
    directions?: Partial<DirectionOutput>[];
    domains?: Partial<Record<DomainName, Partial<DomainPresenceOutput>>>;
    constraints?: Partial<EngineOutput['constraints']>;
    cross_cutting?: Partial<
      Record<'between_shapes' | 'mid_process', boolean>
    >;
    cross_direction?: Partial<EngineOutput['cross_direction']>;
  } = {},
): EngineOutput {
  // Directions: caller-provided entries first (in caller's order), then pad
  // with baseline entries for any canonical direction names not yet present.
  const provided = (overrides.directions ?? []).map((p) =>
    makeDirectionOutput(p),
  );
  const usedNames = new Set(provided.map((d) => d.direction));
  const padding = DIRECTION_NAMES.filter((n) => !usedNames.has(n)).map((n) =>
    makeDirectionOutput({ direction: n }),
  );
  const directions = [...provided, ...padding].slice(0, 6);

  const domainOverrides = overrides.domains ?? {};
  const domains = DOMAIN_NAMES.map((name) =>
    makeDomainPresenceOutput({
      domain: name,
      ...(domainOverrides[name] ?? {}),
    }),
  );

  const baseConstraints: EngineOutput['constraints'] = {
    sustained_constraint_intensity: 100,
    energy: { value: 0, band: 'heavy_depletion', fires: true },
    time: { value: 0, band: 'heavy_time_pressure', fires: true },
    body_capacity: { value: 0, band: 'limited', fires: true },
    permission: { value: 0, band: 'blocked', sub_shape: 'present', fires: true },
  };
  const constraints: EngineOutput['constraints'] = {
    ...baseConstraints,
    ...(overrides.constraints ?? {}),
  };

  const cc = overrides.cross_cutting ?? {};
  const cross_cutting: EngineOutput['cross_cutting'] = [
    { output: 'between_shapes', fires: cc.between_shapes ?? false },
    { output: 'mid_process', fires: cc.mid_process ?? false },
  ];

  const cross_direction: EngineOutput['cross_direction'] = {
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
    ...(overrides.cross_direction ?? {}),
  };

  return { directions, domains, constraints, cross_cutting, cross_direction };
}
