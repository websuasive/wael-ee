// Experience inventory validation logic (v3 schema). Per v3 spec §11, §13.
// Exported functions for testing and potential build-time script use.

import type { Activity, Magnitude, Protocol, WhoWith } from './types';
import { inventoryTagToEngineDirection } from './data/direction_mapping';

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const VALID_PROTOCOLS: readonly Protocol[] = [
  'stir',
  'loophole',
  'slip',
  'catch',
  'trespass',
  'aside',
  'steeping',
];

const VALID_MAGNITUDES: readonly Magnitude[] = ['small', 'medium', 'big'];

const VALID_WHO_WITH: readonly WhoWith[] = [
  'solo',
  'with_young_children',
  'with_teenagers',
  'with_adult_children',
  'with_parents',
  'with_partner',
  'with_friends',
];

/* ------------------------------------------------------------------ */
/* Validation result types                                           */
/* ------------------------------------------------------------------ */

export interface ValidationError {
  activityId?: string;
  variantId?: string;
  field: string;
  message: string;
}

export interface ValidationWarning {
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/* ------------------------------------------------------------------ */
/* Blocking validation checks                                         */
/* ------------------------------------------------------------------ */

/**
 * Direction tag check (blocking). Per v3 spec §11.
 * Validates all direction tags in the inventory are mapped in
 * inventoryTagToEngineDirection. Empty directions[] is valid.
 */
export function validateDirectionTags(
  activities: readonly Activity[],
): ValidationError[] {
  const unmappedTags = new Set<string>();

  for (const activity of activities) {
    for (const tag of activity.directions) {
      if (!(tag in inventoryTagToEngineDirection)) {
        unmappedTags.add(tag);
      }
    }
  }

  if (unmappedTags.size === 0) return [];

  return [
    {
      field: 'directions',
      message: `Unmapped direction tags found: ${[...unmappedTags].sort().join(', ')}`,
    },
  ];
}

/**
 * Directions length check (blocking). Per v3 spec §11.
 * Validates directions.length is 0-3.
 */
export function validateDirectionsLength(
  activities: readonly Activity[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const activity of activities) {
    if (activity.directions.length > 3) {
      errors.push({
        activityId: activity.activity_id,
        field: 'directions',
        message: `Too many direction tags: ${activity.directions.length}. Maximum is 3`,
      });
    }
  }

  return errors;
}

/**
 * Interest domains check (blocking). Per v3 spec §11.
 * Validates interest_domains.length is 1-3 (at least one required).
 */
export function validateInterestDomains(
  activities: readonly Activity[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const activity of activities) {
    if (activity.interest_domains.length === 0) {
      errors.push({
        activityId: activity.activity_id,
        field: 'interest_domains',
        message: 'At least one interest domain is required',
      });
    } else if (activity.interest_domains.length > 3) {
      errors.push({
        activityId: activity.activity_id,
        field: 'interest_domains',
        message: `Too many interest domains: ${activity.interest_domains.length}. Maximum is 3`,
      });
    }
  }

  return errors;
}

/**
 * Novelty index check (blocking). Per v3 spec §11.
 * Validates novelty_index is an integer 1-5.
 */
export function validateNoveltyIndex(
  activities: readonly Activity[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const activity of activities) {
    const n = activity.novelty_index;
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      errors.push({
        activityId: activity.activity_id,
        field: 'novelty_index',
        message: `Invalid novelty_index: ${n}. Must be an integer 1-5`,
      });
    }
  }

  return errors;
}

/**
 * Protocol check (blocking). Per v3 spec §13.
 * Validates every variant's protocol is one of the seven valid values.
 */
export function validateProtocol(
  activities: readonly Activity[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const activity of activities) {
    for (const variant of activity.variants) {
      if (!VALID_PROTOCOLS.includes(variant.protocol)) {
        errors.push({
          activityId: activity.activity_id,
          variantId: variant.variant_id,
          field: 'protocol',
          message: `Invalid protocol: "${variant.protocol}". Must be one of: ${VALID_PROTOCOLS.join(', ')}`,
        });
      }
    }
  }

  return errors;
}

/**
 * Friction check (blocking). Per v3 spec §13.
 * Validates friction is an integer 1-5.
 */
export function validateFriction(
  activities: readonly Activity[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const activity of activities) {
    for (const variant of activity.variants) {
      const f = variant.friction;
      if (!Number.isInteger(f) || f < 1 || f > 5) {
        errors.push({
          activityId: activity.activity_id,
          variantId: variant.variant_id,
          field: 'friction',
          message: `Invalid friction: ${f}. Must be an integer 1-5`,
        });
      }
    }
  }

  return errors;
}

