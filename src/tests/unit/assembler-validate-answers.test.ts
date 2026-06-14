import { describe, it, expect } from 'vitest';
import { validateQuestionnaireAnswers } from '@/assembler/validate-answers';
import { makeAnswers } from '@/tests/helpers/make-answers';
import type { QuestionnaireAnswers } from '@/assembler/answers';

describe('validateQuestionnaireAnswers', () => {
  describe('POSITIVE — known-valid instances pass', () => {
    it('makeAnswers() (canonicalDefaults) -> ok:true, value deep-equals input', () => {
      const answers = makeAnswers();
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual(answers);
    });

    it('valid variation: different valid letters -> ok:true', () => {
      const answers = makeAnswers({
        q2_primary_load: 'a',
        q3_paid_work_relationship: 'g',
        q4_life_shape_duration: 'c',
        q5_recent_life_shape_change: 'b',
        q6_capacity_strain: 'c',
        q7_sociality_default: 'a',
        q11a_spare_resource: 'c',
        q11b_footprint: 'c',
        q11c_small_wants: 'c',
        q25_energy_availability: 'e',
        q27_body_capacity: 'd',
        q29_recent_reaching: 'a',
        q30_permission: 'd',
        q31_role_consolidation: 'c',
        q32_attention_pattern: 'c',
        q33_relational_presence: 'a',
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual(answers);
    });

    it('valid variation: valid domain numbers (0-100) -> ok:true', () => {
      const answers = makeAnswers({
        domain_current_state: {
          time_as_yours: 0,
          energy_as_resource: 100,
          felt_aliveness: 50,
          body_physical_aliveness: 25,
          curiosity: 75,
          making: 10,
          conversation_depth: 90,
          being_known: 30,
          friendship: 60,
          intimacy: 40,
          mattering: 80,
          spiritual: 20,
        },
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual(answers);
    });

    it('valid variation: q34 named with 1-3 items -> ok:true', () => {
      const answers = makeAnswers({
        q34_self_report: { kind: 'named', items: ['more_time_to_myself'] },
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual(answers);
    });

    it('valid variation: q34 nothing_really -> ok:true', () => {
      const answers = makeAnswers({
        q34_self_report: { kind: 'nothing_really' },
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toEqual(answers);
    });
  });

  describe('NEGATIVE — missing field', () => {
    it('omit q10_direction_chosen -> ok:false, error path points to it', () => {
      const answers = makeAnswers();
      const { q10_direction_chosen: _omitted, ...partial } = answers;
      const result = validateQuestionnaireAnswers(partial);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('missing_field');
      expect(result.errors[0]!.path).toBe('q10_direction_chosen');
    });
  });

  describe('NEGATIVE — extra/unknown field', () => {
    it('add a stray key -> ok:false, unknown_field error', () => {
      const answers = makeAnswers();
      const withExtra = { ...answers, stray_field: 'value' } as unknown;
      const result = validateQuestionnaireAnswers(withExtra);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('unknown_field');
      expect(result.errors[0]!.path).toBe('stray_field');
    });
  });

  describe('NEGATIVE — bad letter', () => {
    it('q2_primary_load = "z" (not a-d) -> ok:false, invalid_categorical error', () => {
      const answers = makeAnswers({ q2_primary_load: 'z' as 'a' });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('invalid_categorical');
      expect(result.errors[0]!.path).toBe('q2_primary_load');
    });
  });

  describe('NEGATIVE — number out of range', () => {
    it('domain_current_state.mattering = 150 -> ok:false, out_of_range error', () => {
      const answers = makeAnswers({
        domain_current_state: {
          time_as_yours: 50,
          energy_as_resource: 50,
          felt_aliveness: 50,
          body_physical_aliveness: 50,
          curiosity: 50,
          making: 50,
          conversation_depth: 50,
          being_known: 50,
          friendship: 50,
          intimacy: 50,
          mattering: 150,
          spiritual: 50,
        },
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('out_of_range');
      expect(result.errors[0]!.path).toBe('domain_current_state.mattering');
    });

    it('domain_current_state.mattering = -5 -> ok:false, out_of_range error', () => {
      const answers = makeAnswers({
        domain_current_state: {
          time_as_yours: 50,
          energy_as_resource: 50,
          felt_aliveness: 50,
          body_physical_aliveness: 50,
          curiosity: 50,
          making: 50,
          conversation_depth: 50,
          being_known: 50,
          friendship: 50,
          intimacy: 50,
          mattering: -5,
          spiritual: 50,
        },
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('out_of_range');
      expect(result.errors[0]!.path).toBe('domain_current_state.mattering');
    });
  });

  describe('NEGATIVE — wrong type', () => {
    it('letter-union field given a number -> ok:false, invalid_type error', () => {
      const answers = makeAnswers({ q2_primary_load: 42 as unknown as 'a' });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('invalid_type');
      expect(result.errors[0]!.path).toBe('q2_primary_load');
    });

    it('number field given a string -> ok:false, invalid_type error', () => {
      const answers = makeAnswers({
        domain_current_state: {
          time_as_yours: 50,
          energy_as_resource: 50,
          felt_aliveness: 50,
          body_physical_aliveness: 50,
          curiosity: 50,
          making: 50,
          conversation_depth: 50,
          being_known: 50,
          friendship: 50,
          intimacy: 50,
          mattering: 'not a number' as unknown as number,
          spiritual: 50,
        },
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('invalid_type');
      expect(result.errors[0]!.path).toBe('domain_current_state.mattering');
    });
  });

  describe('NEGATIVE — record key missing', () => {
    it('domain_current_state missing one DomainKey -> ok:false', () => {
      const answers = makeAnswers();
      const { domain_current_state: { mattering: _omitted, ...partialDomains }, ...rest } = answers;
      const result = validateQuestionnaireAnswers({
        ...rest,
        domain_current_state: partialDomains as QuestionnaireAnswers['domain_current_state'],
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('missing_field');
      expect(result.errors[0]!.path).toBe('domain_current_state.mattering');
    });
  });

  describe('NEGATIVE — record key extra', () => {
    it('domain_current_state with a non-DomainKey key -> ok:false', () => {
      const answers = makeAnswers({
        domain_current_state: {
          time_as_yours: 50,
          energy_as_resource: 50,
          felt_aliveness: 50,
          body_physical_aliveness: 50,
          curiosity: 50,
          making: 50,
          conversation_depth: 50,
          being_known: 50,
          friendship: 50,
          intimacy: 50,
          mattering: 50,
          spiritual: 50,
          not_a_domain: 50,
        } as QuestionnaireAnswers['domain_current_state'],
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('unknown_field');
      expect(result.errors[0]!.path).toBe('domain_current_state.not_a_domain');
    });
  });

  describe('NEGATIVE — array bad member', () => {
    it('q8_past_presence_ticked = ["not_a_direction"] -> ok:false', () => {
      const answers = makeAnswers({
        q8_past_presence_ticked: ['not_a_direction' as unknown as 'contributor'],
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('invalid_categorical');
      expect(result.errors[0]!.path).toBe('q8_past_presence_ticked[0]');
    });
  });

  describe('NEGATIVE — tagged-union bad kind', () => {
    it('q34_self_report = {kind:"whatever"} -> ok:false', () => {
      const answers = makeAnswers({
        q34_self_report: { kind: 'whatever' } as unknown as QuestionnaireAnswers['q34_self_report'],
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('invalid_categorical');
      expect(result.errors[0]!.path).toBe('q34_self_report.kind');
    });
  });

  describe('NEGATIVE — tagged-union cap exceeded', () => {
    it('q34_self_report = {kind:"named", items:[four items]} -> ok:false', () => {
      const answers = makeAnswers({
        q34_self_report: {
          kind: 'named',
          items: ['more_time_to_myself', 'more_friends', 'something_just_for_me', 'more_energy'],
        },
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('self_report_cap_exceeded');
      expect(result.errors[0]!.path).toBe('q34_self_report.items');
    });
  });

  describe('NEGATIVE — tagged-union bad item', () => {
    it('q34 named with an item not in NamedAbsenceId -> ok:false', () => {
      const answers = makeAnswers({
        q34_self_report: {
          kind: 'named',
          items: ['not_a_valid_item' as unknown as 'more_time_to_myself'],
        },
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('invalid_categorical');
      expect(result.errors[0]!.path).toBe('q34_self_report.items[0]');
    });
  });

  describe('NEGATIVE — all-errors-collected', () => {
    it('input with TWO independent faults -> ok:false with BOTH errors present', () => {
      const answers = makeAnswers({
        q2_primary_load: 'z' as 'a',
        domain_current_state: {
          time_as_yours: 50,
          energy_as_resource: 50,
          felt_aliveness: 50,
          body_physical_aliveness: 50,
          curiosity: 50,
          making: 50,
          conversation_depth: 50,
          being_known: 50,
          friendship: 50,
          intimacy: 50,
          mattering: 150,
          spiritual: 50,
        },
      });
      const result = validateQuestionnaireAnswers(answers);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      const paths = result.errors.map((e: { path: string }) => e.path);
      expect(paths).toContain('q2_primary_load');
      expect(paths).toContain('domain_current_state.mattering');
    });
  });

  describe('NEGATIVE — never throws', () => {
    it('validateQuestionnaireAnswers(null) -> ok:false, does not throw', () => {
      expect(() => validateQuestionnaireAnswers(null)).not.toThrow();
      const result = validateQuestionnaireAnswers(null);
      expect(result.ok).toBe(false);
    });

    it('validateQuestionnaireAnswers(undefined) -> ok:false, does not throw', () => {
      expect(() => validateQuestionnaireAnswers(undefined)).not.toThrow();
      const result = validateQuestionnaireAnswers(undefined);
      expect(result.ok).toBe(false);
    });

    it('validateQuestionnaireAnswers(42) -> ok:false, does not throw', () => {
      expect(() => validateQuestionnaireAnswers(42)).not.toThrow();
      const result = validateQuestionnaireAnswers(42);
      expect(result.ok).toBe(false);
    });

    it('validateQuestionnaireAnswers("string") -> ok:false, does not throw', () => {
      expect(() => validateQuestionnaireAnswers('string')).not.toThrow();
      const result = validateQuestionnaireAnswers('string');
      expect(result.ok).toBe(false);
    });

    it('validateQuestionnaireAnswers([]) -> ok:false, does not throw', () => {
      expect(() => validateQuestionnaireAnswers([])).not.toThrow();
      const result = validateQuestionnaireAnswers([]);
      expect(result.ok).toBe(false);
    });
  });
});
