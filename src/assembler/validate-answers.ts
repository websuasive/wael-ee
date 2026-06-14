// Questionnaire answers validator. Runtime validation boundary for untyped JSON.
// Mirrors the engine's ValidationResult convention (reuses types from @/engine/validation).
// Strict presence + no-extra-keys, all errors collected, never throws.

import type { ValidationResult, ValidationError } from '@/engine/validation';
import type { QuestionnaireAnswers, DomainKey, DirectionKey, NamedAbsenceId } from './answers';

/* ------------------------------------------------------------------ */
/* Internal lookup tables                                             */
/* ------------------------------------------------------------------ */

const DOMAIN_KEYS: readonly DomainKey[] = [
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

const DIRECTION_KEYS: readonly DirectionKey[] = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
] as const;

const NAMED_ABSENCE_IDS: readonly NamedAbsenceId[] = [
  'more_friends',
  'more_time_to_myself',
  'something_just_for_me',
  'more_energy',
  'getting_back_in_shape',
  'something_to_look_forward_to',
  'proper_conversation',
  'building_or_making',
  'something_im_part_of',
] as const;

const LETTER_UNIONS = {
  q2_primary_load: ['a', 'b', 'c', 'd'] as const,
  q3_paid_work_relationship: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const,
  q4_life_shape_duration: ['a', 'b', 'c'] as const,
  q5_recent_life_shape_change: ['a', 'b', 'c'] as const,
  q6_capacity_strain: ['a', 'b', 'c'] as const,
  q7_sociality_default: ['a', 'b', 'c'] as const,
  q11a_spare_resource: ['a', 'b', 'c'] as const,
  q11b_footprint: ['a', 'b', 'c'] as const,
  q11c_small_wants: ['a', 'b', 'c'] as const,
  q25_energy_availability: ['a', 'b', 'c', 'd', 'e'] as const,
  q27_body_capacity: ['a', 'b', 'c', 'd'] as const,
  q29_recent_reaching: ['a', 'b', 'c', 'd'] as const,
  q30_permission: ['a', 'b', 'c', 'd', 'e'] as const,
  q31_role_consolidation: ['a', 'b', 'c'] as const,
  q32_attention_pattern: ['a', 'b', 'c'] as const,
  q33_relational_presence: ['a', 'b', 'c', 'd'] as const,
  q_friendship_count: ['a', 'b', 'c'] as const,
  q_depth_known: ['a', 'b', 'c'] as const,
  per_direction_card_a: ['a', 'b', 'c', 'd'] as const,
  per_direction_card_b: ['a', 'b', 'c'] as const,
  per_direction_card_c: ['a', 'b', 'c', 'skipped'] as const,
  q1_week_shape_ticked: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const,
} as const;

const DIRECTION_CHOICE_VALUES = [
  ...DIRECTION_KEYS,
  'rest',
  'none',
] as const;

const REQUIRED_FIELDS: readonly (keyof QuestionnaireAnswers)[] = [
  'domain_current_state',
  'past_presence_selection',
  'peace_discriminator',
  'q70_allocation',
  'per_direction_card_a',
  'per_direction_card_b',
  'per_direction_card_c',
  'q8_past_presence_ticked',
  'q9_stopped_expecting_ticked',
  'q10_direction_chosen',
  'q10b_retrospective',
  'q10c_counterfactual',
  'q4_life_shape_duration',
  'q5_recent_life_shape_change',
  'q29_recent_reaching',
  'q2_primary_load',
  'q3_paid_work_relationship',
  'q7_sociality_default',
  'q11a_spare_resource',
  'q11b_footprint',
  'q11c_small_wants',
  'q31_role_consolidation',
  'q32_attention_pattern',
  'q33_relational_presence',
  'q_friendship_count',
  'q_depth_known',
  'q6_capacity_strain',
  'q1_week_shape_ticked',
  'q25_energy_availability',
  'q26_time_availability',
  'q27_body_capacity',
  'q30_permission',
  'q34_self_report',
] as const;

/* ------------------------------------------------------------------ */
/* Internal helpers (mirroring engine/validation.ts)                    */
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
/* Field validators                                                    */
/* ------------------------------------------------------------------ */

function validateDomainCurrentState(
  value: unknown,
  errors: ValidationError[],
): void {
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'domain_current_state',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  checkExactKeys(value, DOMAIN_KEYS, [], 'domain_current_state', errors);
  for (const key of DOMAIN_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    checkNumber(value[key], joinPath('domain_current_state', key), errors);
  }
}

