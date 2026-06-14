import { describe, it, expect } from 'vitest';
import { buildSelfReport } from '@/assembler/self-report';
import { makeAnswers } from '@/tests/helpers/make-answers';
import type { SelfReportItemId } from '@/engine/types';

describe('buildSelfReport', () => {
  describe('nothing_really kind', () => {
    it("q34 = { kind: 'nothing_really' } -> { named_absences: ['nothing_really'] }", () => {
      const answers = makeAnswers({ q34_self_report: { kind: 'nothing_really' } });
      const result = buildSelfReport(answers);
      expect(result.named_absences).toEqual(['nothing_really']);
    });
  });

  describe('named kind, items', () => {
    it("q34 = { kind: 'named', items: ['more_friends','more_energy'] } -> { named_absences: ['more_friends','more_energy'] }", () => {
      const answers = makeAnswers({
        q34_self_report: { kind: 'named', items: ['more_friends', 'more_energy'] },
      });
      const result = buildSelfReport(answers);
      expect(result.named_absences).toEqual(['more_friends', 'more_energy']);
    });
  });

  describe('EMPTY-NAMED (distinct from nothing_really)', () => {
    it("q34 = { kind: 'named', items: [] } -> { named_absences: [] } (valid empty, distinct from nothing_really)", () => {
      const answers = makeAnswers({ q34_self_report: { kind: 'named', items: [] } });
      const result = buildSelfReport(answers);
      expect(result.named_absences).toEqual([]);
      // Distinct from nothing_really -> ['nothing_really']
      expect(result.named_absences).not.toEqual(['nothing_really']);
    });
  });

  describe('CAP boundary, both sides', () => {
    it("3 items { kind:'named', items:[x,y,z] } -> maps through to those 3 (boundary, allowed)", () => {
      const answers = makeAnswers({
        q34_self_report: {
          kind: 'named',
          items: ['more_friends', 'more_energy', 'something_just_for_me'],
        },
      });
      const result = buildSelfReport(answers);
      expect(result.named_absences).toEqual([
        'more_friends',
        'more_energy',
        'something_just_for_me',
      ]);
    });

    it("4 items { kind:'named', items:[w,x,y,z] } -> THROWS with cap-naming message", () => {
      const answers = makeAnswers({
        q34_self_report: {
          kind: 'named',
          items: ['more_friends', 'more_energy', 'something_just_for_me', 'getting_back_in_shape'],
        },
      });
      expect(() => buildSelfReport(answers)).toThrow(/cap/i);
      expect(() => buildSelfReport(answers)).toThrow(/3/i);
    });
  });

  describe('STRUCTURAL', () => {
    it('self_report has exactly one key named_absences (no missing, no extra)', () => {
      const answers = makeAnswers();
      const result = buildSelfReport(answers);

      const resultKeys = Object.keys(result);
      expect(resultKeys).toHaveLength(1);
      expect(resultKeys).toContain('named_absences');
    });

    it('named_absences is an array of valid SelfReportItemId values', () => {
      const answers = makeAnswers({
        q34_self_report: { kind: 'named', items: ['more_friends', 'more_energy'] },
      });
      const result = buildSelfReport(answers);

      expect(Array.isArray(result.named_absences)).toBe(true);
      const validIds: SelfReportItemId[] = [
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
      ];
      for (const item of result.named_absences) {
        expect(validIds).toContain(item);
      }
    });
  });

  // EXCLUSIVITY is uncompilable: the tagged union shape makes nothing_really+named unconstructible.
  // { kind:'nothing_really', items:[...] } does not compile (items property doesn't exist on that branch).
  // nothing_really inside named items does not compile (NamedAbsenceId excludes 'nothing_really').
  // The type system enforces exclusivity; no runtime pin needed.
});
