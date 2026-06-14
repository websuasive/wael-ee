import { describe, it, expect } from 'vitest';
import { buildCrossDirection } from '@/assembler/cross-direction';
import { makeAnswers } from '@/tests/helpers/make-answers';
import type { InputMap } from '@/engine/types';

// World-B note: full validateInputMap check scheduled for the emit block, where all blocks are real; not stubbed here.

describe('buildCrossDirection', () => {
  describe('THE STRUCTURAL PRIZE CHECK (drift-catcher)', () => {
    it('key set equals the engine fourteen-key set EXACTLY — no missing, no extra', () => {
      const answers = makeAnswers();
      const result = buildCrossDirection(answers);

      const engineKeys = [
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
        'reach_retrospective',
        'reach_counterfactual',
      ] as const;

      const resultKeys = Object.keys(result) as Array<keyof InputMap['cross_direction']>;

      // Every engine key is present (no missing)
      for (const key of engineKeys) {
        expect(resultKeys).toContain(key);
      }

      // Composed key count is 14
      expect(resultKeys).toHaveLength(14);

      // No composed key is outside the fourteen (no extra)
      for (const key of resultKeys) {
        expect(engineKeys).toContain(key);
      }
    });
  });

  describe('THE THREE-BRANCH direction_chosen PIN (rule-4 agreement with would_reach_for)', () => {
    it('q10_direction_chosen = direction -> cross_direction.direction_chosen === that direction', () => {
      const answers = makeAnswers({ q10_direction_chosen: 'contributor' });
      const result = buildCrossDirection(answers);
      expect(result.direction_chosen).toBe('contributor');
    });

    it('q10_direction_chosen = rest -> cross_direction.direction_chosen === rest', () => {
      const answers = makeAnswers({ q10_direction_chosen: 'rest' });
      const result = buildCrossDirection(answers);
      expect(result.direction_chosen).toBe('rest');
    });

    it('q10_direction_chosen = none -> cross_direction.direction_chosen === none', () => {
      const answers = makeAnswers({ q10_direction_chosen: 'none' });
      const result = buildCrossDirection(answers);
      expect(result.direction_chosen).toBe('none');
    });
  });

  describe('COMPOSITION CORRECTNESS', () => {
    it('fully-specified answers -> each field composes to its predicted value', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'rest',
        q6_capacity_strain: 'c',
        q4_life_shape_duration: 'c',
        q1_week_shape_ticked: ['a', 'd'],
        q2_primary_load: 'a',
        q3_paid_work_relationship: 'a',
        q7_sociality_default: 'a',
        q11a_spare_resource: 'a',
        q11b_footprint: 'a',
        q11c_small_wants: 'a',
        q31_role_consolidation: 'a',
        q32_attention_pattern: 'a',
        q33_relational_presence: 'a',
      });

      const result = buildCrossDirection(answers);

      // direction_chosen from interpretQ10
      expect(result.direction_chosen).toBe('rest');

      // capacity_strain from mapCapacityStrain
      expect(result.capacity_strain).toBe('yes');

      // life_shape_duration from mapLifeShapeDuration
      expect(result.life_shape_duration).toBe('long');

      // week_shape from buildWeekShape
      expect(result.week_shape.weekly_activity).toBe(true);
      expect(result.week_shape.sees_people).toBe(false);
      expect(result.week_shape.makes_things).toBe(false);
      expect(result.week_shape.active_body).toBe(true);
      expect(result.week_shape.belongs_to_group).toBe(false);
      expect(result.week_shape.solo_practice).toBe(false);
      expect(result.week_shape.work_dominates).toBe(false);
      expect(result.week_shape.weekends_consumed).toBe(false);
      expect(result.week_shape.varied_week).toBe(false);

      // life_stage from deriveLifeStage
      expect(['building', 'consolidating', 're_evaluating', 'transitioning', 'settled', 'drifting', 'enduring']).toContain(result.life_stage);

      // single-enum fields from their maps
      expect(result.primary_load).toBe('paid_work');
      expect(result.paid_work_relationship).toBe('functional');
      expect(result.sociality_default).toBe('solitary_by_default');
      expect(result.psychological_filtering).toBe('does_not_filter');
      expect(result.role_consolidation).toBe('role_consolidated');
      expect(result.attention_pattern).toBe('engaged');
      expect(result.relational_presence).toBe('present');
    });
  });
});
