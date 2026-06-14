// Input validation for the WAEL engine. Implements the five validity rules
// from spec section 3.1 verbatim. Hand-rolled, no third-party libraries.

import type { InputMap } from './types';

/* ------------------------------------------------------------------ */
/* Public types                                                       */
/* ------------------------------------------------------------------ */

export type ValidationErrorCode =
  | 'missing_field'
  | 'unknown_field'
  | 'invalid_type'
  | 'out_of_range'
  | 'invalid_categorical'
  | 'would_reach_for_inconsistent'
  | 'invalid_universal_wanting'
  | 'self_report_cap_exceeded'
  | 'self_report_nothing_really_exclusive'
  | 'cross_direction_psychological_filtering_missing'
  | 'cross_direction_role_consolidation_missing'
  | 'cross_direction_attention_pattern_missing'
  | 'cross_direction_relational_presence_missing'
  | 'domain_spiritual_missing'
  | 'domain_spiritual_malformed';

export type ValidationError = {
  code: ValidationErrorCode;
  path: string;
  message: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

/* ------------------------------------------------------------------ */
/* Internal lookup tables                                             */
/* ------------------------------------------------------------------ */

const DIRECTION_NAMES = [
  'contributor',
  'creator',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'relationship_rebuilder',
] as const;

const DOMAIN_NAMES = [
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
] as const;

const UNIVERSAL_WANTING_DOMAINS: ReadonlySet<string> = new Set([
  'time_as_yours',
  'energy_as_resource',
  'felt_aliveness',
  'body_physical_aliveness',
]);

const YES_NO = ['yes', 'no'] as const;
const ANTICIPATION = ['none', 'mild', 'quickening'] as const;
const RECENT_ACTION = ['none', 'some', 'recent'] as const;
const SPECIFICITY = ['none', 'partial', 'strong'] as const;
const WANTING = ['wants', 'doesnt_want'] as const;

const DIRECTION_CHOICE = [
  'contributor',
  'creator',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'relationship_rebuilder',
  'rest',
  'none',
] as const;

const LIFE_SHAPE_DURATION = ['recent', 'sustained', 'long'] as const;
const PERMISSION_SUB_SHAPE = [
  'present',
  'want_block',
  'say_block',
  'act_block',
] as const;
const RECENT_REACHING = [
  'recent_and_awkward',
  'mid_stream',
  'long_established',
  'no_current_reaching',
] as const;

const PER_DIRECTION_REQUIRED = [
  'stated_strength',
  'felt_cost',
  'anticipation',
  'current_movement',
  'recent_action',
  'past_presence',
  'specificity',
  'would_reach_for',
  'saturation',
  'stopped_expecting',
] as const;

const PER_DIRECTION_OPTIONAL = [
  'stated_allocation',
] as const;

const TOP_REQUIRED = [
  'directions',
  'cross_direction',
  'domains',
  'constraints',
  'cross_cutting',
  'self_report',
] as const;

const CROSS_DIRECTION_REQUIRED = [
  'direction_chosen',
  'capacity_strain',
  'life_shape_duration',
  'week_shape',
  'life_stage',
  'sociality_default',
  'paid_work_relationship',
  'primary_load',
  'psychological_filtering',
  'role_consolidation',
  'attention_pattern',
  'relational_presence',
] as const;

const CROSS_DIRECTION_OPTIONAL = [
  'reach_retrospective',
  'reach_counterfactual',
] as const;

const WEEK_SHAPE_REQUIRED = [
  'work_dominates',
  'weekends_consumed',
  'weekly_activity',
  'sees_people',
  'makes_things',
  'active_body',
  'belongs_to_group',
  'solo_practice',
  'varied_week',
] as const;

const LIFE_STAGE = [
  'building',
  'consolidating',
  're_evaluating',
  'transitioning',
  'settled',
  'drifting',
  'enduring',
] as const;

const SOCIALITY_DEFAULT = [
  'solitary_by_default',
  'balanced',
  'social_by_default',
] as const;

const PAID_WORK_RELATIONSHIP = [
  'defining',
  'consuming',
  'functional',
  'peripheral',
  'between',
  'chosen',
  'endured',
] as const;

const PRIMARY_LOAD = [
  'paid_work',
  'caregiving',
  'household_admin',
  'none',
] as const;

const PSYCHOLOGICAL_FILTERING = [
  'does_not_filter',
  'filters_some',
  'filters_pervasively',
] as const;

const ROLE_CONSOLIDATION = [
  'holds_other_selves',
  'role_inflected',
  'role_consolidated',
] as const;

const ATTENTION_PATTERN = [
  'engaged',
  'intermittent',
  'autopilot',
] as const;

const RELATIONAL_PRESENCE = [
  'present',
  'partial',
  'mostly_absent',
  'no_close_relationship',
] as const;

const PEACE_DISCRIMINATOR = ['made_peace', 'still_misses'] as const;

const SELF_REPORT_ITEMS = [
  'more_friends',
  'more_time_to_myself',
  'something_just_for_me',
  'more_energy',
  'getting_back_in_shape',
  'something_to_look_forward_to',
  'proper_conversation',
  'building_or_making',
  'something_im_part_of',
  'nothing_really',
] as const;

const SELF_REPORT_REQUIRED = ['named_absences'] as const;

const CONSTRAINTS_REQUIRED = [
  'energy_availability',
  'time_availability',
  'body_capacity',
  'permission',
  'permission_sub_shape',
] as const;

const CROSS_CUTTING_REQUIRED = [
  'recent_life_shape_change',
  'replacement_structure_exists',
  'recent_reaching',
] as const;

/* ------------------------------------------------------------------ */
/* Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function isFiniteNumberInRange(x: unknown, min: number, max: number): boolean {
  return typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'string') return `string ${JSON.stringify(v)}`;
  if (typeof v === 'number') return `number ${String(v)}`;
  if (typeof v === 'boolean') return `boolean ${String(v)}`;
  return typeof v;
}

function joinPath(base: string, key: string): string {
  return base === '' ? key : `${base}.${key}`;
}

function checkExactKeys(
  obj: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
  path: string,
  errors: ValidationError[],
): void {
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      errors.push({
        code: 'missing_field',
        path: joinPath(path, key),
        message: `Field '${key}' is required`,
      });
    }
  }
  const allowed = new Set<string>([...required, ...optional]);
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      errors.push({
        code: 'unknown_field',
        path: joinPath(path, key),
        message: `Unknown field '${key}'`,
      });
    }
  }
}

function checkNumber(
  value: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (typeof value !== 'number') {
    errors.push({
      code: 'invalid_type',
      path,
      message: `Expected number, got ${describe(value)}`,
    });
    return;
  }
  if (!isFiniteNumberInRange(value, 0, 100)) {
    errors.push({
      code: 'out_of_range',
      path,
      message: `Expected number in 0–100, got ${String(value)}`,
    });
  }
}

function checkCategorical<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  errors: ValidationError[],
): void {
  if (typeof value !== 'string') {
    errors.push({
      code: 'invalid_type',
      path,
      message: `Expected string, got ${describe(value)}`,
    });
    return;
  }
  if (!(allowed as readonly string[]).includes(value)) {
    errors.push({
      code: 'invalid_categorical',
      path,
      message: `Expected one of ${JSON.stringify(allowed)}, got ${JSON.stringify(value)}`,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Branch validators                                                  */
/* ------------------------------------------------------------------ */

function validatePerDirection(
  value: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path,
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  checkExactKeys(value, PER_DIRECTION_REQUIRED, PER_DIRECTION_OPTIONAL, path, errors);

  if ('stated_strength' in value)
    checkNumber(value['stated_strength'], joinPath(path, 'stated_strength'), errors);
  if ('felt_cost' in value)
    checkNumber(value['felt_cost'], joinPath(path, 'felt_cost'), errors);
  if ('current_movement' in value)
    checkNumber(value['current_movement'], joinPath(path, 'current_movement'), errors);
  if ('anticipation' in value)
    checkCategorical(value['anticipation'], ANTICIPATION, joinPath(path, 'anticipation'), errors);
  if ('recent_action' in value)
    checkCategorical(value['recent_action'], RECENT_ACTION, joinPath(path, 'recent_action'), errors);
  if ('past_presence' in value)
    checkCategorical(value['past_presence'], YES_NO, joinPath(path, 'past_presence'), errors);
  if ('specificity' in value)
    checkCategorical(value['specificity'], SPECIFICITY, joinPath(path, 'specificity'), errors);
  if ('would_reach_for' in value)
    checkCategorical(value['would_reach_for'], YES_NO, joinPath(path, 'would_reach_for'), errors);
  if ('saturation' in value)
    checkCategorical(value['saturation'], YES_NO, joinPath(path, 'saturation'), errors);
  if ('stopped_expecting' in value)
    checkCategorical(value['stopped_expecting'], YES_NO, joinPath(path, 'stopped_expecting'), errors);

  // Optional: stated_allocation
  if ('stated_allocation' in value) {
    const sa = value['stated_allocation'];
    const sapath = joinPath(path, 'stated_allocation');
    if (typeof sa !== 'number') {
      errors.push({
        code: 'invalid_type',
        path: sapath,
        message: `Expected number, got ${describe(sa)}`,
      });
    } else if (sa < 0 || sa > 100) {
      errors.push({
        code: 'out_of_range',
        path: sapath,
        message: `Expected number between 0 and 100, got ${sa}`,
      });
    }
  }
}

function validateDirections(value: unknown, errors: ValidationError[]): void {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'directions',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  checkExactKeys(value, DIRECTION_NAMES, [], 'directions', errors);
  for (const name of DIRECTION_NAMES) {
    if (!Object.prototype.hasOwnProperty.call(value, name)) continue;
    validatePerDirection(value[name], `directions.${name}`, errors);
  }
}

function validatePerDomain(
  value: unknown,
  path: string,
  isUniversalWanting: boolean,
  errors: ValidationError[],
): void {
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path,
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  const required = isUniversalWanting
    ? (['current_state', 'past_presence'] as const)
    : (['current_state', 'past_presence', 'wanting'] as const);
  const optional = isUniversalWanting
    ? (['wanting', 'peace_discriminator'] as const)
    : (['peace_discriminator'] as const);
  checkExactKeys(value, required, optional, path, errors);

  if ('current_state' in value)
    checkNumber(value['current_state'], joinPath(path, 'current_state'), errors);
  if ('past_presence' in value)
    checkCategorical(value['past_presence'], YES_NO, joinPath(path, 'past_presence'), errors);

  if ('wanting' in value) {
    const w = value['wanting'];
    const wpath = joinPath(path, 'wanting');
    if (isUniversalWanting) {
      if (typeof w !== 'string') {
        errors.push({
          code: 'invalid_type',
          path: wpath,
          message: `Expected string, got ${describe(w)}`,
        });
      } else if (w !== 'wants') {
        errors.push({
          code: 'invalid_universal_wanting',
          path: wpath,
          message: `Expected "wants" for universal-wanting domain, got ${JSON.stringify(w)}`,
        });
      }
    } else {
      checkCategorical(w, WANTING, wpath, errors);
    }
  }

  // Optional: peace_discriminator
  if ('peace_discriminator' in value) {
    checkCategorical(
      value['peace_discriminator'],
      PEACE_DISCRIMINATOR,
      joinPath(path, 'peace_discriminator'),
      errors,
    );
  }
}

/* v4 Rule 14 — spiritual domain validation (mandatory wanting). */
function validateSpiritualDomain(
  value: unknown,
  errors: ValidationError[],
): void {
  const path = 'domains.spiritual';
  
  if (!isPlainObject(value)) {
    errors.push({
      code: 'domain_spiritual_malformed',
      path,
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }

  // Check for exact required fields (current_state, past_presence, wanting all required)
  const required = ['current_state', 'past_presence', 'wanting'] as const;
  checkExactKeys(value, required, [], path, errors);

  // Validate current_state (0-100 integer)
  if ('current_state' in value) {
    const cs = value['current_state'];
    if (typeof cs !== 'number') {
      errors.push({
        code: 'domain_spiritual_malformed',
        path: joinPath(path, 'current_state'),
        message: `Expected number, got ${describe(cs)}`,
      });
    } else if (!isFiniteNumberInRange(cs, 0, 100)) {
      errors.push({
        code: 'domain_spiritual_malformed',
        path: joinPath(path, 'current_state'),
        message: `Expected number in 0–100, got ${String(cs)}`,
      });
    }
  }

  // Validate past_presence (yes | no)
  if ('past_presence' in value) {
    const pp = value['past_presence'];
    if (!isOneOf(pp, YES_NO)) {
      errors.push({
        code: 'domain_spiritual_malformed',
        path: joinPath(path, 'past_presence'),
        message: `Expected one of ${JSON.stringify(YES_NO)}, got ${describe(pp)}`,
      });
    }
  }

  // Validate wanting (wants | doesnt_want, MANDATORY for spiritual)
  if (!('wanting' in value)) {
    errors.push({
      code: 'domain_spiritual_malformed',
      path: joinPath(path, 'wanting'),
      message: 'Field "wanting" is required for spiritual domain',
    });
  } else {
    const w = value['wanting'];
    if (!isOneOf(w, WANTING)) {
      errors.push({
        code: 'domain_spiritual_malformed',
        path: joinPath(path, 'wanting'),
        message: `Expected one of ${JSON.stringify(WANTING)}, got ${describe(w)}`,
      });
    }
  }
}

function validateDomains(value: unknown, errors: ValidationError[]): void {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'domains',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  // v4 Rule 14: spiritual key absence emits domain_spiritual_missing (not generic missing_field).
  // Pass spiritual as optional to checkExactKeys so the present spiritual key is not flagged as unknown_field;
  // its required-ness is enforced by the dedicated check below.
  const NON_SPIRITUAL_DOMAINS = DOMAIN_NAMES.filter((n) => n !== 'spiritual');
  checkExactKeys(value, NON_SPIRITUAL_DOMAINS, ['spiritual'], 'domains', errors);
  if (!Object.prototype.hasOwnProperty.call(value, 'spiritual')) {
    errors.push({
      code: 'domain_spiritual_missing',
      path: 'domains.spiritual',
      message: 'Field "domains.spiritual" is required',
    });
  }
  for (const name of DOMAIN_NAMES) {
    if (!Object.prototype.hasOwnProperty.call(value, name)) continue;
    
    // v4 Rule 14: spiritual domain has special validation (mandatory wanting)
    if (name === 'spiritual') {
      validateSpiritualDomain(value[name], errors);
    } else {
      validatePerDomain(
        value[name],
        `domains.${name}`,
        UNIVERSAL_WANTING_DOMAINS.has(name),
        errors,
      );
    }
  }
}

function validateCrossDirection(value: unknown, errors: ValidationError[]): void {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'cross_direction',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  checkExactKeys(value, CROSS_DIRECTION_REQUIRED, CROSS_DIRECTION_OPTIONAL, 'cross_direction', errors);

  if ('direction_chosen' in value)
    checkCategorical(
      value['direction_chosen'],
      DIRECTION_CHOICE,
      'cross_direction.direction_chosen',
      errors,
    );
  if ('capacity_strain' in value)
    checkCategorical(
      value['capacity_strain'],
      YES_NO,
      'cross_direction.capacity_strain',
      errors,
    );
  if ('life_shape_duration' in value)
    checkCategorical(
      value['life_shape_duration'],
      LIFE_SHAPE_DURATION,
      'cross_direction.life_shape_duration',
      errors,
    );
  if ('week_shape' in value)
    validateWeekShape(value['week_shape'], errors);
  if ('life_stage' in value)
    checkCategorical(
      value['life_stage'],
      LIFE_STAGE,
      'cross_direction.life_stage',
      errors,
    );
  if ('sociality_default' in value)
    checkCategorical(
      value['sociality_default'],
      SOCIALITY_DEFAULT,
      'cross_direction.sociality_default',
      errors,
    );
  if ('paid_work_relationship' in value)
    checkCategorical(
      value['paid_work_relationship'],
      PAID_WORK_RELATIONSHIP,
      'cross_direction.paid_work_relationship',
      errors,
    );
  if ('primary_load' in value)
    checkCategorical(
      value['primary_load'],
      PRIMARY_LOAD,
      'cross_direction.primary_load',
      errors,
    );

  // v4 Rule 10: psychological_filtering required
  if (!('psychological_filtering' in value)) {
    errors.push({
      code: 'cross_direction_psychological_filtering_missing',
      path: 'cross_direction.psychological_filtering',
      message: 'Field "psychological_filtering" is required',
    });
  } else if (!isOneOf(value['psychological_filtering'], PSYCHOLOGICAL_FILTERING)) {
    errors.push({
      code: 'cross_direction_psychological_filtering_missing',
      path: 'cross_direction.psychological_filtering',
      message: `Expected one of ${JSON.stringify(PSYCHOLOGICAL_FILTERING)}, got ${describe(value['psychological_filtering'])}`,
    });
  }

  // v4 Rule 11: role_consolidation required
  if (!('role_consolidation' in value)) {
    errors.push({
      code: 'cross_direction_role_consolidation_missing',
      path: 'cross_direction.role_consolidation',
      message: 'Field "role_consolidation" is required',
    });
  } else if (!isOneOf(value['role_consolidation'], ROLE_CONSOLIDATION)) {
    errors.push({
      code: 'cross_direction_role_consolidation_missing',
      path: 'cross_direction.role_consolidation',
      message: `Expected one of ${JSON.stringify(ROLE_CONSOLIDATION)}, got ${describe(value['role_consolidation'])}`,
    });
  }

  // v4 Rule 12: attention_pattern required
  if (!('attention_pattern' in value)) {
    errors.push({
      code: 'cross_direction_attention_pattern_missing',
      path: 'cross_direction.attention_pattern',
      message: 'Field "attention_pattern" is required',
    });
  } else if (!isOneOf(value['attention_pattern'], ATTENTION_PATTERN)) {
    errors.push({
      code: 'cross_direction_attention_pattern_missing',
      path: 'cross_direction.attention_pattern',
      message: `Expected one of ${JSON.stringify(ATTENTION_PATTERN)}, got ${describe(value['attention_pattern'])}`,
    });
  }

  // Optional: reach_retrospective
  if ('reach_retrospective' in value) {
    checkCategorical(
      value['reach_retrospective'],
      DIRECTION_CHOICE,
      'cross_direction.reach_retrospective',
      errors,
    );
  }

  // Optional: reach_counterfactual
  if ('reach_counterfactual' in value) {
    checkCategorical(
      value['reach_counterfactual'],
      DIRECTION_CHOICE,
      'cross_direction.reach_counterfactual',
      errors,
    );
  }

  // v4 Rule 13: relational_presence required
  if (!('relational_presence' in value)) {
    errors.push({
      code: 'cross_direction_relational_presence_missing',
      path: 'cross_direction.relational_presence',
      message: 'Field "relational_presence" is required',
    });
  } else if (!isOneOf(value['relational_presence'], RELATIONAL_PRESENCE)) {
    errors.push({
      code: 'cross_direction_relational_presence_missing',
      path: 'cross_direction.relational_presence',
      message: `Expected one of ${JSON.stringify(RELATIONAL_PRESENCE)}, got ${describe(value['relational_presence'])}`,
    });
  }
}

/* Rule 6 — week_shape completeness (nine boolean flags, no defaults). */
function validateWeekShape(value: unknown, errors: ValidationError[]): void {
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'cross_direction.week_shape',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  checkExactKeys(
    value,
    WEEK_SHAPE_REQUIRED,
    [],
    'cross_direction.week_shape',
    errors,
  );
  for (const flag of WEEK_SHAPE_REQUIRED) {
    if (!Object.prototype.hasOwnProperty.call(value, flag)) continue;
    const v = value[flag];
    if (typeof v !== 'boolean') {
      errors.push({
        code: 'invalid_type',
        path: `cross_direction.week_shape.${flag}`,
        message: `Expected boolean, got ${describe(v)}`,
      });
    }
  }
}

/* Rules 8 and 9 — self_report shape, cap, and mutual exclusion. */
function validateSelfReport(value: unknown, errors: ValidationError[]): void {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'self_report',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  checkExactKeys(value, SELF_REPORT_REQUIRED, [], 'self_report', errors);
  if (!('named_absences' in value)) return;
  const arr = value['named_absences'];
  if (!Array.isArray(arr)) {
    errors.push({
      code: 'invalid_type',
      path: 'self_report.named_absences',
      message: `Expected array, got ${describe(arr)}`,
    });
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (
      typeof item !== 'string' ||
      !(SELF_REPORT_ITEMS as readonly string[]).includes(item)
    ) {
      errors.push({
        code: 'invalid_categorical',
        path: `self_report.named_absences[${String(i)}]`,
        message: `Expected one of ${JSON.stringify(SELF_REPORT_ITEMS)}, got ${describe(item)}`,
      });
    }
  }
  // Rule 9a: cap.
  if (arr.length > 3) {
    errors.push({
      code: 'self_report_cap_exceeded',
      path: 'self_report.named_absences',
      message: `Expected at most 3 entries, got ${String(arr.length)}`,
    });
  }
  // Rule 9b: nothing_really mutual exclusion.
  if (arr.includes('nothing_really') && arr.length > 1) {
    errors.push({
      code: 'self_report_nothing_really_exclusive',
      path: 'self_report.named_absences',
      message:
        '"nothing_really" is mutually exclusive with all other named_absences entries',
    });
  }
}

function validateConstraints(value: unknown, errors: ValidationError[]): void {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'constraints',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  checkExactKeys(value, CONSTRAINTS_REQUIRED, [], 'constraints', errors);

  if ('energy_availability' in value)
    checkNumber(value['energy_availability'], 'constraints.energy_availability', errors);
  if ('time_availability' in value)
    checkNumber(value['time_availability'], 'constraints.time_availability', errors);
  if ('body_capacity' in value)
    checkNumber(value['body_capacity'], 'constraints.body_capacity', errors);
  if ('permission' in value)
    checkNumber(value['permission'], 'constraints.permission', errors);
  if ('permission_sub_shape' in value)
    checkCategorical(
      value['permission_sub_shape'],
      PERMISSION_SUB_SHAPE,
      'constraints.permission_sub_shape',
      errors,
    );
}

function validateCrossCutting(value: unknown, errors: ValidationError[]): void {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'cross_cutting',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  checkExactKeys(value, CROSS_CUTTING_REQUIRED, [], 'cross_cutting', errors);

  if ('recent_life_shape_change' in value)
    checkCategorical(
      value['recent_life_shape_change'],
      YES_NO,
      'cross_cutting.recent_life_shape_change',
      errors,
    );
  if ('replacement_structure_exists' in value)
    checkCategorical(
      value['replacement_structure_exists'],
      YES_NO,
      'cross_cutting.replacement_structure_exists',
      errors,
    );
  if ('recent_reaching' in value)
    checkCategorical(
      value['recent_reaching'],
      RECENT_REACHING,
      'cross_cutting.recent_reaching',
      errors,
    );
}

/* ------------------------------------------------------------------ */
/* Rule 4 — would_reach_for / direction_chosen consistency            */
/* ------------------------------------------------------------------ */

function applyRule4(
  directions: unknown,
  crossDirection: unknown,
  errors: ValidationError[],
): void {
  if (!isPlainObject(directions) || !isPlainObject(crossDirection)) return;

  const dc = crossDirection['direction_chosen'];
  if (!isOneOf(dc, DIRECTION_CHOICE)) return;

  const reaches: Record<string, 'yes' | 'no'> = {};
  for (const name of DIRECTION_NAMES) {
    const dir = directions[name];
    if (!isPlainObject(dir)) return;
    const wrf = dir['would_reach_for'];
    if (wrf !== 'yes' && wrf !== 'no') return;
    reaches[name] = wrf;
  }

  if (dc === 'rest' || dc === 'none') {
    const offenders = DIRECTION_NAMES.filter((n) => reaches[n] === 'yes');
    if (offenders.length > 0) {
      errors.push({
        code: 'would_reach_for_inconsistent',
        path: 'cross_direction.direction_chosen',
        message: `direction_chosen="${dc}" requires all would_reach_for to be "no"; offending: ${JSON.stringify(offenders)}`,
      });
    }
    return;
  }

  // dc is one of the six direction names
  const wrong = DIRECTION_NAMES.filter((n) =>
    n === dc ? reaches[n] !== 'yes' : reaches[n] !== 'no',
  );
  if (wrong.length > 0) {
    errors.push({
      code: 'would_reach_for_inconsistent',
      path: 'cross_direction.direction_chosen',
      message: `direction_chosen="${dc}" requires would_reach_for="yes" only on "${dc}"; mismatched: ${JSON.stringify(wrong)}`,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                 */
/* ------------------------------------------------------------------ */

export function validateInputMap(input: unknown): ValidationResult<InputMap> {
  const errors: ValidationError[] = [];

  if (!isPlainObject(input)) {
    errors.push({
      code: 'invalid_type',
      path: '',
      message: `Expected InputMap object, got ${describe(input)}`,
    });
    return { ok: false, errors };
  }

  checkExactKeys(input, TOP_REQUIRED, [], '', errors);

  validateDirections(input['directions'], errors);
  validateCrossDirection(input['cross_direction'], errors);
  validateDomains(input['domains'], errors);
  validateConstraints(input['constraints'], errors);
  validateCrossCutting(input['cross_cutting'], errors);
  validateSelfReport(input['self_report'], errors);

  applyRule4(input['directions'], input['cross_direction'], errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as InputMap };
}
