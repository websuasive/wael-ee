// Fixture loader: parser, schema validator, and template generator. Platform-agnostic (no fs, no path).

import type {
  Fixture,
  FixtureLoadError,
  FixtureLoadResult,
  ExpectedAssertions,
} from './types';
import type { InputMap } from '../engine/types';
import { validateInputMap } from '../engine/validation';

const ALLOWED_TOP_LEVEL: ReadonlySet<string> = new Set([
  'directions',
  'domains',
  'constraints',
  'cross_cutting',
  'cross_direction',
]);

const CROSS_DIRECTION_FIELDS: ReadonlySet<string> = new Set([
  'life_stage',
  'sociality_default',
  'paid_work_relationship',
  'primary_load',
  'week_shape',
  'life_texture_band',
  'structural_narrowing_band',
  'experiential_narrowing_band',
  'psychological_narrowing_band',
  'identity_narrowing_band',
  'energetic_narrowing_band',
  'relational_narrowing_band',
  'attention_narrowing_band',
]);

const DIRECTION_NAMES: ReadonlySet<string> = new Set([
  'contributor',
  'creator',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'relationship_rebuilder',
]);

const DIRECTION_FIELDS: ReadonlySet<string> = new Set([
  'direction',
  'surfaced',
  'pull',
  'movement',
  'quadrant',
  'past_relationship',
  'was_once_renders',
  'specificity',
  'pull_quality',
  'pull_state',
  'expression_space',
]);

const DOMAIN_NAMES: ReadonlySet<string> = new Set([
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
]);

const DOMAIN_FIELDS: ReadonlySet<string> = new Set([
  'domain',
  'current_state',
  'fires',
  'value',
]);

const CONSTRAINTS_KEYS: ReadonlySet<string> = new Set([
  'sustained_constraint_intensity',
  'energy',
  'time',
  'body_capacity',
  'permission',
]);

const CONSTRAINT_BAND_FIELDS: ReadonlySet<string> = new Set([
  'value',
  'band',
  'fires',
]);

const PERMISSION_FIELDS: ReadonlySet<string> = new Set([
  'value',
  'band',
  'fires',
  'sub_shape',
]);

const CROSS_CUTTING_NAMES: ReadonlySet<string> = new Set([
  'between_shapes',
  'mid_process',
]);

const CROSS_CUTTING_FIELDS: ReadonlySet<string> = new Set(['output', 'fires']);

const MATCHER_KEYS = ['between', 'contains', 'equals'] as const;

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function schemaError(path: string, message: string): FixtureLoadError {
  return {
    source: 'expected.json',
    code: 'invalid_expected_schema',
    path,
    message,
  };
}

function ownKeys(o: Record<string, unknown>): string[] {
  return Object.keys(o);
}

function joinPath(base: string, segment: string): string {
  return base === '' ? segment : `${base}.${segment}`;
}

