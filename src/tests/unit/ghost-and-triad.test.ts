/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { computeReachConfidence, computeReachState } from '@/engine/derivations';
import { computeDirectionOutputs } from '@/engine/scoring/direction';
import type {
  InputMap,
  PerDirectionInputs,
  DirectionName,
  DomainName,
  DomainPresenceOutput,
} from '@/engine/types';

function makeDirectionInputs(
  overrides: Partial<PerDirectionInputs> = {},
): PerDirectionInputs {
  return {
    stated_strength: 0,
    felt_cost: 0,
    anticipation: 'none',
    current_movement: 0,
    recent_action: 'none',
    past_presence: 'no',
    specificity: 'none',
    would_reach_for: 'no',
    saturation: 'no',
    stopped_expecting: 'no',
    ...overrides,
  };
}

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

function makeInputMap(overrides: {
  directions?: Partial<Record<DirectionName, Partial<PerDirectionInputs>>>;
  cross_direction?: Partial<InputMap['cross_direction']>;
} = {}): InputMap {
  const dirOverrides = overrides.directions ?? {};
  const directions = {
    contributor: makeDirectionInputs(dirOverrides.contributor),
    creator: makeDirectionInputs(dirOverrides.creator),
    experience_seeker: makeDirectionInputs(dirOverrides.experience_seeker),
    freedom_designer: makeDirectionInputs(dirOverrides.freedom_designer),
    growth_focused: makeDirectionInputs(dirOverrides.growth_focused),
    relationship_rebuilder: makeDirectionInputs(dirOverrides.relationship_rebuilder),
  };
  return {
    directions,
    cross_direction: {
      direction_chosen: 'none',
      capacity_strain: 'no',
      life_shape_duration: 'recent',
      week_shape: {
        work_dominates: true,
        weekends_consumed: true,
        weekly_activity: true,
        sees_people: true,
        makes_things: true,
        active_body: true,
        belongs_to_group: true,
        solo_practice: true,
        varied_week: true,
      },
      life_stage: 'drifting',
      sociality_default: 'balanced',
      paid_work_relationship: 'functional',
      primary_load: 'none',
      psychological_filtering: 'filters_some',
      role_consolidation: 'role_inflected',
      attention_pattern: 'intermittent',
      relational_presence: 'partial',
      ...overrides.cross_direction,
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
      spiritual: { current_state: 20, past_presence: 'no', wanting: 'doesnt_want' },
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

describe('Step 5 — ghost build: reach_confidence, reach_state, ghost label', () => {
  describe('reach_confidence — migrated from CHECK 1', () => {
    it('Branch 1: all three same direction -> high', () => {
      const result = computeReachConfidence('contributor', 'contributor', 'contributor');
      expect(result).toBe('high');
    });

    it('Branch 2: all three in {rest, none} -> high', () => {
      const result = computeReachConfidence('rest', 'rest', 'rest');
      expect(result).toBe('high');
    });

    it('Branch 2: mix rest/none -> high', () => {
      const result = computeReachConfidence('rest', 'none', 'rest');
      expect(result).toBe('high');
    });

    it('Branch 3: Q10a in {rest,none} AND Q10b is a direction -> low', () => {
      const result = computeReachConfidence('rest', 'contributor', 'rest');
      expect(result).toBe('low');
    });

    it('Branch 4: three different directions -> low', () => {
      const result = computeReachConfidence('contributor', 'creator', 'growth_focused');
      expect(result).toBe('low');
    });

    it('OTHERWISE: partial corroboration -> low', () => {
      const result = computeReachConfidence('contributor', 'contributor', 'rest');
      expect(result).toBe('low');
    });

    it('Incomplete triad (both undefined) -> low (defined, no throw)', () => {
      const result = computeReachConfidence('contributor', undefined, undefined);
      expect(result).toBe('low');
    });

    it('Incomplete triad (one undefined) -> low (defined, no throw)', () => {
      const result = computeReachConfidence('contributor', 'creator', undefined);
      expect(result).toBe('low');
    });
  });

  describe('reach_state — net-new cross-direction output', () => {
    it('all three in {rest, none} -> numb', () => {
      const result = computeReachState('rest', 'rest', 'rest');
      expect(result).toBe('numb');
    });

    it('Q10a in {rest, none} but Q10b is a direction -> buried_but_alive', () => {
      const result = computeReachState('rest', 'contributor', 'rest');
      expect(result).toBe('buried_but_alive');
    });

    it('Q10a in {rest, none} but Q10c is a direction -> buried_but_alive', () => {
      const result = computeReachState('rest', 'rest', 'contributor');
      expect(result).toBe('buried_but_alive');
    });

    it('Q10a is a direction -> surfaced', () => {
      const result = computeReachState('contributor', 'contributor', 'contributor');
      expect(result).toBe('surfaced');
    });

    it('Incomplete triad (both undefined) -> null', () => {
      const result = computeReachState('contributor', undefined, undefined);
      expect(result).toBeNull();
    });

    it('Incomplete triad (one undefined) -> null', () => {
      const result = computeReachState('contributor', 'creator', undefined);
      expect(result).toBeNull();
    });
  });

  describe('ghost label — pull-quality with guard', () => {
    it('GUARD — both undefined: triad incomplete blocks ghost', () => {
      // If the triadComplete guard were absent, ghost would fire here:
      // direction='creator' is NOT direction_chosen='contributor', and
      // the membership tests against undefined fields are vacuously true.
      // The guard is what prevents this production-inert case from firing.
      const input = makeInputMap({
        directions: {
          creator: {
            anticipation: 'quickening',
            specificity: 'strong',
            felt_cost: 50,
          },
        },
        cross_direction: {
          direction_chosen: 'contributor',
        },
      });
      const outputs = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creatorOutput = outputs.find((d) => d.direction === 'creator');
      expect(creatorOutput?.pull_quality).not.toContain('ghost');
    });

    it('GUARD — one undefined (reach_retrospective set, reach_counterfactual undefined)', () => {
      const input = makeInputMap({
        directions: {
          creator: {
            anticipation: 'quickening',
            specificity: 'strong',
            felt_cost: 50,
          },
        },
        cross_direction: {
          direction_chosen: 'contributor',
          reach_retrospective: 'growth_focused',
        },
      });
      const outputs = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creatorOutput = outputs.find((d) => d.direction === 'creator');
      expect(creatorOutput?.pull_quality).not.toContain('ghost');
    });

    it('GUARD — one undefined (reach_counterfactual set, reach_retrospective undefined)', () => {
      const input = makeInputMap({
        directions: {
          creator: {
            anticipation: 'quickening',
            specificity: 'strong',
            felt_cost: 50,
          },
        },
        cross_direction: {
          direction_chosen: 'contributor',
          reach_counterfactual: 'growth_focused',
        },
      });
      const outputs = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creatorOutput = outputs.find((d) => d.direction === 'creator');
      expect(creatorOutput?.pull_quality).not.toContain('ghost');
    });

    it('POSITIVE — complete triad, ghost fires', () => {
      const input = makeInputMap({
        directions: {
          creator: {
            anticipation: 'quickening',
            specificity: 'strong',
            felt_cost: 50,
          },
        },
        cross_direction: {
          direction_chosen: 'contributor',
          reach_retrospective: 'growth_focused',
          reach_counterfactual: 'experience_seeker',
        },
      });
      const outputs = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creatorOutput = outputs.find((d) => d.direction === 'creator');
      expect(creatorOutput?.pull_quality).toContain('ghost');
    });

    it('NEGATIVE — complete triad, ghost does not fire (direction is among picks)', () => {
      const input = makeInputMap({
        directions: {
          creator: {
            anticipation: 'quickening',
            specificity: 'strong',
            felt_cost: 50,
          },
        },
        cross_direction: {
          direction_chosen: 'contributor',
          reach_retrospective: 'creator',
          reach_counterfactual: 'growth_focused',
        },
      });
      const outputs = computeDirectionOutputs(input, makeDomainOutputs(), 0);
      const creatorOutput = outputs.find((d) => d.direction === 'creator');
      expect(creatorOutput?.pull_quality).not.toContain('ghost');
    });

    it('felt_cost tripwire: ghost condition does not read felt_cost', () => {
      const inputLowCost = makeInputMap({
        directions: {
          creator: {
            anticipation: 'quickening',
            specificity: 'strong',
            felt_cost: 10,
          },
        },
        cross_direction: {
          direction_chosen: 'contributor',
          reach_retrospective: 'growth_focused',
          reach_counterfactual: 'experience_seeker',
        },
      });
      const inputHighCost = makeInputMap({
        directions: {
          creator: {
            anticipation: 'quickening',
            specificity: 'strong',
            felt_cost: 90,
          },
        },
        cross_direction: {
          direction_chosen: 'contributor',
          reach_retrospective: 'growth_focused',
          reach_counterfactual: 'experience_seeker',
        },
      });
      const outputsLow = computeDirectionOutputs(inputLowCost, makeDomainOutputs(), 0);
      const outputsHigh = computeDirectionOutputs(inputHighCost, makeDomainOutputs(), 0);
      const creatorLow = outputsLow.find((d) => d.direction === 'creator');
      const creatorHigh = outputsHigh.find((d) => d.direction === 'creator');
      expect(creatorLow?.pull_quality).toEqual(creatorHigh?.pull_quality);
      expect(creatorLow?.pull_quality).toContain('ghost');
    });
  });
});
