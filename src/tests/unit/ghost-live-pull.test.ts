/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { computeDirectionOutputs } from '@/engine/scoring/direction';

function makeDirectionInputs(
  overrides: any = {},
): any {
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

const DOMAIN_NAMES: any = [
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
  overrides: any = {},
): any {
  const result: any = [];
  for (let i = 0; i < DOMAIN_NAMES.length; i++) {
    const name = DOMAIN_NAMES[i];
    result.push({
      domain: name,
      current_state: 80,
      fires: false,
      value: 'intact',
      ...overrides[name],
    });
  }
  return result;
}

function makeInputMap(overrides: any = {}): any {
  const dirOverrides = overrides.directions || {};
  const directions: any = {
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

describe('ghost live-pull routing — suppressed from presentation, preserved for information', () => {
  describe('SUPPRESSED-FROM-PRESENTATION', () => {
    it('ghost direction: surfaced=false despite high raw pull', () => {
      const input = makeInputMap();
      // Ghost shape: complete triad + ghost guard conditions
      input.cross_direction.direction_chosen = 'contributor';
      input.cross_direction.reach_retrospective = 'creator';
      input.cross_direction.reach_counterfactual = 'growth_focused';
      // Ghost direction: experience_seeker (not in triad, quickening, strong, high pull)
      input.directions.experience_seeker = makeDirectionInputs({
        anticipation: 'quickening',
        specificity: 'strong',
        stated_strength: 80,
        current_movement: 0,
      });
      // Non-ghost direction with moderate pull to ensure it wins when ghost is suppressed
      input.directions.contributor = makeDirectionInputs({
        stated_strength: 40,
        current_movement: 0,
        would_reach_for: 'yes',
      });

      const domainOutputs = makeDomainOutputs();
      const result = computeDirectionOutputs(input, domainOutputs, 50);
      let ghostDir: any = null;
      const dirs: any = result;
      for (let i = 0; i < dirs.length; i++) {
        if (dirs[i] && dirs[i].direction === 'experience_seeker') {
          ghostDir = dirs[i];
          break;
        }
      }
      expect(ghostDir).toBeDefined();
      // SUPPRESSED-FROM-PRESENTATION: ghost direction should NOT surface despite high raw pull
      expect(ghostDir.surfaced).toBe(false);
      // PRESERVED-FOR-INFORMATION: raw pull remains high (synthesis can read it)
      expect(ghostDir.pull).toBeGreaterThan(50);
      // Ghost label is present
      let hasGhost = false;
      for (let i = 0; i < ghostDir.pull_quality.length; i++) {
        if (ghostDir.pull_quality[i] === 'ghost') {
          hasGhost = true;
          break;
        }
      }
      expect(hasGhost).toBe(true);
    });

    it('ghost direction: does NOT sort to position 0 (live ordering)', () => {
      const input = makeInputMap();
      input.cross_direction.direction_chosen = 'contributor';
      input.cross_direction.reach_retrospective = 'creator';
      input.cross_direction.reach_counterfactual = 'growth_focused';
      // Ghost direction with highest raw pull
      input.directions.experience_seeker = makeDirectionInputs({
        anticipation: 'quickening',
        specificity: 'strong',
        stated_strength: 90,
        current_movement: 90,
      });
      // Non-ghost direction with lower pull
      input.directions.contributor = makeDirectionInputs({
        stated_strength: 70,
        current_movement: 70,
      });

      const domainOutputs = makeDomainOutputs();
      const result = computeDirectionOutputs(input, domainOutputs, 50);
      const dirs: any = result;
      // Ghost direction should NOT be at position 0 despite highest raw pull
      expect(dirs[0].direction).not.toBe('experience_seeker');
      // A non-ghost direction should be at position 0
      expect(dirs[0].direction).toBe('contributor');
      // PRESERVED-FOR-INFORMATION: ghost direction's raw pull remains high
      let ghostDir: any = null;
      for (let i = 0; i < dirs.length; i++) {
        if (dirs[i] && dirs[i].direction === 'experience_seeker') {
          ghostDir = dirs[i];
          break;
        }
      }
      expect(ghostDir).toBeDefined();
      expect(ghostDir.pull).toBeGreaterThan(50);
    });

    it('ghost direction: quadrant reflects suppressed (live) pull, not raw high pull', () => {
      const input = makeInputMap();
      input.cross_direction.direction_chosen = 'contributor';
      input.cross_direction.reach_retrospective = 'creator';
      input.cross_direction.reach_counterfactual = 'growth_focused';
      // Ghost direction with high raw pull (would be 'active' if not suppressed)
      input.directions.experience_seeker = makeDirectionInputs({
        anticipation: 'quickening',
        specificity: 'strong',
        stated_strength: 80,
        current_movement: 80,
      });

      const domainOutputs = makeDomainOutputs();
      const result = computeDirectionOutputs(input, domainOutputs, 50);
      let ghostDir: any = null;
      const dirs: any = result;
      for (let i = 0; i < dirs.length; i++) {
        if (dirs[i] && dirs[i].direction === 'experience_seeker') {
          ghostDir = dirs[i];
          break;
        }
      }
      expect(ghostDir).toBeDefined();
      // With live-pull suppressed to 0 and movement=80, quadrant should be 'habit' (low pull, high movement)
      expect(ghostDir.quadrant).toBe('habit');
      // PRESERVED-FOR-INFORMATION: raw pull remains high
      expect(ghostDir.pull).toBeGreaterThan(50);
    });

    it('ghost direction: capacity-strain pull_state reflects suppressed (live) pull', () => {
      const input = makeInputMap();
      input.cross_direction.direction_chosen = 'contributor';
      input.cross_direction.reach_retrospective = 'creator';
      input.cross_direction.reach_counterfactual = 'growth_focused';
      input.cross_direction.capacity_strain = 'yes';
      // Ghost direction with high raw pull (would trigger capacity_strain if not suppressed)
      input.directions.experience_seeker = makeDirectionInputs({
        anticipation: 'quickening',
        specificity: 'strong',
        stated_strength: 80,
        current_movement: 80,
      });

      const domainOutputs = makeDomainOutputs();
      const result = computeDirectionOutputs(input, domainOutputs, 50);
      let ghostDir: any = null;
      const dirs: any = result;
      for (let i = 0; i < dirs.length; i++) {
        if (dirs[i] && dirs[i].direction === 'experience_seeker') {
          ghostDir = dirs[i];
          break;
        }
      }
      expect(ghostDir).toBeDefined();
      // With live-pull suppressed to 0, capacity_strain should NOT be in pull_state
      let hasCapacityStrain = false;
      for (let i = 0; i < ghostDir.pull_state.length; i++) {
        if (ghostDir.pull_state[i] === 'capacity_strain') {
          hasCapacityStrain = true;
          break;
        }
      }
      expect(hasCapacityStrain).toBe(false);
      // PRESERVED-FOR-INFORMATION: raw pull remains high
      expect(ghostDir.pull).toBeGreaterThan(50);
    });

    it('ghost direction: past_relationship reflects suppressed (live) pull', () => {
      const input = makeInputMap();
      input.cross_direction.direction_chosen = 'contributor';
      input.cross_direction.reach_retrospective = 'creator';
      input.cross_direction.reach_counterfactual = 'growth_focused';
      // Ghost direction with high raw pull and past_presence='yes' (would be 'returning' if not suppressed)
      input.directions.experience_seeker = makeDirectionInputs({
        anticipation: 'quickening',
        specificity: 'strong',
        stated_strength: 80,
        current_movement: 80,
        past_presence: 'yes',
      });

      const domainOutputs = makeDomainOutputs();
      const result = computeDirectionOutputs(input, domainOutputs, 50);
      let ghostDir: any = null;
      const dirs: any = result;
      for (let i = 0; i < dirs.length; i++) {
        if (dirs[i] && dirs[i].direction === 'experience_seeker') {
          ghostDir = dirs[i];
          break;
        }
      }
      expect(ghostDir).toBeDefined();
      // With live-pull suppressed to 0, past_relationship should be 'was_once' (not 'returning')
      expect(ghostDir.past_relationship).toBe('was_once');
      // PRESERVED-FOR-INFORMATION: raw pull remains high
      expect(ghostDir.pull).toBeGreaterThan(50);
      // Note: this routing rests on the DirectionPanel.vue inspection/debug consumer (the only visible past_relationship consumer today) per the recalibration trail — so if a man-facing consumer later needs different treatment, the test's rationale is traceable rather than looking like settled doctrine.
    });
  });

  describe('CONTROL — non-ghost direction with same high pull', () => {
    it('non-ghost direction: surfaces and sorts to top with same high pull', () => {
      const input = makeInputMap();
      // No ghost triad (reach fields undefined)
      input.cross_direction.reach_retrospective = 'none' as any;
      input.cross_direction.reach_counterfactual = 'none' as any;
      // Non-ghost direction with high pull
      input.directions.contributor = makeDirectionInputs({
        stated_strength: 80,
        current_movement: 80,
      });

      const domainOutputs = makeDomainOutputs();
      const result = computeDirectionOutputs(input, domainOutputs, 50);
      let nonGhostDir: any = null;
      const dirs: any = result;
      for (let i = 0; i < dirs.length; i++) {
        if (dirs[i] && dirs[i].direction === 'contributor') {
          nonGhostDir = dirs[i];
          break;
        }
      }
      expect(nonGhostDir).toBeDefined();
      // Non-ghost direction SHOULD surface
      expect(nonGhostDir.surfaced).toBe(true);
      // Non-ghost direction SHOULD sort to top
      expect(dirs[0].direction).toBe('contributor');
      // Non-ghost direction has no ghost label
      let hasGhost = false;
      for (let i = 0; i < nonGhostDir.pull_quality.length; i++) {
        if (nonGhostDir.pull_quality[i] === 'ghost') {
          hasGhost = true;
          break;
        }
      }
      expect(hasGhost).toBe(false);
    });
  });
});