function validateMatcherOrBare(
  value: unknown,
  path: string,
  errors: FixtureLoadError[],
): void {
  if (!isPlainObject(value)) {
    // Primitives, arrays, null all accepted as bare values.
    return;
  }
  const keys = ownKeys(value);
  const matcherKeysPresent = MATCHER_KEYS.filter((k) =>
    Object.prototype.hasOwnProperty.call(value, k),
  );
  if (matcherKeysPresent.length === 0) {
    // Plain object without a matcher key: treat as bare value, no further validation.
    return;
  }
  if (matcherKeysPresent.length > 1) {
    errors.push(
      schemaError(
        path,
        `Matcher object has multiple matcher keys (${matcherKeysPresent.join(', ')}); expected exactly one of between, contains, equals.`,
      ),
    );
    return;
  }
  const matcherKey = matcherKeysPresent[0]!;
  const extraKeys = keys.filter((k) => k !== matcherKey);
  if (extraKeys.length > 0) {
    errors.push(
      schemaError(
        path,
        `Matcher object has unexpected extra keys: ${extraKeys.join(', ')}.`,
      ),
    );
    return;
  }
  const inner = value[matcherKey];
  const innerPath = joinPath(path, matcherKey);
  if (matcherKey === 'between') {
    if (!Array.isArray(inner)) {
      errors.push(
        schemaError(innerPath, '"between" must be an array of two finite numbers.'),
      );
      return;
    }
    if (inner.length !== 2) {
      errors.push(
        schemaError(
          innerPath,
          `"between" must have exactly two elements; got ${inner.length}.`,
        ),
      );
      return;
    }
    const [min, max] = inner;
    if (typeof min !== 'number' || typeof max !== 'number') {
      errors.push(schemaError(innerPath, '"between" elements must be numbers.'));
      return;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      errors.push(schemaError(innerPath, '"between" elements must be finite numbers.'));
      return;
    }
    if (min > max) {
      errors.push(
        schemaError(innerPath, `"between" min (${min}) must be <= max (${max}).`),
      );
    }
    return;
  }
  if (matcherKey === 'contains') {
    if (!Array.isArray(inner)) {
      errors.push(schemaError(innerPath, '"contains" must be an array.'));
    }
    return;
  }
  // equals
  if (!Array.isArray(inner)) {
    errors.push(schemaError(innerPath, '"equals" must be an array.'));
  }
}

function validateLeafObject(
  value: unknown,
  allowedFields: ReadonlySet<string>,
  path: string,
  containerLabel: string,
  errors: FixtureLoadError[],
): void {
  if (!isPlainObject(value)) {
    errors.push(
      schemaError(path, `${containerLabel} value must be a plain object.`),
    );
    return;
  }
  for (const key of ownKeys(value)) {
    const childPath = joinPath(path, key);
    if (!allowedFields.has(key)) {
      errors.push(
        schemaError(
          childPath,
          `Unknown field '${key}' in ${containerLabel}. Allowed: ${[...allowedFields].join(', ')}.`,
        ),
      );
      continue;
    }
    validateMatcherOrBare(value[key], childPath, errors);
  }
}

function validateDirections(
  value: unknown,
  errors: FixtureLoadError[],
): void {
  const path = 'directions';
  if (!isPlainObject(value)) {
    errors.push(schemaError(path, 'directions must be a plain object.'));
    return;
  }
  for (const key of ownKeys(value)) {
    const childPath = joinPath(path, key);
    if (!DIRECTION_NAMES.has(key)) {
      errors.push(
        schemaError(
          childPath,
          `Unknown direction '${key}'. Allowed: ${[...DIRECTION_NAMES].join(', ')}.`,
        ),
      );
      continue;
    }
    validateLeafObject(
      value[key],
      DIRECTION_FIELDS,
      childPath,
      `direction '${key}'`,
      errors,
    );
  }
}

function validateDomains(value: unknown, errors: FixtureLoadError[]): void {
  const path = 'domains';
  if (!isPlainObject(value)) {
    errors.push(schemaError(path, 'domains must be a plain object.'));
    return;
  }
  for (const key of ownKeys(value)) {
    const childPath = joinPath(path, key);
    if (!DOMAIN_NAMES.has(key)) {
      errors.push(
        schemaError(
          childPath,
          `Unknown domain '${key}'. Allowed: ${[...DOMAIN_NAMES].join(', ')}.`,
        ),
      );
      continue;
    }
    validateLeafObject(
      value[key],
      DOMAIN_FIELDS,
      childPath,
      `domain '${key}'`,
      errors,
    );
  }
}

