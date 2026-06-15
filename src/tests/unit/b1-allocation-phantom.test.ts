/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { computeDirectionOutputs } from '@/engine/scoring/direction';
import type {
  InputMap,
  PerDirectionInputs,
  DirectionName,
  DomainName,
  DomainPresenceOutput,
  DirectionOutput,
} from '@/engine/types';

const DOMAIN_NAMES: readonly DomainName[] = [
  'time_as_yours',
  'energy_as_resource',
  'felt_aliveness',
  'body_physical_aliveness',
  'curiosity',
  'making',
  'conversation_depth',
  'being_known',
  'friendship',
  'intimacy',
  'mattering',
  'spiritual',
];

function makePhantomDirection(stated_allocation: number): PerDirectionInputs {
  return {
    stated_strength: 40, // below old phantom threshold (70), below preA old threshold (50)
    felt_cost: 20, // < 30
    anticipation: 'mild', // mild/none
    current_movement: 30,
    recent_action: 'none',
    past_presence: 'no',
    specificity: 'partial',
    would_reach_for: 'no',
    saturation: 'no',
    stopped_expecting: 'no',
    stated_allocation,
  };
}

function makeDomainOutputs(
  overrides: Partial<Record<DomainName, Partial<DomainPresenceOutput>>> = {},
): DomainPresenceOutput[] {
  return DOMAIN_NAMES.map((name) => ({
    domain: name,
    current_state: 80,
    fires: false,
    value: 'intact',
    ...overrides[name],
  }));
}

function findDirection(out: DirectionOutput[], name: DirectionName): DirectionOutput {
  return out.find((d) => d.direction === name)!;
}

