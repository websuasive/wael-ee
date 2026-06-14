import { describe, it, expect } from 'vitest';
import { buildWeekShape } from '@/assembler/week-shape';
import { makeAnswers } from '@/tests/helpers/make-answers';
import type { WeekShapeFlags } from '@/engine/types';

describe('buildWeekShape', () => {
  describe('TRANSPOSITION pins (letter→flag correspondence)', () => {
    it('ticking only a -> weekly_activity=true, all other eight false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['a'] });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(true);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(false);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(false);
      expect(result.work_dominates).toBe(false);
      expect(result.weekends_consumed).toBe(false);
      expect(result.varied_week).toBe(false);
    });

    it('ticking only b -> sees_people=true, all other eight false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['b'] });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(false);
      expect(result.sees_people).toBe(true);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(false);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(false);
      expect(result.work_dominates).toBe(false);
      expect(result.weekends_consumed).toBe(false);
      expect(result.varied_week).toBe(false);
    });

    it('ticking only c -> makes_things=true, all other eight false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['c'] });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(false);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(true);
      expect(result.active_body).toBe(false);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(false);
      expect(result.work_dominates).toBe(false);
      expect(result.weekends_consumed).toBe(false);
      expect(result.varied_week).toBe(false);
    });

    it('ticking only d -> active_body=true, all other eight false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['d'] });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(false);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(true);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(false);
      expect(result.work_dominates).toBe(false);
      expect(result.weekends_consumed).toBe(false);
      expect(result.varied_week).toBe(false);
    });

    it('ticking only e -> belongs_to_group=true, all other eight false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['e'] });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(false);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(false);
      expect(result.belongs_to_group).toBe(true);
      expect(result.solo_practice).toBe(false);
      expect(result.work_dominates).toBe(false);
      expect(result.weekends_consumed).toBe(false);
      expect(result.varied_week).toBe(false);
    });

    it('ticking only f -> solo_practice=true, all other eight false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['f'] });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(false);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(false);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(true);
      expect(result.work_dominates).toBe(false);
      expect(result.weekends_consumed).toBe(false);
      expect(result.varied_week).toBe(false);
    });

    it('ticking only g -> work_dominates=true, all other eight false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['g'] });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(false);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(false);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(false);
      expect(result.work_dominates).toBe(true);
      expect(result.weekends_consumed).toBe(false);
      expect(result.varied_week).toBe(false);
    });

    it('ticking only h -> weekends_consumed=true, all other eight false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['h'] });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(false);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(false);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(false);
      expect(result.work_dominates).toBe(false);
      expect(result.weekends_consumed).toBe(true);
      expect(result.varied_week).toBe(false);
    });

    it('ticking only i -> varied_week=true, all other eight false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['i'] });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(false);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(false);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(false);
      expect(result.work_dominates).toBe(false);
      expect(result.weekends_consumed).toBe(false);
      expect(result.varied_week).toBe(true);
    });
  });

  describe('ALL-PRESENT / NO-SILENT-FALSE pins', () => {
    it('empty tick-set -> ALL NINE flags present and false', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: [] });
      const result = buildWeekShape(answers);
      const keys = Object.keys(result) as Array<keyof WeekShapeFlags>;
      expect(keys).toHaveLength(9);
      expect(keys).toContain('work_dominates');
      expect(keys).toContain('weekends_consumed');
      expect(keys).toContain('weekly_activity');
      expect(keys).toContain('sees_people');
      expect(keys).toContain('makes_things');
      expect(keys).toContain('active_body');
      expect(keys).toContain('belongs_to_group');
      expect(keys).toContain('solo_practice');
      expect(keys).toContain('varied_week');
      expect(result.work_dominates).toBe(false);
      expect(result.weekends_consumed).toBe(false);
      expect(result.weekly_activity).toBe(false);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(false);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(false);
      expect(result.varied_week).toBe(false);
    });

    it('full tick-set (all nine ticked) -> all nine true', () => {
      const answers = makeAnswers({
        q1_week_shape_ticked: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
      });
      const result = buildWeekShape(answers);
      expect(result.weekly_activity).toBe(true);
      expect(result.sees_people).toBe(true);
      expect(result.makes_things).toBe(true);
      expect(result.active_body).toBe(true);
      expect(result.belongs_to_group).toBe(true);
      expect(result.solo_practice).toBe(true);
      expect(result.work_dominates).toBe(true);
      expect(result.weekends_consumed).toBe(true);
      expect(result.varied_week).toBe(true);
    });

    it('mixed set (a, d, g) -> exactly those three true, other six false, all nine keys present', () => {
      const answers = makeAnswers({ q1_week_shape_ticked: ['a', 'd', 'g'] });
      const result = buildWeekShape(answers);
      const keys = Object.keys(result) as Array<keyof WeekShapeFlags>;
      expect(keys).toHaveLength(9);
      expect(result.weekly_activity).toBe(true);
      expect(result.sees_people).toBe(false);
      expect(result.makes_things).toBe(false);
      expect(result.active_body).toBe(true);
      expect(result.belongs_to_group).toBe(false);
      expect(result.solo_practice).toBe(false);
      expect(result.work_dominates).toBe(true);
      expect(result.weekends_consumed).toBe(false);
      expect(result.varied_week).toBe(false);
    });
  });
});
