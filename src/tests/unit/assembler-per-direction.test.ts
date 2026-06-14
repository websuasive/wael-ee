import { describe, it, expect } from 'vitest';
import type { PerDirectionInputs } from '@/engine/types';
import { buildPerDirections } from '@/assembler/per-direction';
import { makeAnswers } from '@/tests/helpers/make-answers';

describe('buildPerDirections', () => {
  describe('VITALITY (item 1)', () => {
    it('V1 compute-once / hand-computed mean: vitality >= 45 routes to rule 8 (55), vitality < 45 routes to rule 9 (40)', () => {
      // Case 1: mean = 50 (>= 45) -> rule 8 -> 55
      const answersHighVitality = makeAnswers({
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
        },
        per_direction_card_b: {
          contributor: 'b',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_a: {
          contributor: 'b',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        q8_past_presence_ticked: ['contributor'],
        q9_stopped_expecting_ticked: [],
      });
      const resultHigh = buildPerDirections('user-123', answersHighVitality);
      // contributor: anticipation=mild, stopped_expecting=no, current_movement=33 (<60), past_presence=yes -> routes to rule 8 if vitality>=45
      expect(resultHigh.contributor.felt_cost).toBe(55);

      // Case 2: mean = 40 (< 45) -> rule 9 -> 40
      const answersLowVitality = makeAnswers({
        domain_current_state: {
          time_as_yours: 40,
          energy_as_resource: 40,
          felt_aliveness: 40,
          body_physical_aliveness: 40,
          curiosity: 40,
          making: 40,
          conversation_depth: 40,
          being_known: 40,
          friendship: 40,
          intimacy: 40,
          mattering: 40,
          spiritual: 40,
        },
        per_direction_card_b: {
          contributor: 'b',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_a: {
          contributor: 'b',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        q8_past_presence_ticked: ['contributor'],
        q9_stopped_expecting_ticked: [],
      });
      const resultLow = buildPerDirections('user-123', answersLowVitality);
      // Same observable shape, but vitality < 45 -> routes to rule 9
      expect(resultLow.contributor.felt_cost).toBe(40);
    });
  });

  describe('COMPOSITION (item 2)', () => {
    it('C1 a fully-specified direction composes all ten fields with the right values', () => {
      const answers = makeAnswers({
        per_direction_card_a: {
          contributor: 'c',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'c',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c',
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
        q8_past_presence_ticked: ['contributor'],
        q9_stopped_expecting_ticked: [],
        q10_direction_chosen: 'contributor',
      });
      const result = buildPerDirections('user-123', answers);
      const contributor = result.contributor;

      // Observable fields (7)
      expect(contributor.current_movement).toBe(67);
      expect(contributor.recent_action).toBe('recent');
      expect(contributor.anticipation).toBe('quickening');
      expect(contributor.specificity).toBe('strong');
      expect(contributor.past_presence).toBe('yes');
      expect(contributor.stopped_expecting).toBe('no');
      expect(contributor.would_reach_for).toBe('yes');

      // Derived fields (3)
      expect(contributor.stated_strength).toBe(64); // anticipation=quickening -> 64
      expect(contributor.felt_cost).toBe(80); // strong + quickening -> 80
      expect(contributor.saturation).toBe('no'); // current_movement=67, anticipation=quickening -> no
    });
  });

  describe('HEADLINE CHECK (item 3)', () => {
    it('H1 STRUCTURAL: composed direction has exactly the eleven keys of PerDirectionInputs, no extra', () => {
      const answers = makeAnswers({
        per_direction_card_a: {
          contributor: 'c',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_b: {
          contributor: 'c',
          experience_seeker: 'a',
          freedom_designer: 'a',
          growth_focused: 'a',
          creator: 'a',
          relationship_rebuilder: 'a',
        },
        per_direction_card_c: {
          contributor: 'c',
          experience_seeker: 'skipped',
          freedom_designer: 'skipped',
          growth_focused: 'skipped',
          creator: 'skipped',
          relationship_rebuilder: 'skipped',
        },
        q8_past_presence_ticked: ['contributor'],
        q9_stopped_expecting_ticked: [],
        q10_direction_chosen: 'contributor',
      });
      const result = buildPerDirections('user-123', answers);
      const contributor = result.contributor;

      const expectedKeys = [
        'stated_strength',
        'felt_cost',
        'anticipation',
        'current_movement',
        'recent_action',
        'past_presence',
        'specificity',
        'would_reach_for',
        'saturation',
        'stopped_expecting',
        'stated_allocation',
      ] as const;

      const actualKeys = Object.keys(contributor) as (keyof PerDirectionInputs)[];

      // No missing keys
      for (const key of expectedKeys) {
        expect(actualKeys).toContain(key);
      }

      // No extra keys
      expect(actualKeys.length).toBe(expectedKeys.length);

      // Numeric fields in 0–100
      expect(contributor.stated_strength).toBeGreaterThanOrEqual(0);
      expect(contributor.stated_strength).toBeLessThanOrEqual(100);
      expect(contributor.felt_cost).toBeGreaterThanOrEqual(0);
      expect(contributor.felt_cost).toBeLessThanOrEqual(100);
      expect(contributor.current_movement).toBeGreaterThanOrEqual(0);
      expect(contributor.current_movement).toBeLessThanOrEqual(100);

      // Enum-valued fields within allowed sets
      expect(['none', 'mild', 'quickening']).toContain(contributor.anticipation);
      expect(['none', 'some', 'recent']).toContain(contributor.recent_action);
      expect(['yes', 'no']).toContain(contributor.past_presence);
      expect(['none', 'partial', 'strong']).toContain(contributor.specificity);
      expect(['yes', 'no']).toContain(contributor.would_reach_for);
      expect(['yes', 'no']).toContain(contributor.saturation);
      expect(['yes', 'no']).toContain(contributor.stopped_expecting);
    });

    // H2 VALIDATOR: World B — full-InputMap validator check scheduled for the emit/output-contract block (step 6)
    // TODO: Full-InputMap validator check scheduled for the emit/output-contract block (step 6), where all branches are real.
    // Per-direction validation is only reachable via validateInputMap, which demands a full InputMap (domains, cross_direction, constraints, cross_cutting, self_report all present).
    // Fabricating five unbuilt branches to force the real validator early would produce guessed fixture shapes and couple this test to unrelated branches.
    // Structural-now + real-validator-at-emit is the correct split.
  });
});
