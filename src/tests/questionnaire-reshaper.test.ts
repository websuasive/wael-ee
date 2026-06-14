// Golden-fixture test: validates that toAnswersObject() reshapes raw questionnaire answers
// into the QuestionnaireAnswers format that matches fixture answers.json.
// Hardened to use DEEP EQUALITY and assembler validation.

import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useQuestionnaireStore } from '../ui/stores/questionnaire';
import manifest from '../ui/questionnaire/data/manifest';
import { localStorageStub } from '../ui/questionnaire/persistence/localStorageStub';
import { validateQuestionnaireAnswers } from '../assembler/validate-answers';
import alanAnswers from '../../fixtures/alan/answers.json';
import danielAnswers from '../../fixtures/daniel/answers.json';
import geoffreyAnswers from '../../fixtures/geoffrey/answers.json';
import markAnswers from '../../fixtures/mark/answers.json';
import martinAnswers from '../../fixtures/martin/answers.json';
import paulAnswers from '../../fixtures/paul/answers.json';
import raymondAnswers from '../../fixtures/raymond/answers.json';

describe('toAnswersObject reshaper', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function loadFixtureIntoStore(fixture: any): void {
    const store = useQuestionnaireStore();
    store.init(manifest, localStorageStub, 'test-user');

    // Populate store with raw answers in questionnaire format
    // Q1 split: q1a gets a-f (contents), q1b gets g-i (load/shape)
    const q1a = fixture.q1_week_shape_ticked.filter((l: string) => ['a', 'b', 'c', 'd', 'e', 'f'].includes(l));
    const q1b = fixture.q1_week_shape_ticked.filter((l: string) => ['g', 'h', 'i'].includes(l));
    store.setAnswer('q1a', q1a);
    store.setAnswer('q1b', q1b);
    store.setAnswer('q2', fixture.q2_primary_load);
    store.setAnswer('q3', fixture.q3_paid_work_relationship);
    store.setAnswer('q4', fixture.q4_life_shape_duration);
    store.setAnswer('q5', fixture.q5_recent_life_shape_change);
    store.setAnswer('q6', fixture.q6_capacity_strain);
    store.setAnswer('q7', fixture.q7_sociality_default);
    store.setAnswer('q8', fixture.q8_past_presence_ticked);
    store.setAnswer('q9', fixture.q9_stopped_expecting_ticked);
    store.setAnswer('q10', fixture.q10_direction_chosen);
    store.setAnswer('q10b', fixture.q10b_retrospective);
    store.setAnswer('q10c', fixture.q10c_counterfactual);
    store.setAnswer('q11', fixture.q11_psychological_filtering);
    store.setAnswer('q24', fixture.past_presence_selection);
    store.setAnswer('q25', fixture.q25_energy_availability);
    store.setAnswer('q26', fixture.q26_time_availability);
    store.setAnswer('q27', fixture.q27_body_capacity);
    store.setAnswer('q29', fixture.q29_recent_reaching);
    store.setAnswer('q30', fixture.q30_permission);
    store.setAnswer('q31', fixture.q31_role_consolidation);
    store.setAnswer('q32', fixture.q32_attention_pattern);
    store.setAnswer('q33', fixture.q33_relational_presence);
    store.setAnswer('q11a_spare_resource', fixture.q11a_spare_resource);
    store.setAnswer('q11b_footprint', fixture.q11b_footprint);
    store.setAnswer('q11c_small_wants', fixture.q11c_small_wants);
    store.setAnswer('q_friendship_count', fixture.q_friendship_count);
    store.setAnswer('q_depth_known', fixture.q_depth_known);
    store.setAnswer('q34', fixture.q34_self_report.kind === 'named' 
      ? fixture.q34_self_report.items 
      : ['nothing_really']);

    // Per-direction card answers
    store.setAnswer('card-contributor-a', fixture.per_direction_card_a.contributor);
    store.setAnswer('card-experience-seeker-a', fixture.per_direction_card_a.experience_seeker);
    store.setAnswer('card-freedom-designer-a', fixture.per_direction_card_a.freedom_designer);
    store.setAnswer('card-growth-focused-a', fixture.per_direction_card_a.growth_focused);
    store.setAnswer('card-creator-a', fixture.per_direction_card_a.creator);
    store.setAnswer('card-relationship-rebuilder-a', fixture.per_direction_card_a.relationship_rebuilder);

    store.setAnswer('card-contributor-b', fixture.per_direction_card_b.contributor);
    store.setAnswer('card-experience-seeker-b', fixture.per_direction_card_b.experience_seeker);
    store.setAnswer('card-freedom-designer-b', fixture.per_direction_card_b.freedom_designer);
    store.setAnswer('card-growth-focused-b', fixture.per_direction_card_b.growth_focused);
    store.setAnswer('card-creator-b', fixture.per_direction_card_b.creator);
    store.setAnswer('card-relationship-rebuilder-b', fixture.per_direction_card_b.relationship_rebuilder);

    store.setAnswer('card-contributor-c', fixture.per_direction_card_c.contributor);
    store.setAnswer('card-experience-seeker-c', fixture.per_direction_card_c.experience_seeker);
    store.setAnswer('card-freedom-designer-c', fixture.per_direction_card_c.freedom_designer);
    store.setAnswer('card-growth-focused-c', fixture.per_direction_card_c.growth_focused);
    store.setAnswer('card-creator-c', fixture.per_direction_card_c.creator);
    store.setAnswer('card-relationship-rebuilder-c', fixture.per_direction_card_c.relationship_rebuilder);

    // Domain sliders - 3 pages of 4 (felt/resources/presence grouping)
    store.setAnswer('domain_current_state_felt', {
      felt_aliveness: fixture.domain_current_state.felt_aliveness,
      curiosity: fixture.domain_current_state.curiosity,
      mattering: fixture.domain_current_state.mattering,
    });
    store.setAnswer('domain_current_state_resources', {
      time_as_yours: fixture.domain_current_state.time_as_yours,
      energy_as_resource: fixture.domain_current_state.energy_as_resource,
      body_physical_aliveness: fixture.domain_current_state.body_physical_aliveness,
    });
    store.setAnswer('domain_current_state_presence', {
      intimacy: fixture.domain_current_state.intimacy,
      making: fixture.domain_current_state.making,
      spiritual: fixture.domain_current_state.spiritual,
    });

    // B9: peace_discriminator
    store.setAnswer('peace_discriminator', fixture.peace_discriminator);

    // B1: q70_allocation
    store.setAnswer('q70_allocation', fixture.q70_allocation);
  }

  it('reshapes alan fixture answers correctly', () => {
    loadFixtureIntoStore(alanAnswers);
    const store = useQuestionnaireStore();
    const reshaped = store.toAnswersObject;

    // Deep equality assertion
    expect(reshaped).toEqual(alanAnswers);

    // Assembler validation
    const validation = validateQuestionnaireAnswers(reshaped);
    expect(validation.ok).toBe(true);
  });

  it('reshapes daniel fixture answers correctly', () => {
    loadFixtureIntoStore(danielAnswers);
    const store = useQuestionnaireStore();
    const reshaped = store.toAnswersObject;

    // Deep equality assertion
    expect(reshaped).toEqual(danielAnswers);

    // Assembler validation
    const validation = validateQuestionnaireAnswers(reshaped);
    expect(validation.ok).toBe(true);
  });

  it('reshapes geoffrey fixture answers correctly', () => {
    loadFixtureIntoStore(geoffreyAnswers);
    const store = useQuestionnaireStore();
    const reshaped = store.toAnswersObject;

    // Deep equality assertion
    expect(reshaped).toEqual(geoffreyAnswers);

    // Assembler validation
    const validation = validateQuestionnaireAnswers(reshaped);
    expect(validation.ok).toBe(true);
  });

  it('reshapes mark fixture answers correctly', () => {
    loadFixtureIntoStore(markAnswers);
    const store = useQuestionnaireStore();
    const reshaped = store.toAnswersObject;

    // Deep equality assertion
    expect(reshaped).toEqual(markAnswers);

    // Assembler validation
    const validation = validateQuestionnaireAnswers(reshaped);
    expect(validation.ok).toBe(true);
  });

  it('reshapes martin fixture answers correctly', () => {
    loadFixtureIntoStore(martinAnswers);
    const store = useQuestionnaireStore();
    const reshaped = store.toAnswersObject;

    // Deep equality assertion
    expect(reshaped).toEqual(martinAnswers);

    // Assembler validation
    const validation = validateQuestionnaireAnswers(reshaped);
    expect(validation.ok).toBe(true);
  });

  it('reshapes paul fixture answers correctly', () => {
    loadFixtureIntoStore(paulAnswers);
    const store = useQuestionnaireStore();
    const reshaped = store.toAnswersObject;

    // Deep equality assertion
    expect(reshaped).toEqual(paulAnswers);

    // Assembler validation
    const validation = validateQuestionnaireAnswers(reshaped);
    expect(validation.ok).toBe(true);
  });

  it('reshapes raymond fixture answers correctly', () => {
    loadFixtureIntoStore(raymondAnswers);
    const store = useQuestionnaireStore();
    const reshaped = store.toAnswersObject;

    // Deep equality assertion
    expect(reshaped).toEqual(raymondAnswers);

    // Assembler validation
    const validation = validateQuestionnaireAnswers(reshaped);
    expect(validation.ok).toBe(true);
  });

  it('merges q1a and q1b into q1_week_shape_ticked correctly', () => {
    const store = useQuestionnaireStore();
    store.init(manifest, localStorageStub, 'test-user');

    // Set disjoint arrays across the two new questions
    store.setAnswer('q1a', ['b', 'd']); // sees_people, active_body
    store.setAnswer('q1b', ['g', 'i']); // work_dominates, varied_week

    // Set minimal required fields for validation
    store.setAnswer('q2', 'a');
    store.setAnswer('q3', 'a');
    store.setAnswer('q4', 'a');
    store.setAnswer('q5', 'a');
    store.setAnswer('q6', 'a');
    store.setAnswer('q7', 'a');
    store.setAnswer('q8', []);
    store.setAnswer('q9', []);
    store.setAnswer('q10', 'rest');
    store.setAnswer('q10b', 'rest');
    store.setAnswer('q10c', 'rest');
    store.setAnswer('q11', 'a');
    store.setAnswer('q24', []);
    store.setAnswer('q25', 'a');
    store.setAnswer('q26', 30);
    store.setAnswer('q27', 'a');
    store.setAnswer('q29', 'd');
    store.setAnswer('q30', 'a');
    store.setAnswer('q31', 'a');
    store.setAnswer('q32', 'a');
    store.setAnswer('q33', 'a');
    store.setAnswer('q34', ['nothing_really']);

    // Per-direction card answers (minimal)
    store.setAnswer('card-contributor-a', 'a');
    store.setAnswer('card-contributor-b', 'a');
    store.setAnswer('card-contributor-c', 'skipped');
    store.setAnswer('card-experience-seeker-a', 'a');
    store.setAnswer('card-experience-seeker-b', 'a');
    store.setAnswer('card-experience-seeker-c', 'skipped');
    store.setAnswer('card-freedom-designer-a', 'a');
    store.setAnswer('card-freedom-designer-b', 'a');
    store.setAnswer('card-freedom-designer-c', 'skipped');
    store.setAnswer('card-growth-focused-a', 'a');
    store.setAnswer('card-growth-focused-b', 'a');
    store.setAnswer('card-growth-focused-c', 'skipped');
    store.setAnswer('card-creator-a', 'a');
    store.setAnswer('card-creator-b', 'a');
    store.setAnswer('card-creator-c', 'skipped');
    store.setAnswer('card-relationship-rebuilder-a', 'a');
    store.setAnswer('card-relationship-rebuilder-b', 'a');
    store.setAnswer('card-relationship-rebuilder-c', 'skipped');

    // Domain sliders (minimal)
    store.setAnswer('domain_current_state_felt', {
      felt_aliveness: 50,
      curiosity: 50,
      mattering: 50,
    });
    store.setAnswer('domain_current_state_resources', {
      time_as_yours: 50,
      energy_as_resource: 50,
      body_physical_aliveness: 50,
    });
    store.setAnswer('domain_current_state_presence', {
      intimacy: 50,
      making: 50,
      spiritual: 50,
    });

    // New relational domain questions
    store.setAnswer('q_friendship_count', 'b');
    store.setAnswer('q_depth_known', 'b');

    // New psychological_filtering probes
    store.setAnswer('q11a_spare_resource', 'b');
    store.setAnswer('q11b_footprint', 'b');
    store.setAnswer('q11c_small_wants', 'b');

    // B9 and B1 fields
    store.setAnswer('peace_discriminator', {});
    store.setAnswer('q70_allocation', { creator: 35 });

    const reshaped = store.toAnswersObject;

    // Assert the merge produces the correct union
    expect(reshaped.q1_week_shape_ticked).toEqual(['b', 'd', 'g', 'i']);

    // Assembler validation
    const validation = validateQuestionnaireAnswers(reshaped);
    expect(validation.ok).toBe(true);
  });

  describe('silent default fix — answeredness distinction', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
    });

    it('UNANSWERED allocation: field absent in reshaped output, validation rejects', () => {
      const store = useQuestionnaireStore();
      store.init(manifest, localStorageStub, 'test-user');

      // Set all required fields EXCEPT q70_allocation
      store.setAnswer('q1a', ['a', 'b']);
      store.setAnswer('q1b', []);
      store.setAnswer('q2', 'a');
      store.setAnswer('q3', 'a');
      store.setAnswer('q4', 'a');
      store.setAnswer('q5', 'a');
      store.setAnswer('q6', 'a');
      store.setAnswer('q7', 'a');
      store.setAnswer('q8', ['contributor']);
      store.setAnswer('q9', []);
      store.setAnswer('q10', 'creator');
      store.setAnswer('q10b', 'creator');
      store.setAnswer('q10c', 'creator');
      store.setAnswer('q11', 'a');
      store.setAnswer('q24', ['time_as_yours']);
      store.setAnswer('q25', 'a');
      store.setAnswer('q26', 30);
      store.setAnswer('q27', 'a');
      store.setAnswer('q29', 'a');
      store.setAnswer('q30', 'a');
      store.setAnswer('q31', 'a');
      store.setAnswer('q32', 'a');
      store.setAnswer('q33', 'a');
      store.setAnswer('q34', ['more_friends']);
      store.setAnswer('card-contributor-a', 'a');
      store.setAnswer('card-experience-seeker-a', 'a');
      store.setAnswer('card-freedom-designer-a', 'a');
      store.setAnswer('card-growth-focused-a', 'a');
      store.setAnswer('card-creator-a', 'a');
      store.setAnswer('card-relationship-rebuilder-a', 'a');
      store.setAnswer('card-contributor-b', 'a');
      store.setAnswer('card-experience-seeker-b', 'a');
      store.setAnswer('card-freedom-designer-b', 'a');
      store.setAnswer('card-growth-focused-b', 'a');
      store.setAnswer('card-creator-b', 'a');
      store.setAnswer('card-relationship-rebuilder-b', 'a');
      store.setAnswer('card-contributor-c', 'skipped');
      store.setAnswer('card-experience-seeker-c', 'skipped');
      store.setAnswer('card-freedom-designer-c', 'skipped');
      store.setAnswer('card-growth-focused-c', 'skipped');
      store.setAnswer('card-creator-c', 'skipped');
      store.setAnswer('card-relationship-rebuilder-c', 'skipped');
      store.setAnswer('domain_current_state_e1', {
        time_as_yours: 50,
        energy_as_resource: 50,
        felt_aliveness: 50,
        body_physical_aliveness: 50,
      });
      store.setAnswer('domain_current_state_e2', {
        curiosity: 50,
        making: 50,
        conversation_depth: 50,
        being_known: 50,
      });
      store.setAnswer('domain_current_state_e3', {
        friendship: 50,
        intimacy: 50,
        mattering: 50,
        spiritual: 50,
      });
      store.setAnswer('peace_discriminator', {});

      // NOTE: q70_allocation is NEVER set

      const reshaped = store.toAnswersObject;

      // Field should be absent/undefined, not {}
      expect(reshaped.q70_allocation).toBeUndefined();

      // Validation should reject (missing required field)
      const validation = validateQuestionnaireAnswers(reshaped);
      expect(validation.ok).toBe(false);
    });

    it('peace ABSENT (page never reached): gate INCOMPLETE, validator rejects', () => {
      const store = useQuestionnaireStore();
      store.init(manifest, localStorageStub, 'test-user');

      // Set up a state with faded domains (past_presence yes, current_state < 60)
      store.setAnswer('q24', ['time_as_yours', 'energy_as_resource']);
      store.setAnswer('domain_current_state_e1', {
        time_as_yours: 40, // < 60, with past_presence = faded
        energy_as_resource: 40, // < 60, with past_presence = faded
        felt_aliveness: 70, // >= 60, not faded
        body_physical_aliveness: 70, // >= 60, not faded
      });
      store.setAnswer('domain_current_state_e2', {
        curiosity: 70,
        making: 70,
        conversation_depth: 70,
        being_known: 70,
      });
      store.setAnswer('domain_current_state_e3', {
        friendship: 70,
        intimacy: 70,
        mattering: 70,
        spiritual: 70,
      });

      // NOTE: peace_discriminator is NEVER set (page never reached / not initialized)

      // Gate should be INCOMPLETE (was true under option c; now false: field must be PRESENT)
      const pageComplete = store.isPageComplete('peace-discriminator');
      expect(pageComplete).toBe(false);

      // Validator rejects absent peace (peace_discriminator in REQUIRED_FIELDS)
      const reshaped = store.toAnswersObject;
      const validation = validateQuestionnaireAnswers(reshaped);
      expect(validation.ok).toBe(false);
      if (!validation.ok) {
        const peaceErrors = (validation.errors as any[]).filter((e: any) => e.path === 'peace_discriminator');
        expect(peaceErrors.length).toBeGreaterThan(0);
        expect(peaceErrors[0].code).toBe('missing_field');
      }
    });

    it('peace with ZERO faded domains: page reached => {} => gate complete, validator ok', () => {
      const store = useQuestionnaireStore();
      store.init(manifest, localStorageStub, 'test-user');

      // Set up a state with NO faded domains (all current_state >= 60)
      store.setAnswer('q24', ['time_as_yours', 'energy_as_resource']);
      store.setAnswer('domain_current_state_e1', {
        time_as_yours: 70, // >= 60, not faded
        energy_as_resource: 70, // >= 60, not faded
        felt_aliveness: 70,
        body_physical_aliveness: 70,
      });
      store.setAnswer('domain_current_state_e2', {
        curiosity: 70,
        making: 70,
        conversation_depth: 70,
        being_known: 70,
      });
      store.setAnswer('domain_current_state_e3', {
        friendship: 70,
        intimacy: 70,
        mattering: 70,
        spiritual: 70,
      });

      // Simulate renderer initialization: page reached => peace set to {}
      store.setAnswer('peace_discriminator', {});

      // Gate should be complete (field PRESENT, even if empty)
      const pageComplete = store.isPageComplete('peace-discriminator');
      expect(pageComplete).toBe(true);

      // Reshaped peace is present-empty {}
      const reshaped = store.toAnswersObject;
      expect(reshaped.peace_discriminator).toEqual({});

      // Validator accepts present-empty {} (no peace errors)
      const validation = validateQuestionnaireAnswers(reshaped);
      if (!validation.ok) {
        const peaceErrors = (validation.errors as any[]).filter((e: any) => e.path.startsWith('peace_discriminator'));
        expect(peaceErrors).toEqual([]);
      }
    });

    it('ANSWERED-with-empty allocation: gate passes (engagement), reshaper preserves', () => {
      const store = useQuestionnaireStore();
      store.init(manifest, localStorageStub, 'test-user');

      // Explicitly set q70_allocation to empty object (£70 unallocated is a valid answer)
      store.setAnswer('q70_allocation', {});

      // Page should be complete (explicitly answered, even if empty)
      const pageComplete = store.isPageComplete('q70-allocation');
      expect(pageComplete).toBe(true);

      // Reshaped output should contain the empty object
      const reshaped = store.toAnswersObject;
      expect(reshaped.q70_allocation).toEqual({});
    });

    it('allocation engagement distinction: absent vs explicit empty vs allocated', () => {
      const store = useQuestionnaireStore();
      store.init(manifest, localStorageStub, 'test-user');

      // Case 1: allocation absent (never set) => gate incomplete
      let pageComplete = store.isPageComplete('q70-allocation');
      expect(pageComplete).toBe(false);

      // Case 2: explicit {} => gate complete
      store.setAnswer('q70_allocation', {});
      pageComplete = store.isPageComplete('q70-allocation');
      expect(pageComplete).toBe(true);
      let reshaped = store.toAnswersObject;
      expect(reshaped.q70_allocation).toEqual({});

      // Case 3: {creator:30} => gate complete
      store.setAnswer('q70_allocation', { creator: 30 });
      pageComplete = store.isPageComplete('q70-allocation');
      expect(pageComplete).toBe(true);
      reshaped = store.toAnswersObject;
      expect(reshaped.q70_allocation).toEqual({ creator: 30 });
    });

    it('peace gate: field PRESENT required (matches validator)', () => {
      const store = useQuestionnaireStore();
      store.init(manifest, localStorageStub, 'test-user');

      // Case 1: No faded domains, page reached => peace initialized to {}
      store.setAnswer('q24', ['time_as_yours']);
      store.setAnswer('domain_current_state_e1', {
        time_as_yours: 70,
        energy_as_resource: 70,
        felt_aliveness: 70,
        body_physical_aliveness: 70,
      });
      store.setAnswer('domain_current_state_e2', {
        curiosity: 70,
        making: 70,
        conversation_depth: 70,
        being_known: 70,
      });
      store.setAnswer('domain_current_state_e3', {
        friendship: 70,
        intimacy: 70,
        mattering: 70,
        spiritual: 70,
      });
      // Simulate renderer initialization
      store.setAnswer('peace_discriminator', {});
      let pageComplete = store.isPageComplete('peace-discriminator');
      expect(pageComplete).toBe(true);
      let reshaped = store.toAnswersObject;
      expect(reshaped.peace_discriminator).toEqual({});

      // Case 2: Faded domains present (time_as_yours: past=yes, current=50), no picks
      // => peace still {} (renderer initialized), gate complete, validator ok
      store.setAnswer('domain_current_state_e1', {
        time_as_yours: 50, // < 60, faded
        energy_as_resource: 70,
        felt_aliveness: 70,
        body_physical_aliveness: 70,
      });
      pageComplete = store.isPageComplete('peace-discriminator');
      expect(pageComplete).toBe(true);
      reshaped = store.toAnswersObject;
      expect(reshaped.peace_discriminator).toEqual({});
      // Validator accepts present-empty {}
      let validation = validateQuestionnaireAnswers(reshaped);
      if (!validation.ok) {
        const peaceErrors = (validation.errors as any[]).filter((e: any) => e.path.startsWith('peace_discriminator'));
        expect(peaceErrors).toEqual([]);
      }

      // Case 3: Faded domains present, >=1 pick => gate complete, reshaped map has picks
      store.setAnswer('peace_discriminator', { time_as_yours: 'made_peace' });
      pageComplete = store.isPageComplete('peace-discriminator');
      expect(pageComplete).toBe(true);
      reshaped = store.toAnswersObject;
      expect(reshaped.peace_discriminator).toEqual({ time_as_yours: 'made_peace' });
      // Validator accepts partial map
      validation = validateQuestionnaireAnswers(reshaped);
      if (!validation.ok) {
        const peaceErrors = (validation.errors as any[]).filter((e: any) => e.path.startsWith('peace_discriminator'));
        expect(peaceErrors).toEqual([]);
      }
    });
  });

  describe('empty tick_any questions flatten to []', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
    });

    it('undefined tick_any questions produce empty arrays, not undefined', () => {
      const store = useQuestionnaireStore();
      store.init(manifest, localStorageStub, 'test-user');

      // Do NOT set tick_any questions at all (simulating zero ticks / never answered)
      // This leaves them as undefined in the store, which is the bug scenario

      // Set minimal required fields for validation
      store.setAnswer('q2', 'a');
      store.setAnswer('q3', 'a');
      store.setAnswer('q4', 'a');
      store.setAnswer('q5', 'a');
      store.setAnswer('q6', 'a');
      store.setAnswer('q7', 'a');
      store.setAnswer('q10', 'rest');
      store.setAnswer('q10b', 'rest');
      store.setAnswer('q10c', 'rest');
      store.setAnswer('q11', 'a');
      store.setAnswer('q25', 'a');
      store.setAnswer('q26', 30);
      store.setAnswer('q27', 'a');
      store.setAnswer('q29', 'a');
      store.setAnswer('q30', 'a');
      store.setAnswer('q31', 'a');
      store.setAnswer('q32', 'a');
      store.setAnswer('q33', 'a');
      store.setAnswer('q34', ['nothing_really']);

      // Per-direction card answers (minimal)
      store.setAnswer('card-contributor-a', 'a');
      store.setAnswer('card-contributor-b', 'a');
      store.setAnswer('card-contributor-c', 'skipped');
      store.setAnswer('card-experience-seeker-a', 'a');
      store.setAnswer('card-experience-seeker-b', 'a');
      store.setAnswer('card-experience-seeker-c', 'skipped');
      store.setAnswer('card-freedom-designer-a', 'a');
      store.setAnswer('card-freedom-designer-b', 'a');
      store.setAnswer('card-freedom-designer-c', 'skipped');
      store.setAnswer('card-growth-focused-a', 'a');
      store.setAnswer('card-growth-focused-b', 'a');
      store.setAnswer('card-growth-focused-c', 'skipped');
      store.setAnswer('card-creator-a', 'a');
      store.setAnswer('card-creator-b', 'a');
      store.setAnswer('card-creator-c', 'skipped');
      store.setAnswer('card-relationship-rebuilder-a', 'a');
      store.setAnswer('card-relationship-rebuilder-b', 'a');
      store.setAnswer('card-relationship-rebuilder-c', 'skipped');

      // Domain sliders (minimal)
      store.setAnswer('domain_current_state_felt', {
        felt_aliveness: 50,
        curiosity: 50,
        mattering: 50,
      });
      store.setAnswer('domain_current_state_resources', {
        time_as_yours: 50,
        energy_as_resource: 50,
        body_physical_aliveness: 50,
      });
      store.setAnswer('domain_current_state_presence', {
        intimacy: 50,
        making: 50,
        spiritual: 50,
      });

      // New relational domain questions
      store.setAnswer('q_friendship_count', 'b');
      store.setAnswer('q_depth_known', 'b');

      // New psychological_filtering probes
      store.setAnswer('q11a_spare_resource', 'b');
      store.setAnswer('q11b_footprint', 'b');
      store.setAnswer('q11c_small_wants', 'b');

      // B9 and B1 fields
      store.setAnswer('peace_discriminator', {});
      store.setAnswer('q70_allocation', { creator: 35 });

      const reshaped = store.toAnswersObject;

      // Verify empty tick_any fields are [], not undefined
      expect(reshaped.q1_week_shape_ticked).toEqual([]);
      expect(reshaped.q8_past_presence_ticked).toEqual([]);
      expect(reshaped.q9_stopped_expecting_ticked).toEqual([]);
      expect(reshaped.past_presence_selection).toEqual([]);

      // Verify the reshaped object passes validation
      const validation = validateQuestionnaireAnswers(reshaped);
      expect(validation.ok).toBe(true);
    });
  });
});