function makeMinimalInputMap(directionName: DirectionName, stated_allocation: number): InputMap {
  return {
    directions: {
      contributor: makePhantomDirection(stated_allocation),
      experience_seeker: makePhantomDirection(stated_allocation),
      freedom_designer: makePhantomDirection(stated_allocation),
      growth_focused: makePhantomDirection(stated_allocation),
      creator: makePhantomDirection(stated_allocation),
      relationship_rebuilder: makePhantomDirection(stated_allocation),
    },
    cross_direction: {
      direction_chosen: directionName,
      capacity_strain: 'no',
      life_shape_duration: 'sustained',
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
      psychological_filtering: 'does_not_filter',
      role_consolidation: 'holds_other_selves',
      attention_pattern: 'engaged',
      relational_presence: 'present',
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

describe('B1 — allocation-phantom gate-widening and branch re-pointing', () => {
  describe('Target (i): branch boundary — phantom fires at HIGH (50), does not fire below PARTIAL (35)', () => {
    it('stated_allocation = 50 (HIGH) with phantom-shape → fires phantom', () => {
      const input = makeMinimalInputMap('creator', 50);
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).toContain('phantom');
    });

    it('stated_allocation = 40 (between PARTIAL and HIGH) with phantom-shape → fires phantom_partial', () => {
      const input = makeMinimalInputMap('creator', 40);
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).toContain('phantom_partial');
    });

    it('stated_allocation = 30 (below PARTIAL) with phantom-shape → does NOT fire phantom or phantom_partial', () => {
      const input = makeMinimalInputMap('creator', 30);
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).not.toContain('phantom');
      expect(creator.pull_quality).not.toContain('phantom_partial');
    });

    it('stated_allocation = 25 (below FLOOR) with phantom-shape → does NOT fire phantom or phantom_partial', () => {
      const input = makeMinimalInputMap('creator', 25);
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).not.toContain('phantom');
      expect(creator.pull_quality).not.toContain('phantom_partial');
    });
  });

  describe('Target (ii): GATE TRANSITION — proves preA widening does the work', () => {
    it('stated_allocation = 30 (FLOOR) with low pull, low stated_strength, past_presence no → passes preA and fires real (not phantom, since 30 < PARTIAL)', () => {
      // This input would have FAILED the old preA:
      // - pull < 30 (we'll set it low via direction inputs)
      // - stated_strength < 50 (we set it to 40)
      // - past_presence no (preB requires past_presence yes, so preB also fails)
      // With the B1 change, stated_allocation >= 30 should admit it through preA.
      const input = makeMinimalInputMap('creator', 30);
      // Override to ensure pull is low (pull is computed, but we can influence it via stated_strength being low)
      // The key is that stated_strength is 40 (< 50), so the old preA would fail on that conjunct.
      // With B1, stated_allocation = 30 should admit it.
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      // Should reach the branch (preA passed) but not fire phantom_partial (30 < PARTIAL=35)
      // It should fire 'real' as the fallback
      expect(creator.pull_quality).toContain('real');
      expect(creator.pull_quality).not.toContain('phantom');
      expect(creator.pull_quality).not.toContain('phantom_partial');
    });

    it('stated_allocation = 35 (PARTIAL) with low pull, low stated_strength, past_presence no → fires phantom_partial', () => {
      const input = makeMinimalInputMap('creator', 35);
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      // Should reach the branch (preA passed via stated_allocation >= 30) and fire phantom_partial (35 >= 35)
      expect(creator.pull_quality).toContain('phantom_partial');
    });

    it('POSITIVE gate-transition proof: stated_allocation = 50 (HIGH) with pull < 30, stated_strength < 50, past_presence no → fires phantom', () => {
      // This input proves BOTH the gate-widening AND the branch re-point together.
      // Under the OLD preA (pull>=30 || stated_strength>=50), this input returns []:
      // - pull = 0.3*40 + 0.2*20 + 0.2*0 + 0.2*0 + 0.1*0 = 12 + 4 = 16 < 30
      // - stated_strength = 40 < 50
      // - preB requires past_presence yes, which is 'no' here
      // Under B1's widened preA, it clears via stated_allocation>=FLOOR (50 >= 30),
      // reaches the branch, and fires phantom via stated_allocation>=HIGH (50 >= 50).
      const input = makeMinimalInputMap('creator', 50);
      // Override to ensure pull is genuinely < 30 by setting specificity to 'none'
      input.directions.creator.specificity = 'none';
      input.directions.creator.anticipation = 'none';
      // Pull computation: 0.3*40 + 0.2*20 + 0.2*0 + 0.2*0 + 0.1*0 = 16 < 30 ✓
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).toContain('phantom');
    });

    it('NEGATIVE control: same phantom shape but stated_allocation unset (0) → does NOT fire phantom or phantom_partial', () => {
      // This confirms that without the allocation signal, a phantom-shaped input
      // does NOT fire phantom — proving that the allocation signal is what's doing the work,
      // and that existing producerless inputs cannot accidentally trip phantom.
      const input = makeMinimalInputMap('creator', 0); // stated_allocation = 0 (unset)
      input.directions.creator.specificity = 'none';
      input.directions.creator.anticipation = 'none';
      // Pull = 16 < 30, stated_strength = 40 < 50, past_presence = 'no'
      // Under old preA: fails (no pull, no stated_strength, no preB)
      // Under B1: stated_allocation = 0 < FLOOR, so still fails preA
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).not.toContain('phantom');
      expect(creator.pull_quality).not.toContain('phantom_partial');
    });
  });

  describe('Interaction coverage — mutual exclusivity and co-firing', () => {
    it('PHANTOM vs PHANTOM_PARTIAL mutual exclusivity: stated_allocation >= 50 fires phantom only', () => {
      const input = makeMinimalInputMap('creator', 50);
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).toContain('phantom');
      expect(creator.pull_quality).not.toContain('phantom_partial');
    });

    it('PHANTOM vs PHANTOM_PARTIAL mutual exclusivity: 35 <= stated_allocation < 50 fires phantom_partial only', () => {
      const input = makeMinimalInputMap('creator', 40);
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).toContain('phantom_partial');
      expect(creator.pull_quality).not.toContain('phantom');
    });

    it('PHANTOM_PARTIAL alone: stated_allocation=40 fires phantom_partial in isolation', () => {
      const input = makeMinimalInputMap('creator', 40);
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).toContain('phantom_partial');
      expect(creator.pull_quality).not.toContain('phantom');
      expect(creator.pull_quality).not.toContain('saturated');
      expect(creator.pull_quality).not.toContain('behaviourally_divergent');
    });

    it('Phantom suppresses saturated (incoherent co-firing)', () => {
      const input = makeMinimalInputMap('creator', 50);
      input.directions.creator.saturation = 'yes';
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).toContain('phantom');
      expect(creator.pull_quality).not.toContain('saturated');
    });

    it('PHANTOM BLOCKS BEHAVIOURALLY_DIVERGENT: phantom fires, bdiv suppressed', () => {
      // Construct input where both phantom and behaviourally_divergent preconditions would hold
      // Phantom: stated_allocation >= 50, felt_cost < 30, anticipation mild/none
      // Behaviourally_divergent: stated_strength >= 60, directionChosen !== this direction, directionChosen !== 'none'
      const input = makeMinimalInputMap('creator', 50);
      input.directions.creator.stated_strength = 70; // >= 60 for bdiv
      input.cross_direction.direction_chosen = 'contributor'; // !== creator, !== 'none'
      const result = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creator = findDirection(result, 'creator');
      expect(creator.pull_quality).toContain('phantom');
      expect(creator.pull_quality).not.toContain('behaviourally_divergent');
    });
  });
});
