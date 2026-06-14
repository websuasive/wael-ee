// week_shape builder — maps Q1 ticked letters to nine boolean flags
// Q1: "tick any of nine options" stored as a list of ticked letters
// The engine requires all nine flags present, boolean-typed, no extra keys

import type { WeekShapeFlags } from '@/engine/types';
import type { QuestionnaireAnswers } from '@/assembler/answers';

export function buildWeekShape(answers: QuestionnaireAnswers): WeekShapeFlags {
  const ticked = new Set(answers.q1_week_shape_ticked);

  return {
    work_dominates: ticked.has('g'),
    weekends_consumed: ticked.has('h'),
    weekly_activity: ticked.has('a'),
    sees_people: ticked.has('b'),
    makes_things: ticked.has('c'),
    active_body: ticked.has('d'),
    belongs_to_group: ticked.has('e'),
    solo_practice: ticked.has('f'),
    varied_week: ticked.has('i'),
  };
}