/**
 * Exertion check (blocking). Per v3 spec §13.
 * Validates exertion is an integer 1-5.
 */
export function validateExertion(
  activities: readonly Activity[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const activity of activities) {
    for (const variant of activity.variants) {
      const e = variant.exertion;
      if (!Number.isInteger(e) || e < 1 || e > 5) {
        errors.push({
          activityId: activity.activity_id,
          variantId: variant.variant_id,
          field: 'exertion',
          message: `Invalid exertion: ${e}. Must be an integer 1-5`,
        });
      }
    }
  }

  return errors;
}

/**
 * Magnitude check (blocking). Per v3 spec §13.
 * Validates magnitude is one of small, medium, big.
 */
export function validateMagnitude(
  activities: readonly Activity[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const activity of activities) {
    for (const variant of activity.variants) {
      if (!VALID_MAGNITUDES.includes(variant.magnitude)) {
        errors.push({
          activityId: activity.activity_id,
          variantId: variant.variant_id,
          field: 'magnitude',
          message: `Invalid magnitude: "${variant.magnitude}". Must be one of: ${VALID_MAGNITUDES.join(', ')}`,
        });
      }
    }
  }

  return errors;
}

/**
 * Who_with check (blocking). Per v3 spec §13.
 * Validates who_with is non-empty and all values are valid.
 */
export function validateWhoWith(
  activities: readonly Activity[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const activity of activities) {
    for (const variant of activity.variants) {
      if (variant.who_with.length === 0) {
        errors.push({
          activityId: activity.activity_id,
          variantId: variant.variant_id,
          field: 'who_with',
          message: 'who_with must contain at least one value',
        });
      }

      for (const value of variant.who_with) {
        if (!VALID_WHO_WITH.includes(value)) {
          errors.push({
            activityId: activity.activity_id,
            variantId: variant.variant_id,
            field: 'who_with',
            message: `Invalid who_with value: "${value}". Must be one of: ${VALID_WHO_WITH.join(', ')}`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Pitch and instruction check (blocking). Per v3 spec §13.
 * Validates pitch and instruction are non-empty strings.
 */
export function validatePitchAndInstruction(
  activities: readonly Activity[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const activity of activities) {
    for (const variant of activity.variants) {
      if (!variant.pitch || variant.pitch.trim().length === 0) {
        errors.push({
          activityId: activity.activity_id,
          variantId: variant.variant_id,
          field: 'pitch',
          message: 'pitch must be a non-empty string',
        });
      }

      if (!variant.instruction || variant.instruction.trim().length === 0) {
        errors.push({
          activityId: activity.activity_id,
          variantId: variant.variant_id,
          field: 'instruction',
          message: 'instruction must be a non-empty string',
        });
      }
    }
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/* Warning checks (non-blocking)                                      */
/* ------------------------------------------------------------------ */

/**
 * Multi-protocol activity check (warning). Per v3 spec §9.
 * Warns when an activity's variants span >2 distinct protocols (rare exception).
 * Blocks at 4+ distinct protocols (error).
 */
export function checkMultiProtocolActivities(
  activities: readonly Activity[],
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const activity of activities) {
    const protocols = new Set(activity.variants.map((v) => v.protocol));
    const count = protocols.size;

    if (count >= 4) {
      errors.push({
        activityId: activity.activity_id,
        field: 'variants',
        message: `Activity has ${count} distinct protocols (${[...protocols].join(', ')}). Maximum is 3 (and 3 is rare)`,
      });
    } else if (count === 3) {
      warnings.push({
        message: `Activity ${activity.activity_id} has 3 distinct protocols (${[...protocols].join(', ')}). This is allowed but rare per spec §9`,
      });
    }
  }

  return { errors, warnings };
}

/* ------------------------------------------------------------------ */
/* Combined validation                                                */
/* ------------------------------------------------------------------ */

/**
 * Run all validation checks and return combined results.
 * Blocking checks contribute to errors; non-blocking checks to warnings.
 */
export function validateInventory(
  activities: readonly Activity[],
): ValidationResult {
  const multiProtocolResult = checkMultiProtocolActivities(activities);

  const errors: ValidationError[] = [
    ...validateDirectionTags(activities),
    ...validateDirectionsLength(activities),
    ...validateInterestDomains(activities),
    ...validateNoveltyIndex(activities),
    ...validateProtocol(activities),
    ...validateFriction(activities),
    ...validateExertion(activities),
    ...validateMagnitude(activities),
    ...validateWhoWith(activities),
    ...validatePitchAndInstruction(activities),
    ...multiProtocolResult.errors,
  ];

  const warnings: ValidationWarning[] = [...multiProtocolResult.warnings];

  return { errors, warnings };
}
