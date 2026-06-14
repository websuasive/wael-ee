// cross_cutting assembly — three cross_cutting fields
// Q5 produces TWO fields (recent_life_shape_change + replacement_structure_exists) from one answer
// via interpretQ5 pair helper that REUSES mapRecentLifeShapeChange
// recent_reaching REUSES mapRecentReaching
// All three keys assembled in one object literal with exact-shape check

import type { InputMap } from '@/engine/types';
import type { QuestionnaireAnswers } from './answers';
import { mapRecentLifeShapeChange, mapRecentReaching } from './answer-maps';

// Q5 interpretation — one answer produces recent_life_shape_change + replacement_structure_exists as a pair
// This single helper ensures the two outputs stay paired (mispairing is silent)
// recent_life_shape_change REUSES mapRecentLifeShapeChange (imported from answer-maps)
function interpretQ5(letter: 'a' | 'b' | 'c'): {
  recent_life_shape_change: InputMap['cross_cutting']['recent_life_shape_change'];
  replacement_structure_exists: InputMap['cross_cutting']['replacement_structure_exists'];
} {
  const recent_life_shape_change = mapRecentLifeShapeChange(letter);
  let replacement_structure_exists: InputMap['cross_cutting']['replacement_structure_exists'];
  if (letter === 'a') {
    replacement_structure_exists = 'no';
  } else if (letter === 'b') {
    replacement_structure_exists = 'yes';
  } else {
    replacement_structure_exists = 'no';
  }
  return { recent_life_shape_change, replacement_structure_exists };
}

export function buildCrossCutting(
  answers: QuestionnaireAnswers
): InputMap['cross_cutting'] {
  // Interpret Q5 once — both recent_life_shape_change and replacement_structure_exists come from this
  const q5Pair = interpretQ5(answers.q5_recent_life_shape_change);

  return {
    recent_life_shape_change: q5Pair.recent_life_shape_change,
    replacement_structure_exists: q5Pair.replacement_structure_exists,
    recent_reaching: mapRecentReaching(answers.q29_recent_reaching),
  };
}
