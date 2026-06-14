/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { runEngine } from '@/engine';
import type { InputMap } from '@/engine/types';

function makeMinimalInputMap(): InputMap {
  return {
    directions: {
      contributor: {
        stated_strength: 50,
        felt_cost: 50,
        anticipation: 'none',
        current_movement: 50,
        recent_action: 'none',
        past_presence: 'no',
        specificity: 'none',
        would_reach_for: 'no',
        saturation: 'no',
        stopped_expecting: 'no',
      },
      creator: {
        stated_strength: 50,
        felt_cost: 50,
        anticipation: 'none',
        current_movement: 50,
        recent_action: 'none',
        past_presence: 'no',
        specificity: 'none',
        would_reach_for: 'no',
        saturation: 'no',
        stopped_expecting: 'no',
      },
      experience_seeker: {
        stated_strength: 50,
        felt_cost: 50,
        anticipation: 'none',
        current_movement: 50,
        recent_action: 'none',
        past_presence: 'no',
        specificity: 'none',
        would_reach_for: 'no',
        saturation: 'no',
        stopped_expecting: 'no',
      },
      freedom_designer: {
        stated_strength: 50,
        felt_cost: 50,
        anticipation: 'none',
        current_movement: 50,
        recent_action: 'none',
        past_presence: 'no',
        specificity: 'none',
        would_reach_for: 'no',
        saturation: 'no',
        stopped_expecting: 'no',
      },
      growth_focused: {
        stated_strength: 50,
        felt_cost: 50,
        anticipation: 'none',
        current_movement: 50,
        recent_action: 'none',
        past_presence: 'no',
        specificity: 'none',
        would_reach_for: 'no',
        saturation: 'no',
        stopped_expecting: 'no',
      },
      relationship_rebuilder: {
        stated_strength: 50,
        felt_cost: 50,
        anticipation: 'none',
        current_movement: 50,
        recent_action: 'none',
        past_presence: 'no',
        specificity: 'none',
        would_reach_for: 'no',
        saturation: 'no',
        stopped_expecting: 'no',
      },
    },
    cross_direction: {
      direction_chosen: 'none',
      capacity_strain: 'no',
      life_shape_duration: 'recent',
      week_shape: {
        work_dominates: false,
        weekends_consumed: false,
        weekly_activity: false,
        sees_people: false,
        makes_things: false,
        active_body: false,
        belongs_to_group: false,
        solo_practice: false,
        varied_week: false,
      },
      life_stage: 'drifting',
      sociality_default: 'balanced',
      paid_work_relationship: 'functional',
      primary_load: 'none',
      psychological_filtering: 'filters_some',
      role_consolidation: 'role_inflected',
      attention_pattern: 'intermittent',
      relational_presence: 'partial',
    },
    domains: {
      time_as_yours: { current_state: 50, past_presence: 'yes' },
      energy_as_resource: { current_state: 50, past_presence: 'yes' },
      felt_aliveness: { current_state: 50, past_presence: 'yes' },
      body_physical_aliveness: { current_state: 50, past_presence: 'yes' },
      curiosity: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      making: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      conversation_depth: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      being_known: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      friendship: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      intimacy: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      mattering: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
      spiritual: { current_state: 50, past_presence: 'yes', wanting: 'wants' },
    },
    constraints: {
      energy_availability: 50,
      time_availability: 50,
      body_capacity: 50,
      permission: 50,
      permission_sub_shape: 'present',
    },
    cross_cutting: {
      recent_life_shape_change: 'no',
      replacement_structure_exists: 'yes',
      recent_reaching: 'mid_stream',
    },
    self_report: {
      named_absences: [],
    },
  };
}

describe('B5 — specificity-none-count computation (conjunct dropped)', () => {
  describe('THE DISCRIMINATING CASE — proves conjunct was dropped', () => {
    it('specificity=none + would_reach_for=yes NOW counts (old rule excluded it)', () => {
      // Setup: pf='filters_some' so high threshold is noneCount >= 4
      // Set 3 directions with specificity='none' AND would_reach_for='no' (old count = 3, new count = 3)
      // Set the chosen direction with specificity='none' AND would_reach_for='yes' (old count = 3, new count = 4)
      // Under OLD rule: noneCount = 3 (chosen direction excluded due to would_reach_for='yes'), so psychological_narrowing_band would NOT be 'high'
      // Under NEW rule: noneCount = 4 (chosen direction included), so psychological_narrowing_band IS 'high'
      const input = makeMinimalInputMap();
      input.directions.contributor.specificity = 'none';
      input.directions.contributor.would_reach_for = 'yes'; // THE KEY: chosen direction with specificity='none' and would_reach_for='yes'
      input.directions.creator.specificity = 'none';
      input.directions.creator.would_reach_for = 'no';
      input.directions.experience_seeker.specificity = 'none';
      input.directions.experience_seeker.would_reach_for = 'no';
      input.directions.freedom_designer.specificity = 'none';
      input.directions.freedom_designer.would_reach_for = 'no';
      input.directions.growth_focused.specificity = 'partial';
      input.directions.relationship_rebuilder.specificity = 'partial';
      input.cross_direction.direction_chosen = 'contributor'; // Must match the direction with would_reach_for='yes'
      input.cross_direction.psychological_filtering = 'filters_some';

      const result = runEngine(input);
      if (!result.ok) {
        console.log('Validation errors:', result.errors);
      }
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Under NEW rule: noneCount = 4, so band should be 'high'
        expect(result.output.cross_direction.psychological_narrowing_band).toBe('high');
        // Under OLD rule: noneCount would be 3, so band would be 'moderate' (not 'high')
      }
    });
  });

  describe('PLAIN CASE — unchanged behaviour confirmed', () => {
    it('several directions specificity=none with would_reach_for=no → count includes them all', () => {
      // Setup: pf='does_not_filter' so moderate threshold is noneCount >= 3
      // Set 3 directions with specificity='none' AND would_reach_for='no'
      // Under both old and new rules: noneCount = 3, so psychological_narrowing_band = 'moderate'
      const input = makeMinimalInputMap();
      input.directions.contributor.specificity = 'none';
      input.directions.contributor.would_reach_for = 'no';
      input.directions.creator.specificity = 'none';
      input.directions.creator.would_reach_for = 'no';
      input.directions.experience_seeker.specificity = 'none';
      input.directions.experience_seeker.would_reach_for = 'no';
      input.directions.freedom_designer.specificity = 'partial';
      input.directions.growth_focused.specificity = 'partial';
      input.directions.relationship_rebuilder.specificity = 'partial';
      input.cross_direction.psychological_filtering = 'does_not_filter';

      const result = runEngine(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Under both rules: noneCount = 3, so band should be 'moderate'
        expect(result.output.cross_direction.psychological_narrowing_band).toBe('moderate');
      }
    });
  });
});
