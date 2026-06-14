import { describe, it, expect } from 'vitest';
import { checkSpecificWantNeverSurfaces } from '@/assembler/consistency/check-triad-surface';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { buildInputMap } from '@/assembler/input-map';
import type { ConsistencyFlag } from '@/assembler/consistency/types';

describe('checkSpecificWantNeverSurfaces (CHECK 9)', () => {
  describe('MEMBERSHIP PIN (load-bearing, both directions)', () => {
    it('NOT-IN-SET (POSITIVE): contributor quickening+strong, triad all rest/none -> 1 flag, code specific_want_never_surfaces, severity TENSION, direction=contributor', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c', // strong
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'rest',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

      expect(flags).toHaveLength(1);
      const flag = flags[0] as ConsistencyFlag;
      expect(flag.code).toBe('specific_want_never_surfaces');
      expect(flag.severity).toBe('tension');
      expect(flag.direction).toBe('contributor');
    });

    it('IN-SET (SUPPRESSION — the inversion-catcher): contributor quickening+strong, BUT Q10=contributor -> NO flag (it surfaced)', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c', // strong
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
        q10_direction_chosen: 'contributor',
        q10b_retrospective: 'rest',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

      expect(flags).toHaveLength(0);
    });
  });

  describe('TRIAD-SET CONSTRUCTION pins', () => {
    it('rest/none do not populate: contributor quickening+strong, triad all rest/none -> flag fires', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c', // strong
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'rest',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

      expect(flags).toHaveLength(1);
    });

    it('all three picks contribute (not just-Q10): Q10b-only surfacing suppresses flag', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c', // strong
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'contributor',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

      expect(flags).toHaveLength(0);
    });

    it('Q10c-only surfacing suppresses flag', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c', // strong
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'rest',
        q10c_counterfactual: 'contributor',
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

      expect(flags).toHaveLength(0);
    });
  });

  describe('CONJUNCTION negative legs (both conjuncts required)', () => {
    it('quickening + PARTIAL (not strong), not-in-set -> no flag', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'b', // partial
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'rest',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

      expect(flags).toHaveLength(0);
    });

    it('MILD (not quickening) + strong, not-in-set -> no flag', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'b', // mild
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c', // strong
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
        q10_direction_chosen: 'rest',
        q10b_retrospective: 'rest',
        q10c_counterfactual: 'rest',
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

      expect(flags).toHaveLength(0);
    });
  });

  it('RIGHT-DIRECTION-ONLY: contributor quickening+strong+not-in-set, other five clean -> exactly 1 flag on contributor (not six)', () => {
    const answers = makeAnswers({
      per_direction_card_b: {
        contributor: 'c', // quickening
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      per_direction_card_c: {
        contributor: 'c', // strong
        experience_seeker: 'skipped',
        freedom_designer: 'skipped',
        growth_focused: 'skipped',
        creator: 'skipped',
        relationship_rebuilder: 'skipped',
      },
      q10_direction_chosen: 'rest',
      q10b_retrospective: 'rest',
      q10c_counterfactual: 'rest',
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

    expect(flags).toHaveLength(1);
    expect(flags[0]?.direction).toBe('contributor');
  });

  it('SEVERITY: severity === "tension"', () => {
    const answers = makeAnswers({
      per_direction_card_b: {
        contributor: 'c', // quickening
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      per_direction_card_c: {
        contributor: 'c', // strong
        experience_seeker: 'skipped',
        freedom_designer: 'skipped',
        growth_focused: 'skipped',
        creator: 'skipped',
        relationship_rebuilder: 'skipped',
      },
      q10_direction_chosen: 'rest',
      q10b_retrospective: 'rest',
      q10c_counterfactual: 'rest',
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

    expect(flags[0]?.severity).toBe('tension');
  });

  describe('FENCE — function-level', () => {
    it('signature takes Readonly<InputMap> + answers, returns ConsistencyFlag[] — no InputMap in return', () => {
      const answers = makeAnswers();
      const inputMap = buildInputMap('test-user', answers);

      const flags = checkSpecificWantNeverSurfaces(inputMap, answers);

      expect(Array.isArray(flags)).toBe(true);
    });
  });
});
