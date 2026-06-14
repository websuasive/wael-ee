// cross_direction assembly — composes the twelve cross_direction fields
// direction_chosen projects from the shared interpretQ10 interpretation (no raw q10 re-read)
// All twelve keys present unconditionally in one object literal

import type { InputMap } from '@/engine/types';
import type { QuestionnaireAnswers } from './answers';
import { interpretQ10 } from './q10-interpretation';
import {
  mapCapacityStrain,
  mapLifeShapeDuration,
  mapSocialityDefault,
  mapPaidWorkRelationship,
  mapPrimaryLoad,
  combinePsychologicalFilteringProbes,
  deriveRoleConsolidation,
  mapAttentionPattern,
  mapRelationalPresence,
} from './answer-maps';
import { buildWeekShape } from './week-shape';
import { deriveLifeStage } from './life-stage';

export function buildCrossDirection(
  answers: QuestionnaireAnswers
): InputMap['cross_direction'] {
  // Interpret Q10 once — both would_reach_for and direction_chosen project from this
  const q10Interpretation = interpretQ10(answers.q10_direction_chosen);

  // Project direction_chosen from the interpretation
  const direction_chosen: InputMap['cross_direction']['direction_chosen'] =
    q10Interpretation.kind === 'direction'
      ? q10Interpretation.direction
      : q10Interpretation.kind === 'rest'
        ? 'rest'
        : 'none';

  // Interpret Q10b (retrospective) using the same mapping as Q10a
  const q10bInterpretation = interpretQ10(answers.q10b_retrospective);
  const reach_retrospective: InputMap['cross_direction']['reach_retrospective'] =
    q10bInterpretation.kind === 'direction'
      ? q10bInterpretation.direction
      : q10bInterpretation.kind === 'rest'
        ? 'rest'
        : 'none';

  // Interpret Q10c (counterfactual) using the same mapping as Q10a
  const q10cInterpretation = interpretQ10(answers.q10c_counterfactual);
  const reach_counterfactual: InputMap['cross_direction']['reach_counterfactual'] =
    q10cInterpretation.kind === 'direction'
      ? q10cInterpretation.direction
      : q10cInterpretation.kind === 'rest'
        ? 'rest'
        : 'none';

  return {
    direction_chosen,
    reach_retrospective,
    reach_counterfactual,
    capacity_strain: mapCapacityStrain(answers.q6_capacity_strain),
    life_shape_duration: mapLifeShapeDuration(answers.q4_life_shape_duration),
    week_shape: buildWeekShape(answers),
    life_stage: deriveLifeStage(answers),
    sociality_default: mapSocialityDefault(answers.q7_sociality_default),
    paid_work_relationship: mapPaidWorkRelationship(answers.q3_paid_work_relationship),
    primary_load: mapPrimaryLoad(answers.q2_primary_load),
    psychological_filtering: combinePsychologicalFilteringProbes(
      answers.q11a_spare_resource,
      answers.q11b_footprint,
      answers.q11c_small_wants
    ),
    role_consolidation: deriveRoleConsolidation(answers),
    attention_pattern: mapAttentionPattern(answers.q32_attention_pattern),
    relational_presence: mapRelationalPresence(answers.q33_relational_presence),
  };
}
