import { describe, it, expect } from 'vitest';
import { buildPerDirectionObservables } from '@/assembler/per-direction-observable';
import { makeAnswers } from '@/tests/helpers/make-answers';

describe('buildPerDirectionObservables', () => {
  describe('GROUP G — card-c gating (LOAD-BEARING)', () => {
    it('G1 gate closed, card c skipped: card b = "does nothing" (anticipation=none), card c absent -> specificity = none', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'a',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'skipped',
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.specificity).toBe('none');
      expect(result.experience_seeker.specificity).toBe('none');
    });

    it('G2 gate closed, stray card-c value: card b = "does nothing", card c = "specific thing" present -> specificity = none', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'a',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c',
          experience_seeker: 'c',
          freedom_designer: 'c',
          growth_focused: 'c',
          creator: 'c',
          relationship_rebuilder: 'c',
        },
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.specificity).toBe('none');
      expect(result.experience_seeker.specificity).toBe('none');
    });

    it('G3 gate open, partial: card b = "wouldn\'t mind" (mild), card c = "vague notion" -> specificity = partial', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'b',
          experience_seeker: 'b',
          freedom_designer: 'b',
          growth_focused: 'b',
          creator: 'b',
          relationship_rebuilder: 'b',
        },
        per_direction_card_c: {
          contributor: 'b',
          experience_seeker: 'b',
          freedom_designer: 'b',
          growth_focused: 'b',
          creator: 'b',
          relationship_rebuilder: 'b',
        },
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.specificity).toBe('partial');
    });

    it('G4 gate open, strong: card b = "genuinely want" (quickening), card c = "specific" -> specificity = strong', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'c',
          experience_seeker: 'c',
          freedom_designer: 'c',
          growth_focused: 'c',
          creator: 'c',
          relationship_rebuilder: 'c',
        },
        per_direction_card_c: {
          contributor: 'c',
          experience_seeker: 'c',
          freedom_designer: 'c',
          growth_focused: 'c',
          creator: 'c',
          relationship_rebuilder: 'c',
        },
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.specificity).toBe('strong');
    });

    it('G5 gate open, maps to none: card b = mild, card c = "just the general idea" -> specificity = none', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'b',
          experience_seeker: 'b',
          freedom_designer: 'b',
          growth_focused: 'b',
          creator: 'b',
          relationship_rebuilder: 'b',
        },
        per_direction_card_c: {
          contributor: 'a',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.specificity).toBe('none');
    });
  });

  describe('GROUP M — straight maps (PROPORTIONATE/light)', () => {
    it('M1 current_movement: card a a/b/c/d -> 0/33/67/100', () => {
      const answers = makeAnswers({
        per_direction_card_a: {
          contributor: 'a',
          experience_seeker: 'b',
          freedom_designer: 'c',
          growth_focused: 'd',
          creator: 'a',
          relationship_rebuilder: 'b',
        },
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.current_movement).toBe(0);
      expect(result.experience_seeker.current_movement).toBe(33);
      expect(result.freedom_designer.current_movement).toBe(67);
      expect(result.growth_focused.current_movement).toBe(100);
    });

    it('M2 recent_action: card a a/b/c/d -> none/some/recent/recent (c AND d both -> recent)', () => {
      const answers = makeAnswers({
        per_direction_card_a: {
          contributor: 'a',
          experience_seeker: 'b',
          freedom_designer: 'c',
          growth_focused: 'd',
          creator: 'a',
          relationship_rebuilder: 'b',
        },
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.recent_action).toBe('none');
      expect(result.experience_seeker.recent_action).toBe('some');
      expect(result.freedom_designer.recent_action).toBe('recent');
      expect(result.growth_focused.recent_action).toBe('recent');
    });

    it('M3 anticipation: card b a/b/c -> none/mild/quickening', () => {
      const answers = makeAnswers({
        per_direction_card_b: {
          contributor: 'a',
          experience_seeker: 'b',
          freedom_designer: 'c',
          growth_focused: 'a',
          creator: 'b',
          relationship_rebuilder: 'c',
        },
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.anticipation).toBe('none');
      expect(result.experience_seeker.anticipation).toBe('mild');
      expect(result.freedom_designer.anticipation).toBe('quickening');
    });

    it('M4 past_presence: one direction ticked in Q8 -> yes; one not ticked -> no', () => {
      const answers = makeAnswers({
        q8_past_presence_ticked: ['contributor', 'experience_seeker'],
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.past_presence).toBe('yes');
      expect(result.experience_seeker.past_presence).toBe('yes');
      expect(result.freedom_designer.past_presence).toBe('no');
    });

    it('M5 stopped_expecting: one direction ticked in Q9 -> yes; one not ticked -> no', () => {
      const answers = makeAnswers({
        q9_stopped_expecting_ticked: ['contributor', 'experience_seeker'],
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.stopped_expecting).toBe('yes');
      expect(result.experience_seeker.stopped_expecting).toBe('yes');
      expect(result.freedom_designer.stopped_expecting).toBe('no');
    });

    it('M6 would_reach_for: direction_chosen = a direction -> that direction yes AND the other five no', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'contributor',
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.would_reach_for).toBe('yes');
      expect(result.experience_seeker.would_reach_for).toBe('no');
      expect(result.freedom_designer.would_reach_for).toBe('no');
      expect(result.growth_focused.would_reach_for).toBe('no');
      expect(result.creator.would_reach_for).toBe('no');
      expect(result.relationship_rebuilder.would_reach_for).toBe('no');
    });

    it('M7 would_reach_for: direction_chosen = g/h (rest/none) -> all six no', () => {
      const answers = makeAnswers({
        q10_direction_chosen: 'rest',
      });
      const result = buildPerDirectionObservables(answers);
      expect(result.contributor.would_reach_for).toBe('no');
      expect(result.experience_seeker.would_reach_for).toBe('no');
      expect(result.freedom_designer.would_reach_for).toBe('no');
      expect(result.growth_focused.would_reach_for).toBe('no');
      expect(result.creator.would_reach_for).toBe('no');
      expect(result.relationship_rebuilder.would_reach_for).toBe('no');
    });
  });
});