function validatePastPresenceSelection(
  value: unknown,
  errors: ValidationError[],
): void {
  if (!Array.isArray(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'past_presence_selection',
      message: `Expected array, got ${describe(value)}`,
    });
    return;
  }
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isOneOf(item, DOMAIN_KEYS)) {
      errors.push({
        code: 'invalid_categorical',
        path: `past_presence_selection[${String(i)}]`,
        message: `Expected one of ${JSON.stringify(DOMAIN_KEYS)}, got ${describe(item)}`,
      });
    }
  }
}

function validatePerDirectionCard<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string,
  errors: ValidationError[],
): void {
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: fieldName,
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  checkExactKeys(value, DIRECTION_KEYS, [], fieldName, errors);
  for (const key of DIRECTION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    checkCategorical(value[key], allowed, joinPath(fieldName, key), errors);
  }
}

function validateDirectionArray(
  value: unknown,
  fieldName: string,
  errors: ValidationError[],
): void {
  if (!Array.isArray(value)) {
    errors.push({
      code: 'invalid_type',
      path: fieldName,
      message: `Expected array, got ${describe(value)}`,
    });
    return;
  }
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isOneOf(item, DIRECTION_KEYS)) {
      errors.push({
        code: 'invalid_categorical',
        path: `${fieldName}[${String(i)}]`,
        message: `Expected one of ${JSON.stringify(DIRECTION_KEYS)}, got ${describe(item)}`,
      });
    }
  }
}

function validateDirectionChoice(
  value: unknown,
  fieldName: string,
  errors: ValidationError[],
): void {
  checkCategorical(value, DIRECTION_CHOICE_VALUES, fieldName, errors);
}

function validateWeekShapeTicked(
  value: unknown,
  errors: ValidationError[],
): void {
  if (!Array.isArray(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'q1_week_shape_ticked',
      message: `Expected array, got ${describe(value)}`,
    });
    return;
  }
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!isOneOf(item, LETTER_UNIONS.q1_week_shape_ticked)) {
      errors.push({
        code: 'invalid_categorical',
        path: `q1_week_shape_ticked[${String(i)}]`,
        message: `Expected one of ${JSON.stringify(LETTER_UNIONS.q1_week_shape_ticked)}, got ${describe(item)}`,
      });
    }
  }
}

function validateQ34SelfReport(
  value: unknown,
  errors: ValidationError[],
): void {
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'q34_self_report',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  const kind = value['kind'];
  if (typeof kind !== 'string') {
    errors.push({
      code: 'invalid_type',
      path: 'q34_self_report.kind',
      message: `Expected string, got ${describe(kind)}`,
    });
    return;
  }
  if (kind === 'nothing_really') {
    // Check no extra fields for nothing_really variant
    const allowed = new Set(['kind']);
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) {
        errors.push({
          code: 'unknown_field',
          path: joinPath('q34_self_report', key),
          message: `Unknown field '${key}' for nothing_really variant`,
        });
      }
    }
    return;
  }
  if (kind === 'named') {
    const items = value['items'];
    if (!Array.isArray(items)) {
      errors.push({
        code: 'invalid_type',
        path: 'q34_self_report.items',
        message: `Expected array, got ${describe(items)}`,
      });
      return;
    }
    // Cap check
    if (items.length > 3) {
      errors.push({
        code: 'self_report_cap_exceeded',
        path: 'q34_self_report.items',
        message: `Expected at most 3 entries, got ${String(items.length)}`,
      });
    }
    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!isOneOf(item, NAMED_ABSENCE_IDS)) {
        errors.push({
          code: 'invalid_categorical',
          path: `q34_self_report.items[${String(i)}]`,
          message: `Expected one of ${JSON.stringify(NAMED_ABSENCE_IDS)}, got ${describe(item)}`,
        });
      }
    }
    return;
  }
  // Invalid kind
  errors.push({
    code: 'invalid_categorical',
    path: 'q34_self_report.kind',
    message: `Expected one of ['nothing_really', 'named'], got ${JSON.stringify(kind)}`,
  });
}

