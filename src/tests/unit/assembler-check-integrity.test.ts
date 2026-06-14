import { describe, it, expect } from 'vitest';
import {
  checkStoppedExpectingWithoutHistory,
  checkActiveButNoHistory,
  checkChoseDirectionHeDoesntWant,
} from '@/assembler/consistency/check-integrity';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { buildInputMap } from '@/assembler/input-map';
import type { ConsistencyFlag } from '@/assembler/consistency/types';

describe('checkStoppedExpectingWithoutHistory (CHECK 2)', () => {
  it('POSITIVE: one direction stopped_expecting=yes AND past_presence=no -> 1 flag, code stopped_expecting_without_history, severity CONTRADICTION, direction=that one', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: ['contributor'],
      q8_past_presence_ticked: [],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkStoppedExpectingWithoutHistory(inputMap);

    expect(flags).toHaveLength(1);
    const flag = flags[0] as ConsistencyFlag;
    expect(flag.code).toBe('stopped_expecting_without_history');
    expect(flag.severity).toBe('contradiction');
    expect(flag.direction).toBe('contributor');
  });

  it('NEGATIVE leg 1: stopped_expecting=yes AND past_presence=YES -> no flag', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: ['contributor'],
      q8_past_presence_ticked: ['contributor'],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkStoppedExpectingWithoutHistory(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('NEGATIVE leg 2: stopped_expecting=no AND past_presence=no -> no flag', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: [],
      q8_past_presence_ticked: [],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkStoppedExpectingWithoutHistory(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('RIGHT-DIRECTION-ONLY: violating combo on ONE direction, other five clean -> exactly 1 flag, on that direction (not six)', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: ['contributor'],
      q8_past_presence_ticked: [],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkStoppedExpectingWithoutHistory(inputMap);

    expect(flags).toHaveLength(1);
    expect(flags[0]?.direction).toBe('contributor');
  });

  it('SEVERITY: the fired flag severity === "contradiction"', () => {
    const answers = makeAnswers({
      q9_stopped_expecting_ticked: ['contributor'],
      q8_past_presence_ticked: [],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkStoppedExpectingWithoutHistory(inputMap);

    expect(flags[0]?.severity).toBe('contradiction');
  });
});

describe('checkActiveButNoHistory (CHECK 3)', () => {
  it('POSITIVE: one direction current_movement band 67 AND past_presence=no -> 1 flag, code active_but_no_history, severity TENSION, direction=that one', () => {
    const answers = makeAnswers({
      per_direction_card_a: {
        contributor: 'c', // 67
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      q8_past_presence_ticked: [],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkActiveButNoHistory(inputMap);

    expect(flags).toHaveLength(1);
    const flag = flags[0] as ConsistencyFlag;
    expect(flag.code).toBe('active_but_no_history');
    expect(flag.severity).toBe('tension');
    expect(flag.direction).toBe('contributor');
  });

  it('NEGATIVE leg 1: movement 67 AND past_presence=YES -> no flag', () => {
    const answers = makeAnswers({
      per_direction_card_a: {
        contributor: 'c', // 67
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      q8_past_presence_ticked: ['contributor'],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkActiveButNoHistory(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('NEGATIVE leg 2: movement band 33 AND past_presence=no -> no flag', () => {
    const answers = makeAnswers({
      per_direction_card_a: {
        contributor: 'b', // 33
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      q8_past_presence_ticked: [],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkActiveButNoHistory(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('BANDED BOUNDARY: movement 67 (lowest reachable >=60) fires; movement 33 (highest reachable <60) does NOT fire (past_presence=no held)', () => {
    // 67 fires
    const answers67 = makeAnswers({
      per_direction_card_a: {
        contributor: 'c', // 67
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      q8_past_presence_ticked: [],
    });
    const inputMap67 = buildInputMap('test-user', answers67);
    const flags67 = checkActiveButNoHistory(inputMap67);
    expect(flags67).toHaveLength(1);

    // 33 does NOT fire
    const answers33 = makeAnswers({
      per_direction_card_a: {
        contributor: 'b', // 33
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      q8_past_presence_ticked: [],
    });
    const inputMap33 = buildInputMap('test-user', answers33);
    const flags33 = checkActiveButNoHistory(inputMap33);
    expect(flags33).toHaveLength(0);
  });

  it('RIGHT-DIRECTION-ONLY: violating combo on one direction, others clean -> exactly 1 flag on that direction', () => {
    const answers = makeAnswers({
      per_direction_card_a: {
        contributor: 'c', // 67
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      q8_past_presence_ticked: [],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkActiveButNoHistory(inputMap);

    expect(flags).toHaveLength(1);
    expect(flags[0]?.direction).toBe('contributor');
  });

  it('SEVERITY: severity === "tension"', () => {
    const answers = makeAnswers({
      per_direction_card_a: {
        contributor: 'c', // 67
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
      q8_past_presence_ticked: [],
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkActiveButNoHistory(inputMap);

    expect(flags[0]?.severity).toBe('tension');
  });
});

describe('checkChoseDirectionHeDoesntWant (CHECK 5)', () => {
  it('POSITIVE: direction_chosen=contributor AND directions.contributor.anticipation=none -> 1 flag, code chose_direction_he_doesnt_want, severity CONTRADICTION', () => {
    const answers = makeAnswers({
      q10_direction_chosen: 'contributor',
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
    const flags = checkChoseDirectionHeDoesntWant(inputMap);

    expect(flags).toHaveLength(1);
    const flag = flags[0] as ConsistencyFlag;
    expect(flag.code).toBe('chose_direction_he_doesnt_want');
    expect(flag.severity).toBe('contradiction');
  });

  it('NEGATIVE leg 1: direction_chosen=contributor AND contributor.anticipation=mild -> no flag', () => {
    const answers = makeAnswers({
      q10_direction_chosen: 'contributor',
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
    const flags = checkChoseDirectionHeDoesntWant(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('NEGATIVE leg 2: direction_chosen=rest -> no flag (guard: only fires when a direction was chosen)', () => {
    const answers = makeAnswers({
      q10_direction_chosen: 'rest',
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkChoseDirectionHeDoesntWant(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('SEVERITY: severity === "contradiction"', () => {
    const answers = makeAnswers({
      q10_direction_chosen: 'contributor',
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
    const flags = checkChoseDirectionHeDoesntWant(inputMap);

    expect(flags[0]?.severity).toBe('contradiction');
  });
});

describe('FENCE — function-level', () => {
  it('each check takes Readonly<InputMap> and returns ConsistencyFlag[] — no InputMap in return', () => {
    const answers = makeAnswers();
    const inputMap = buildInputMap('test-user', answers);

    const flags2 = checkStoppedExpectingWithoutHistory(inputMap);
    const flags3 = checkActiveButNoHistory(inputMap);
    const flags5 = checkChoseDirectionHeDoesntWant(inputMap);

    expect(Array.isArray(flags2)).toBe(true);
    expect(Array.isArray(flags3)).toBe(true);
    expect(Array.isArray(flags5)).toBe(true);
  });
});
