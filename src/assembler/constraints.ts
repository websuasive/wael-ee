// constraints assembly — five constraints fields
// Two PROVISIONAL band maps (params), one pass-through, one Q30 pair (two fields from one answer)
// All five keys assembled in one object literal with exact-shape check

import type { InputMap } from '@/engine/types';
import type { QuestionnaireAnswers } from './answers';
import { ENERGY_AVAILABILITY_BANDS, BODY_CAPACITY_BANDS, PERMISSION_LADDER } from './params';

// Q30 interpretation — one answer produces permission (number) + permission_sub_shape (enum) as a pair
// This single helper ensures the two outputs stay paired (mispairing is silent)
function interpretQ30(letter: 'a' | 'b' | 'c' | 'd' | 'e'): {
  permission: number;
  permission_sub_shape: InputMap['constraints']['permission_sub_shape'];
} {
  const permission = PERMISSION_LADDER[letter];
  let permission_sub_shape: InputMap['constraints']['permission_sub_shape'];
  if (letter === 'a') {
    permission_sub_shape = 'present';
  } else if (letter === 'b') {
    permission_sub_shape = 'act_block';
  } else if (letter === 'c') {
    permission_sub_shape = 'say_block';
  } else if (letter === 'd' || letter === 'e') {
    permission_sub_shape = 'want_block';
  } else {
    const _exhaustive: never = letter;
    return _exhaustive;
  }
  return { permission, permission_sub_shape };
}

// Energy availability band map (Q25)
function mapEnergyAvailability(letter: 'a' | 'b' | 'c' | 'd' | 'e'): number {
  return ENERGY_AVAILABILITY_BANDS[letter];
}

// Body capacity band map (Q27)
function mapBodyCapacity(letter: 'a' | 'b' | 'c' | 'd'): number {
  return BODY_CAPACITY_BANDS[letter];
}

export function buildConstraints(
  answers: QuestionnaireAnswers
): InputMap['constraints'] {
  // Interpret Q30 once — both permission and permission_sub_shape come from this
  const q30Pair = interpretQ30(answers.q30_permission);

  return {
    energy_availability: mapEnergyAvailability(answers.q25_energy_availability),
    time_availability: answers.q26_time_availability, // pass-through
    body_capacity: mapBodyCapacity(answers.q27_body_capacity),
    permission: q30Pair.permission,
    permission_sub_shape: q30Pair.permission_sub_shape,
  };
}
