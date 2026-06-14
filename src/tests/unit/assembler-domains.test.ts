import { describe, it, expect } from 'vitest';
import { buildDomains } from '@/assembler/domains';
import { makeAnswers, DEFAULT_DOMAIN_STATES } from '@/tests/helpers/make-answers';

describe('buildDomains', () => {
  describe('wanting derivation (non-universal domain: making)', () => {

    it('past_presence=no, current_state=29 → doesnt_want', () => {
      const answers = makeAnswers({ domain_current_state: { ...DEFAULT_DOMAIN_STATES, making: 29 }, past_presence_selection: [] });
      const result = buildDomains(answers);
      expect(result.making.wanting).toBe('doesnt_want');
    });

    it('past_presence=no, current_state=30 → wants', () => {
      const answers = makeAnswers({ domain_current_state: { ...DEFAULT_DOMAIN_STATES, making: 30 }, past_presence_selection: [] });
      const result = buildDomains(answers);
      expect(result.making.wanting).toBe('wants');
    });

    it('past_presence=no, current_state=31 → wants', () => {
      const answers = makeAnswers({ domain_current_state: { ...DEFAULT_DOMAIN_STATES, making: 31 }, past_presence_selection: [] });
      const result = buildDomains(answers);
      expect(result.making.wanting).toBe('wants');
    });

    it('past_presence=yes, current_state=10 → wants', () => {
      const answers = makeAnswers({ domain_current_state: { ...DEFAULT_DOMAIN_STATES, making: 10 }, past_presence_selection: ['making'] });
      const result = buildDomains(answers);
      expect(result.making.wanting).toBe('wants');
    });
  });

  describe('universal domains omit wanting', () => {

    it('time_as_yours omits wanting', () => {
      const result = buildDomains(makeAnswers());
      expect('wanting' in result.time_as_yours).toBe(false);
    });

    it('energy_as_resource omits wanting', () => {
      const result = buildDomains(makeAnswers());
      expect('wanting' in result.energy_as_resource).toBe(false);
    });

    it('felt_aliveness omits wanting', () => {
      const result = buildDomains(makeAnswers());
      expect('wanting' in result.felt_aliveness).toBe(false);
    });

    it('body_physical_aliveness omits wanting', () => {
      const result = buildDomains(makeAnswers());
      expect('wanting' in result.body_physical_aliveness).toBe(false);
    });
  });

  describe('spiritual carries wanting (derived by same rule)', () => {
    it('past_presence=no, current_state=20 → doesnt_want', () => {
      const answers = makeAnswers({
        domain_current_state: { ...DEFAULT_DOMAIN_STATES, spiritual: 20 },
        past_presence_selection: [],
      });
      const result = buildDomains(answers);
      expect(result.spiritual.wanting).toBe('doesnt_want');
    });

    it('past_presence=yes, current_state=20 → wants', () => {
      const answers = makeAnswers({
        domain_current_state: { ...DEFAULT_DOMAIN_STATES, spiritual: 20 },
        past_presence_selection: ['spiritual'],
      });
      const result = buildDomains(answers);
      expect(result.spiritual.wanting).toBe('wants');
    });
  });

  describe('current_state mapping', () => {
    it('all twelve slider values land on correct domain key', () => {
      const answers = makeAnswers({
        domain_current_state: {
          time_as_yours: 10,
          energy_as_resource: 20,
          felt_aliveness: 30,
          body_physical_aliveness: 40,
          curiosity: 50,
          making: 60,
          conversation_depth: 70,
          being_known: 80,
          friendship: 15,
          intimacy: 25,
          mattering: 35,
          spiritual: 45,
        },
      });
      const result = buildDomains(answers);
      expect(result.time_as_yours.current_state).toBe(10);
      expect(result.energy_as_resource.current_state).toBe(20);
      expect(result.felt_aliveness.current_state).toBe(30);
      expect(result.body_physical_aliveness.current_state).toBe(40);
      expect(result.curiosity.current_state).toBe(50);
      expect(result.making.current_state).toBe(60);
      expect(result.conversation_depth.current_state).toBe(70);
      expect(result.being_known.current_state).toBe(80);
      expect(result.friendship.current_state).toBe(15);
      expect(result.intimacy.current_state).toBe(25);
      expect(result.mattering.current_state).toBe(35);
      expect(result.spiritual.current_state).toBe(45);
    });
  });

  describe('past_presence mapping', () => {
    it('domain in selection → yes, not in selection → no', () => {
      const answers = makeAnswers({
        past_presence_selection: [
          'time_as_yours',
          'curiosity',
          'making',
          'friendship',
          'spiritual',
        ],
      });
      const result = buildDomains(answers);
      expect(result.time_as_yours.past_presence).toBe('yes');
      expect(result.energy_as_resource.past_presence).toBe('no');
      expect(result.felt_aliveness.past_presence).toBe('no');
      expect(result.body_physical_aliveness.past_presence).toBe('no');
      expect(result.curiosity.past_presence).toBe('yes');
      expect(result.making.past_presence).toBe('yes');
      expect(result.conversation_depth.past_presence).toBe('no');
      expect(result.being_known.past_presence).toBe('no');
      expect(result.friendship.past_presence).toBe('yes');
      expect(result.intimacy.past_presence).toBe('no');
      expect(result.mattering.past_presence).toBe('no');
      expect(result.spiritual.past_presence).toBe('yes');
    });
  });
});
