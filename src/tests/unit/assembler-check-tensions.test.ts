import { describe, it, expect } from 'vitest';
import {
  checkGaveUpButStillWants,
  checkReachingWithoutTrace,
} from '@/assembler/consistency/check-tensions';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { buildInputMap } from '@/assembler/input-map';
import type { ConsistencyFlag } from '@/assembler/consistency/types';

describe('checkGaveUpButStillWants (CHECK 4)', () => {
  it('POSITIVE: one direction stopped_expecting=yes AND anticipation=quickening -> 1 flag, code gave_up_but_still_keenly_wants, severity TENSION, direction=that one', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: ['contributor'],
      per_direction_card_b: {
        contributor: 'c', // quickening
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkGaveUpButStillWants(inputMap);

    expect(flags).toHaveLength(1);
    const flag = flags[0] as ConsistencyFlag;
    expect(flag.code).toBe('gave_up_but_still_keenly_wants');
    expect(flag.severity).toBe('tension');
    expect(flag.direction).toBe('contributor');
  });

  it('NEGATIVE leg 1: stopped_expecting=yes AND anticipation=mild -> no flag', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: ['contributor'],
      per_direction_card_b: {
        contributor: 'b', // mild
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkGaveUpButStillWants(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('NEGATIVE leg 2: stopped_expecting=no AND anticipation=quickening -> no flag', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: [],
      per_direction_card_b: {
        contributor: 'c', // quickening
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkGaveUpButStillWants(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('RIGHT-DIRECTION-ONLY: violating combo on ONE direction, other five clean -> exactly 1 flag on that direction (not six)', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: ['contributor'],
      per_direction_card_b: {
        contributor: 'c', // quickening
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkGaveUpButStillWants(inputMap);

    expect(flags).toHaveLength(1);
    expect(flags[0]?.direction).toBe('contributor');
  });

  it('SEVERITY: severity === "tension"', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: ['contributor'],
      per_direction_card_b: {
        contributor: 'c', // quickening
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkGaveUpButStillWants(inputMap);

    expect(flags[0]?.severity).toBe('tension');
  });
});

describe('checkReachingWithoutTrace (CHECK 6)', () => {
  describe('GUARD', () => {
    it('recent_reaching != recent_and_awkward (e.g. mid_stream) -> no flag, regardless of traces', () => {
      const answers = makeAnswers({
        q29_recent_reaching: 'b', // mid_stream
        per_direction_card_a: {
          contributor: 'c', // 67
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkReachingWithoutTrace(inputMap);

      expect(flags).toHaveLength(0);
    });
  });

  describe('EXISTENTIAL AGGREGATE (guard open = recent_reaching=recent_and_awkward)', () => {
    it('no direction qualifies as a trace -> 1 flag (fires ONCE, code reaching_without_trace, severity TENSION)', () => {
      const answers = makeAnswers({
        q29_recent_reaching: 'a', // recent_and_awkward
        per_direction_card_a: {
          contributor: 'b', // 33 (below floor)
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkReachingWithoutTrace(inputMap);

      expect(flags).toHaveLength(1);
      const flag = flags[0] as ConsistencyFlag;
      expect(flag.code).toBe('reaching_without_trace');
      expect(flag.severity).toBe('tension');
    });

    it('at least one direction IS a trace (e.g. one direction 67+quickening) -> NO flag (trace suppresses)', () => {
      const answers = makeAnswers({
        q29_recent_reaching: 'a', // recent_and_awkward
        per_direction_card_a: {
          contributor: 'c', // 67
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkReachingWithoutTrace(inputMap);

      expect(flags).toHaveLength(0);
    });
  });

  describe('BANDED-CONJUNCT TRACE (guard open; pin each band/anticipation combo)', () => {
    it('67 + mild -> traces (so flag SUPPRESSED)', () => {
      const answers = makeAnswers({
        q29_recent_reaching: 'a', // recent_and_awkward
        per_direction_card_a: {
          contributor: 'c', // 67
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'b', // mild
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkReachingWithoutTrace(inputMap);

      expect(flags).toHaveLength(0);
    });

    it('67 + quickening -> traces (suppressed)', () => {
      const answers = makeAnswers({
        q29_recent_reaching: 'a', // recent_and_awkward
        per_direction_card_a: {
          contributor: 'c', // 67
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkReachingWithoutTrace(inputMap);

      expect(flags).toHaveLength(0);
    });

    it('33 + quickening -> does NOT trace (below the >=34 floor) -> flag FIRES', () => {
      const answers = makeAnswers({
        q29_recent_reaching: 'a', // recent_and_awkward
        per_direction_card_a: {
          contributor: 'b', // 33
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkReachingWithoutTrace(inputMap);

      expect(flags).toHaveLength(1);
    });

    it('100 + quickening -> does NOT trace (above the <=67 ceiling, the established-service exclusion) -> flag FIRES', () => {
      const answers = makeAnswers({
        q29_recent_reaching: 'a', // recent_and_awkward
        per_direction_card_a: {
          contributor: 'd', // 100
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkReachingWithoutTrace(inputMap);

      expect(flags).toHaveLength(1);
    });

    it('67 + none -> does NOT trace (fails the anticipation conjunct) -> flag FIRES', () => {
      const answers = makeAnswers({
        q29_recent_reaching: 'a', // recent_and_awkward
        per_direction_card_a: {
          contributor: 'c', // 67
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'a', // none
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      const inputMap = buildInputMap('test-user', answers);
      const flags = checkReachingWithoutTrace(inputMap);

      expect(flags).toHaveLength(1);
    });
  });

  it('SEVERITY: severity === "tension"', () => {
    const answers = makeAnswers({
      q29_recent_reaching: 'a', // recent_and_awkward
      per_direction_card_a: {
        contributor: 'b', // 33 (below floor)
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      per_direction_card_b: {
        contributor: 'c', // quickening
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkReachingWithoutTrace(inputMap);

    expect(flags[0]?.severity).toBe('tension');
  });

  it('FIRES-ONCE: CHECK 6 returns at most 1 flag (aggregate, not per-direction) even when multiple directions fail to trace', () => {
    const answers = makeAnswers({
      q29_recent_reaching: 'a', // recent_and_awkward
      per_direction_card_a: {
        contributor: 'b', // 33 (below floor)
        experience_seeker: 'b', // 33
        freedom_designer: 'b', // 33
        growth_focused: 'b', // 33
        creator: 'b', // 33
        relationship_rebuilder: 'b', // 33
      },
      per_direction_card_b: {
        contributor: 'c', // quickening
        experience_seeker: 'c', // quickening
        freedom_designer: 'c', // quickening
        growth_focused: 'c', // quickening
        creator: 'c', // quickening
        relationship_rebuilder: 'c', // quickening
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkReachingWithoutTrace(inputMap);

    expect(flags.length).toBeLessThanOrEqual(1);
  });
});

describe('FENCE — function-level', () => {
  it('each check takes Readonly<InputMap> and returns ConsistencyFlag[] — no InputMap in return', () => {
    const answers = makeAnswers();
    const inputMap = buildInputMap('test-user', answers);

    const flags4 = checkGaveUpButStillWants(inputMap);
    const flags6 = checkReachingWithoutTrace(inputMap);

    expect(Array.isArray(flags4)).toBe(true);
    expect(Array.isArray(flags6)).toBe(true);
  });
});
