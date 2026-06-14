import { describe, it, expect } from 'vitest';
import { deriveLifeStage } from '@/assembler/life-stage';
import { makeAnswers } from '@/tests/helpers/make-answers';

describe('deriveLifeStage', () => {
  describe('GROUP P — Precedence (multi-match adjacencies)', () => {
    it('P1 rule 1 vs 5: rule 1 wins (transitioning)', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'a', // recent
        q5_recent_life_shape_change: 'b', // yes (something ended)
        q29_recent_reaching: 'd', // no_current_reaching
      });
      expect(deriveLifeStage(answers)).toBe('transitioning');
    });

    it('P2 rule 2 vs 4: rule 2 wins (transitioning)', () => {
      const answers = makeAnswers({
        q29_recent_reaching: 'a', // recent_and_awkward
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      expect(deriveLifeStage(answers)).toBe('transitioning');
    });

    it('P3 rule 4 vs 5: rule 4 wins (consolidating)', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'b', // sustained (avoid rule 1)
        q29_recent_reaching: 'd', // no_current_reaching
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      expect(deriveLifeStage(answers)).toBe('consolidating');
    });

    it('P4 rule 3 vs 4: rule 3 fires (consolidating via rule 3)', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'b', // sustained (avoid rule 1)
        q29_recent_reaching: 'c', // long_established
        per_direction_card_b: {
          contributor: 'a', // none (no quickening)
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        q10_direction_chosen: 'rest', // not in six
      });
      expect(deriveLifeStage(answers)).toBe('consolidating');
    });
  });

  describe('GROUP R — Rule 4 both arms and negative', () => {
    it('R4a direction_chosen arm: consolidating', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'b', // sustained (avoid rule 1)
        q29_recent_reaching: 'b', // mid_stream (avoid 2/3/5)
        q10_direction_chosen: 'contributor', // in six
        per_direction_card_b: {
          contributor: 'a', // no quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      expect(deriveLifeStage(answers)).toBe('consolidating');
    });

    it('R4b anticipation arm: consolidating', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'b', // sustained (avoid rule 1)
        q29_recent_reaching: 'b', // mid_stream
        q10_direction_chosen: 'rest', // not in six
        per_direction_card_b: {
          contributor: 'c', // quickening
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      expect(deriveLifeStage(answers)).toBe('consolidating');
    });

    it('R4c negative: mild+specific does NOT trigger rule 4 (drifting)', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'b', // sustained (avoid rule 1)
        q29_recent_reaching: 'b', // mid_stream
        q10_direction_chosen: 'rest', // not in six
        per_direction_card_b: {
          contributor: 'b', // mild
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c', // strong specificity
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
      });
      expect(deriveLifeStage(answers)).toBe('drifting');
    });
  });

  describe('GROUP S — Single-rule reachability', () => {
    it('S1 transitioning via rule 1', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'a', // recent
        q5_recent_life_shape_change: 'b', // yes (something ended)
        q29_recent_reaching: 'b', // mid_stream
      });
      expect(deriveLifeStage(answers)).toBe('transitioning');
    });

    it('S2 transitioning via rule 2', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'b', // sustained (avoid rule 1)
        q29_recent_reaching: 'a', // recent_and_awkward
      });
      expect(deriveLifeStage(answers)).toBe('transitioning');
    });

    it('S3 consolidating via rule 3', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'b', // sustained (avoid rule 1)
        q29_recent_reaching: 'c', // long_established
      });
      expect(deriveLifeStage(answers)).toBe('consolidating');
    });

    it('S4 enduring via rule 5', () => {
      const answers = makeAnswers({
        q4_life_shape_duration: 'b', // sustained (avoid rule 1)
        q29_recent_reaching: 'd', // no_current_reaching
      });
      expect(deriveLifeStage(answers)).toBe('enduring');
    });

    it('S5 drifting via rule 6 (all defaults)', () => {
      const answers = makeAnswers();
      expect(deriveLifeStage(answers)).toBe('drifting');
    });
  });
});
