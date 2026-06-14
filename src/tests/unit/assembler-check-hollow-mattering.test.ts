import { describe, it, expect } from 'vitest';
import { checkHollowMattering } from '@/assembler/consistency/check-hollow-mattering';
import { makeAnswers } from '@/tests/helpers/make-answers';
import { buildInputMap } from '@/assembler/input-map';
import type { ConsistencyFlag } from '@/assembler/consistency/types';
import { DEFAULT_DOMAIN_STATES } from '@/tests/helpers/make-answers';

describe('checkHollowMattering (CHECK 7)', () => {
  it('POSITIVE: mattering.current_state=70 AND felt_aliveness.current_state=35 -> 1 flag, code hollow_mattering, severity TENSION', () => {
    const answers = makeAnswers({
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 70,
        felt_aliveness: 35,
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkHollowMattering(inputMap);

    expect(flags).toHaveLength(1);
    const flag = flags[0] as ConsistencyFlag;
    expect(flag.code).toBe('hollow_mattering');
    expect(flag.severity).toBe('tension');
  });

  it('NEGATIVE leg 1: mattering high (>=70) AND felt_aliveness=36 (just above the <=35) -> no flag', () => {
    const answers = makeAnswers({
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 70,
        felt_aliveness: 36,
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkHollowMattering(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('NEGATIVE leg 2: mattering=69 (just below >=70) AND felt_aliveness low (<=35) -> no flag', () => {
    const answers = makeAnswers({
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 69,
        felt_aliveness: 35,
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkHollowMattering(inputMap);

    expect(flags).toHaveLength(0);
  });

  it('BOUNDARY >=70: mattering=70 fires (with felt_aliveness<=35 held); mattering=69 does not', () => {
    // 70 fires
    const answers70 = makeAnswers({
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 70,
        felt_aliveness: 35,
      },
    });
    const inputMap70 = buildInputMap('test-user', answers70);
    const flags70 = checkHollowMattering(inputMap70);
    expect(flags70).toHaveLength(1);

    // 69 does not fire
    const answers69 = makeAnswers({
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 69,
        felt_aliveness: 35,
      },
    });
    const inputMap69 = buildInputMap('test-user', answers69);
    const flags69 = checkHollowMattering(inputMap69);
    expect(flags69).toHaveLength(0);
  });

  it('BOUNDARY <=35: felt_aliveness=35 fires (with mattering>=70 held); felt_aliveness=36 does not', () => {
    // 35 fires
    const answers35 = makeAnswers({
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 70,
        felt_aliveness: 35,
      },
    });
    const inputMap35 = buildInputMap('test-user', answers35);
    const flags35 = checkHollowMattering(inputMap35);
    expect(flags35).toHaveLength(1);

    // 36 does not fire
    const answers36 = makeAnswers({
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 70,
        felt_aliveness: 36,
      },
    });
    const inputMap36 = buildInputMap('test-user', answers36);
    const flags36 = checkHollowMattering(inputMap36);
    expect(flags36).toHaveLength(0);
  });

  it('SEVERITY: severity === "tension"', () => {
    const answers = makeAnswers({
      domain_current_state: {
        ...DEFAULT_DOMAIN_STATES,
        mattering: 70,
        felt_aliveness: 35,
      },
    });
    const inputMap = buildInputMap('test-user', answers);
    const flags = checkHollowMattering(inputMap);

    expect(flags[0]?.severity).toBe('tension');
  });

  describe('FENCE — function-level', () => {
    it('signature takes Readonly<InputMap>, returns ConsistencyFlag[] — no InputMap in return', () => {
      const answers = makeAnswers();
      const inputMap = buildInputMap('test-user', answers);

      const flags = checkHollowMattering(inputMap);

      expect(Array.isArray(flags)).toBe(true);
    });
  });
});
