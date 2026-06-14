// Letter-to-enum mapping helpers for cross-cutting questionnaire answers.
// These are pure functions that translate raw response letters to engine enum values.
// Used by life_stage derivation and reused by the full cross-field mapping pass.

import type { PrimaryLoadValue, PaidWorkRelationshipValue, SocialityValue } from '@/engine/types';
import type { QuestionnaireAnswers, DirectionKey } from './answers';

export function mapLifeShapeDuration(letter: 'a' | 'b' | 'c'): 'recent' | 'sustained' | 'long' {
  switch (letter) {
    case 'a':
      return 'recent';
    case 'b':
      return 'sustained';
    case 'c':
      return 'long';
  }
}

export function mapRecentLifeShapeChange(letter: 'a' | 'b' | 'c'): 'yes' | 'no' {
  switch (letter) {
    case 'a':
      return 'no';
    case 'b':
      return 'yes';
    case 'c':
      return 'yes';
  }
}

export function mapRecentReaching(
  letter: 'a' | 'b' | 'c' | 'd'
): 'recent_and_awkward' | 'mid_stream' | 'long_established' | 'no_current_reaching' {
  switch (letter) {
    case 'a':
      return 'recent_and_awkward';
    case 'b':
      return 'mid_stream';
    case 'c':
      return 'long_established';
    case 'd':
      return 'no_current_reaching';
  }
}

export function mapPrimaryLoad(letter: 'a' | 'b' | 'c' | 'd'): PrimaryLoadValue {
  switch (letter) {
    case 'a':
      return 'paid_work';
    case 'b':
      return 'caregiving';
    case 'c':
      return 'household_admin';
    case 'd':
      return 'none';
  }
}

export function mapPaidWorkRelationship(
  letter: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'
): PaidWorkRelationshipValue {
  switch (letter) {
    case 'a':
      return 'functional';
    case 'b':
      return 'consuming';
    case 'c':
      return 'defining';
    case 'd':
      return 'between';
    case 'e':
      return 'chosen';
    case 'f':
      return 'peripheral';
    case 'g':
      // g (retired) maps to peripheral, not between — engine has no 'retired' value
      return 'peripheral';
  }
}

export function mapSocialityDefault(letter: 'a' | 'b' | 'c'): SocialityValue {
  switch (letter) {
    case 'a':
      return 'solitary_by_default';
    case 'b':
      return 'social_by_default';
    case 'c':
      return 'balanced';
  }
}

export function mapPsychologicalFilteringProbe(letter: 'a' | 'b' | 'c'): 'does_not_filter' | 'filters_some' | 'filters_pervasively' {
  switch (letter) {
    case 'a':
      return 'does_not_filter';
    case 'b':
      return 'filters_some';
    case 'c':
      return 'filters_pervasively';
  }
}

export function combinePsychologicalFilteringProbes(
  spareResource: 'a' | 'b' | 'c',
  footprint: 'a' | 'b' | 'c',
  smallWants: 'a' | 'b' | 'c'
): 'does_not_filter' | 'filters_some' | 'filters_pervasively' {
  const spareReading = mapPsychologicalFilteringProbe(spareResource);
  const footprintReading = mapPsychologicalFilteringProbe(footprint);
  const smallWantsReading = mapPsychologicalFilteringProbe(smallWants);

  // Rule 1: Probe 2 (footprint) == 'c' is decisive on its own
  if (footprint === 'c') {
    return 'filters_pervasively';
  }

  // Rule 2: Majority of the three per-probe readings
  let doesNotFilterCount = 0;
  let filtersSomeCount = 0;
  let filtersPervasivelyCount = 0;

  if (spareReading === 'does_not_filter') doesNotFilterCount++;
  else if (spareReading === 'filters_some') filtersSomeCount++;
  else filtersPervasivelyCount++;

  if (footprintReading === 'does_not_filter') doesNotFilterCount++;
  else if (footprintReading === 'filters_some') filtersSomeCount++;
  else filtersPervasivelyCount++;

  if (smallWantsReading === 'does_not_filter') doesNotFilterCount++;
  else if (smallWantsReading === 'filters_some') filtersSomeCount++;
  else filtersPervasivelyCount++;

  if (doesNotFilterCount >= 2) {
    return 'does_not_filter';
  }
  if (filtersPervasivelyCount >= 2) {
    return 'filters_pervasively';
  }
  if (filtersSomeCount >= 2) {
    return 'filters_some';
  }

  // Rule 3: No majority / tie / three-way -> conservative middle
  return 'filters_some';
}

export function deriveRoleConsolidation(
  answers: QuestionnaireAnswers
): 'holds_other_selves' | 'role_inflected' | 'role_consolidated' {
  const ACTIVITY_DIRECTION_THRESHOLD = 2; // provisional calibration, tune with real data

  let activityCount = 0;
  const cardA = answers.per_direction_card_a;
  for (const dir in cardA) {
    if (cardA[dir as DirectionKey] === 'c' || cardA[dir as DirectionKey] === 'd') {
      activityCount++;
    }
  }
  const activityPresent = activityCount >= ACTIVITY_DIRECTION_THRESHOLD;

  const q31 = answers.q31_role_consolidation;

  if (q31 === 'c') {
    return 'holds_other_selves';
  }
  if (q31 === 'b') {
    return 'role_inflected';
  }
  if (q31 === 'a') {
    if (activityPresent) {
      return 'holds_other_selves';
    } else {
      return 'role_consolidated';
    }
  }

  // TypeScript exhaustiveness check - should never reach here
  const _exhaustive: never = q31;
  return _exhaustive;
}

export function mapAttentionPattern(
  letter: 'a' | 'b' | 'c'
): 'engaged' | 'intermittent' | 'autopilot' {
  switch (letter) {
    case 'a':
      return 'engaged';
    case 'b':
      return 'intermittent';
    case 'c':
      return 'autopilot';
  }
}

export function mapRelationalPresence(
  letter: 'a' | 'b' | 'c' | 'd'
): 'present' | 'partial' | 'mostly_absent' | 'no_close_relationship' {
  switch (letter) {
    case 'a':
      return 'present';
    case 'b':
      return 'partial';
    case 'c':
      return 'mostly_absent';
    case 'd':
      return 'no_close_relationship';
  }
}

export function mapCapacityStrain(letter: 'a' | 'b' | 'c'): 'no' | 'yes' {
  switch (letter) {
    case 'a':
      return 'no';
    case 'b':
      return 'no';
    case 'c':
      return 'yes';
  }
}