function validateConstraints(
  value: unknown,
  errors: FixtureLoadError[],
): void {
  const path = 'constraints';
  if (!isPlainObject(value)) {
    errors.push(schemaError(path, 'constraints must be a plain object.'));
    return;
  }
  for (const key of ownKeys(value)) {
    const childPath = joinPath(path, key);
    if (!CONSTRAINTS_KEYS.has(key)) {
      errors.push(
        schemaError(
          childPath,
          `Unknown constraints key '${key}'. Allowed: ${[...CONSTRAINTS_KEYS].join(', ')}.`,
        ),
      );
      continue;
    }
    if (key === 'sustained_constraint_intensity') {
      validateMatcherOrBare(value[key], childPath, errors);
      continue;
    }
    if (key === 'permission') {
      validateLeafObject(
        value[key],
        PERMISSION_FIELDS,
        childPath,
        `constraints.permission`,
        errors,
      );
      continue;
    }
    // energy, time, body_capacity
    validateLeafObject(
      value[key],
      CONSTRAINT_BAND_FIELDS,
      childPath,
      `constraints.${key}`,
      errors,
    );
  }
}

function validateCrossDirection(
  value: unknown,
  errors: FixtureLoadError[],
): void {
  const path = 'cross_direction';
  if (!isPlainObject(value)) {
    errors.push(schemaError(path, 'cross_direction must be a plain object.'));
    return;
  }
  for (const key of ownKeys(value)) {
    const childPath = joinPath(path, key);
    if (!CROSS_DIRECTION_FIELDS.has(key)) {
      errors.push(
        schemaError(
          childPath,
          `Unknown cross_direction field '${key}'. Allowed: ${[...CROSS_DIRECTION_FIELDS].join(', ')}.`,
        ),
      );
      continue;
    }
    validateMatcherOrBare(value[key], childPath, errors);
  }
}

function validateCrossCutting(
  value: unknown,
  errors: FixtureLoadError[],
): void {
  const path = 'cross_cutting';
  if (!isPlainObject(value)) {
    errors.push(schemaError(path, 'cross_cutting must be a plain object.'));
    return;
  }
  for (const key of ownKeys(value)) {
    const childPath = joinPath(path, key);
    if (!CROSS_CUTTING_NAMES.has(key)) {
      errors.push(
        schemaError(
          childPath,
          `Unknown cross-cutting name '${key}'. Allowed: ${[...CROSS_CUTTING_NAMES].join(', ')}.`,
        ),
      );
      continue;
    }
    validateLeafObject(
      value[key],
      CROSS_CUTTING_FIELDS,
      childPath,
      `cross_cutting.${key}`,
      errors,
    );
  }
}

export function validateExpectedSchema(
  value: unknown,
):
  | { ok: true; value: ExpectedAssertions }
  | { ok: false; errors: FixtureLoadError[] } {
  const errors: FixtureLoadError[] = [];
  if (!isPlainObject(value)) {
    errors.push(
      schemaError('', 'expected.json top-level value must be a plain object.'),
    );
    return { ok: false, errors };
  }
  for (const key of ownKeys(value)) {
    if (!ALLOWED_TOP_LEVEL.has(key)) {
      errors.push(
        schemaError(
          key,
          `Unknown top-level key '${key}'. Allowed: ${[...ALLOWED_TOP_LEVEL].join(', ')}.`,
        ),
      );
    }
  }
  if ('directions' in value) validateDirections(value.directions, errors);
  if ('domains' in value) validateDomains(value.domains, errors);
  if ('constraints' in value) validateConstraints(value.constraints, errors);
  if ('cross_cutting' in value) validateCrossCutting(value.cross_cutting, errors);
  if ('cross_direction' in value)
    validateCrossDirection(value.cross_direction, errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: value as ExpectedAssertions };
}