function validatePeaceDiscriminator(
  value: unknown,
  errors: ValidationError[],
): void {
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'peace_discriminator',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  // Empty map is valid (man with no faded domains)
  const keys = Object.keys(value);
  for (const key of keys) {
    if (!isOneOf(key, DOMAIN_KEYS)) {
      errors.push({
        code: 'invalid_categorical',
        path: joinPath('peace_discriminator', key),
        message: `Expected one of ${JSON.stringify(DOMAIN_KEYS)}, got ${describe(key)}`,
      });
    }
    const item = value[key];
    if (!isOneOf(item, ['made_peace', 'still_misses'] as const)) {
      errors.push({
        code: 'invalid_categorical',
        path: joinPath('peace_discriminator', key),
        message: `Expected one of ['made_peace', 'still_misses'], got ${describe(item)}`,
      });
    }
  }
}

function validateQ70Allocation(
  value: unknown,
  errors: ValidationError[],
): void {
  if (!isPlainObject(value)) {
    errors.push({
      code: 'invalid_type',
      path: 'q70_allocation',
      message: `Expected object, got ${describe(value)}`,
    });
    return;
  }
  const keys = Object.keys(value);
  // At most 3 keys
  if (keys.length > 3) {
    errors.push({
      code: 'out_of_range',
      path: 'q70_allocation',
      message: `Expected at most 3 direction keys, got ${String(keys.length)}`,
    });
  }
  let sum = 0;
  for (const key of keys) {
    if (!isOneOf(key, DIRECTION_KEYS)) {
      errors.push({
        code: 'invalid_categorical',
        path: joinPath('q70_allocation', key),
        message: `Expected one of ${JSON.stringify(DIRECTION_KEYS)}, got ${describe(key)}`,
      });
    }
    const item = value[key];
    if (typeof item !== 'number') {
      errors.push({
        code: 'invalid_type',
        path: joinPath('q70_allocation', key),
        message: `Expected number, got ${describe(item)}`,
      });
    } else if (!isFiniteNumberInRange(item, 0, 70)) {
      errors.push({
        code: 'out_of_range',
        path: joinPath('q70_allocation', key),
        message: `Expected number in 0–70, got ${String(item)}`,
      });
    } else {
      sum += item;
    }
  }
  // Sum must be ≤ 70
  if (sum > 70) {
    errors.push({
      code: 'out_of_range',
      path: 'q70_allocation',
      message: `Sum of allocations must be ≤ 70, got ${String(sum)}`,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                 */
/* ------------------------------------------------------------------ */

export function validateQuestionnaireAnswers(
  input: unknown,
): ValidationResult<QuestionnaireAnswers> {
  const errors: ValidationError[] = [];

  if (!isPlainObject(input)) {
    errors.push({
      code: 'invalid_type',
      path: '',
      message: `Expected QuestionnaireAnswers object, got ${describe(input)}`,
    });
    return { ok: false, errors };
  }

  checkExactKeys(input, REQUIRED_FIELDS, [], '', errors);

  // Validate each field
  if ('domain_current_state' in input) {
    validateDomainCurrentState(input['domain_current_state'], errors);
  }
  if ('past_presence_selection' in input) {
    validatePastPresenceSelection(input['past_presence_selection'], errors);
  }
  if ('peace_discriminator' in input) {
    validatePeaceDiscriminator(input['peace_discriminator'], errors);
  }
  if ('q70_allocation' in input) {
    validateQ70Allocation(input['q70_allocation'], errors);
  }
  if ('per_direction_card_a' in input) {
    validatePerDirectionCard(
      input['per_direction_card_a'],
      LETTER_UNIONS.per_direction_card_a,
      'per_direction_card_a',
      errors,
    );
  }
  if ('per_direction_card_b' in input) {
    validatePerDirectionCard(
      input['per_direction_card_b'],
      LETTER_UNIONS.per_direction_card_b,
      'per_direction_card_b',
      errors,
    );
  }
  if ('per_direction_card_c' in input) {
    validatePerDirectionCard(
      input['per_direction_card_c'],
      LETTER_UNIONS.per_direction_card_c,
      'per_direction_card_c',
      errors,
    );
  }
  if ('q8_past_presence_ticked' in input) {
    validateDirectionArray(input['q8_past_presence_ticked'], 'q8_past_presence_ticked', errors);
  }
  if ('q9_stopped_expecting_ticked' in input) {
    validateDirectionArray(
      input['q9_stopped_expecting_ticked'],
      'q9_stopped_expecting_ticked',
      errors,
    );
  }
  if ('q10_direction_chosen' in input) {
    validateDirectionChoice(input['q10_direction_chosen'], 'q10_direction_chosen', errors);
  }
  if ('q10b_retrospective' in input) {
    validateDirectionChoice(input['q10b_retrospective'], 'q10b_retrospective', errors);
  }
  if ('q10c_counterfactual' in input) {
    validateDirectionChoice(input['q10c_counterfactual'], 'q10c_counterfactual', errors);
  }
  if ('q4_life_shape_duration' in input) {
    checkCategorical(
      input['q4_life_shape_duration'],
      LETTER_UNIONS.q4_life_shape_duration,
      'q4_life_shape_duration',
      errors,
    );
  }
  if ('q5_recent_life_shape_change' in input) {
    checkCategorical(
      input['q5_recent_life_shape_change'],
      LETTER_UNIONS.q5_recent_life_shape_change,
      'q5_recent_life_shape_change',
      errors,
    );
  }
  if ('q29_recent_reaching' in input) {
    checkCategorical(
      input['q29_recent_reaching'],
      LETTER_UNIONS.q29_recent_reaching,
      'q29_recent_reaching',
      errors,
    );
  }
  if ('q2_primary_load' in input) {
    checkCategorical(
      input['q2_primary_load'],
      LETTER_UNIONS.q2_primary_load,
      'q2_primary_load',
      errors,
    );
  }
  if ('q3_paid_work_relationship' in input) {
    checkCategorical(
      input['q3_paid_work_relationship'],
      LETTER_UNIONS.q3_paid_work_relationship,
      'q3_paid_work_relationship',
      errors,
    );
  }
  if ('q7_sociality_default' in input) {
    checkCategorical(
      input['q7_sociality_default'],
      LETTER_UNIONS.q7_sociality_default,
      'q7_sociality_default',
      errors,
    );
  }
  if ('q11a_spare_resource' in input) {
    checkCategorical(
      input['q11a_spare_resource'],
      LETTER_UNIONS.q11a_spare_resource,
      'q11a_spare_resource',
      errors,
    );
  }
  if ('q11b_footprint' in input) {
    checkCategorical(
      input['q11b_footprint'],
      LETTER_UNIONS.q11b_footprint,
      'q11b_footprint',
      errors,
    );
  }
  if ('q11c_small_wants' in input) {
    checkCategorical(
      input['q11c_small_wants'],
      LETTER_UNIONS.q11c_small_wants,
      'q11c_small_wants',
      errors,
    );
  }
  if ('q31_role_consolidation' in input) {
    checkCategorical(
      input['q31_role_consolidation'],
      LETTER_UNIONS.q31_role_consolidation,
      'q31_role_consolidation',
      errors,
    );
  }
  if ('q32_attention_pattern' in input) {
    checkCategorical(
      input['q32_attention_pattern'],
      LETTER_UNIONS.q32_attention_pattern,
      'q32_attention_pattern',
      errors,
    );
  }
  if ('q33_relational_presence' in input) {
    checkCategorical(
      input['q33_relational_presence'],
      LETTER_UNIONS.q33_relational_presence,
      'q33_relational_presence',
      errors,
    );
  }
  if ('q_friendship_count' in input) {
    checkCategorical(
      input['q_friendship_count'],
      LETTER_UNIONS.q_friendship_count,
      'q_friendship_count',
      errors,
    );
  }
  if ('q_depth_known' in input) {
    checkCategorical(
      input['q_depth_known'],
      LETTER_UNIONS.q_depth_known,
      'q_depth_known',
      errors,
    );
  }
  if ('q6_capacity_strain' in input) {
    checkCategorical(
      input['q6_capacity_strain'],
      LETTER_UNIONS.q6_capacity_strain,
      'q6_capacity_strain',
      errors,
    );
  }
  if ('q1_week_shape_ticked' in input) {
    validateWeekShapeTicked(input['q1_week_shape_ticked'], errors);
  }
  if ('q25_energy_availability' in input) {
    checkCategorical(
      input['q25_energy_availability'],
      LETTER_UNIONS.q25_energy_availability,
      'q25_energy_availability',
      errors,
    );
  }
  if ('q26_time_availability' in input) {
    checkNumber(input['q26_time_availability'], 'q26_time_availability', errors);
  }
  if ('q27_body_capacity' in input) {
    checkCategorical(
      input['q27_body_capacity'],
      LETTER_UNIONS.q27_body_capacity,
      'q27_body_capacity',
      errors,
    );
  }
  if ('q30_permission' in input) {
    checkCategorical(
      input['q30_permission'],
      LETTER_UNIONS.q30_permission,
      'q30_permission',
      errors,
    );
  }
  if ('q34_self_report' in input) {
    validateQ34SelfReport(input['q34_self_report'], errors);
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as QuestionnaireAnswers };
}