export function parseFixture(args: {
  id: string;
  inputJsonText: string;
  expectedJsonText: string;
  storyMdText: string;
}): FixtureLoadResult {
  // Step 1: parse input.json
  let inputParsed: unknown;
  try {
    inputParsed = JSON.parse(args.inputJsonText);
  } catch (e) {
    return {
      ok: false,
      errors: [
        {
          source: 'input.json',
          code: 'invalid_json',
          path: '',
          message: e instanceof Error ? e.message : String(e),
        },
      ],
    };
  }

  // Step 2: validate as InputMap
  const validation = validateInputMap(inputParsed);
  if (!validation.ok) {
    const errors: FixtureLoadError[] = validation.errors.map((ve) => ({
      source: 'input.json',
      code: 'invalid_input_map',
      path: ve.path,
      message: ve.message,
    }));
    return { ok: false, errors };
  }
  const inputJson: InputMap = validation.value;

  // Step 3: parse expected.json
  let expectedParsed: unknown;
  try {
    expectedParsed = JSON.parse(args.expectedJsonText);
  } catch (e) {
    return {
      ok: false,
      errors: [
        {
          source: 'expected.json',
          code: 'invalid_json',
          path: '',
          message: e instanceof Error ? e.message : String(e),
        },
      ],
    };
  }

  // Step 4: validate expected schema
  const schemaResult = validateExpectedSchema(expectedParsed);
  if (!schemaResult.ok) {
    return { ok: false, errors: schemaResult.errors };
  }

  const fixture: Fixture = {
    id: args.id,
    inputJson,
    expectedJson: schemaResult.value,
    storyMd: args.storyMdText,
  };
  return { ok: true, fixture };
}

export function generateFixtureTemplate(): {
  inputJson: string;
  expectedJson: string;
  storyMd: string;
} {
  const dir = {
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

  const inputObj = {
    directions: {
      contributor: { ...dir },
      creator: { ...dir },
      experience_seeker: { ...dir },
      freedom_designer: { ...dir },
      growth_focused: { ...dir },
      relationship_rebuilder: { ...dir },
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
      time_as_yours: { current_state: 0, past_presence: 'no' },
      energy_as_resource: { current_state: 0, past_presence: 'no' },
      felt_aliveness: { current_state: 0, past_presence: 'no' },
      body_physical_aliveness: { current_state: 0, past_presence: 'no' },
      curiosity: { current_state: 0, past_presence: 'no', wanting: 'doesnt_want' },
      making: { current_state: 0, past_presence: 'no', wanting: 'doesnt_want' },
      conversation_depth: { current_state: 0, past_presence: 'no', wanting: 'doesnt_want' },
      being_known: { current_state: 0, past_presence: 'no', wanting: 'doesnt_want' },
      friendship: { current_state: 0, past_presence: 'no', wanting: 'doesnt_want' },
      intimacy: { current_state: 0, past_presence: 'no', wanting: 'doesnt_want' },
      mattering: { current_state: 0, past_presence: 'no', wanting: 'doesnt_want' },
      spiritual: { current_state: 20, past_presence: 'no', wanting: 'doesnt_want' },
    },
    constraints: {
      energy_availability: 0,
      time_availability: 0,
      body_capacity: 0,
      permission: 0,
      permission_sub_shape: 'present',
    },
    cross_cutting: {
      recent_life_shape_change: 'no',
      replacement_structure_exists: 'no',
      recent_reaching: 'long_established',
    },
    self_report: {
      named_absences: [],
    },
  };

  const expectedObj = {
    directions: {
      creator: {
        surfaced: true,
        pull: { between: [50, 70] },
        pull_quality: { contains: ['suppressed'] },
        pull_state: { equals: ['held_attributed_unexpressed'] },
      },
    },
    domains: {
      making: { fires: true, value: 'reduced_wants_back' },
    },
    constraints: {
      permission: {
        value: { between: [25, 35] },
        band: 'blocked',
        fires: true,
      },
    },
    cross_cutting: {
      between_shapes: { fires: false },
    },
  };

  const storyMd = `# [Story name]

Brief description of the story shape this fixture represents.

## Key characteristics

-

## What this fixture pins

-
`;

  return {
    inputJson: JSON.stringify(inputObj, null, 2),
    expectedJson: JSON.stringify(expectedObj, null, 2),
    storyMd,
  };
}
