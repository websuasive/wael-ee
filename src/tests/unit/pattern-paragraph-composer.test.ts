// Unit tests for the new six-axis pattern paragraph composer.
import { describe, it, expect } from 'vitest';
import { composePatternParagraph } from '../../synthesis/pattern_paragraph_composer';
import { makeEngineOutput, makeInputMap } from './synthesis-test-helpers';

describe('composePatternParagraph', () => {
  it('man significant on all six axes → exactly 4 sentences, in priority order', () => {
    const output = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['suppressed'],
          pull_state: ['held_attributed_unexpressed'],
          surfaced: true,
          quadrant: 'blocked',
          movement: 0,
          past_relationship: 'was_once',
          was_once_renders: false,
          specificity: 'strong',
          expression_space: 'has_space',
        },
      ],
      domains: {
        curiosity: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        making: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        conversation_depth: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        being_known: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        friendship: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        intimacy: { current_state: 2, fires: true, value: 'reduced_wants_back' },
      },
      cross_cutting: { between_shapes: true, mid_process: true },
      cross_direction: {
        life_stage: 'enduring',
        structural_narrowing_band: 'high',
        experiential_narrowing_band: 'high',
        psychological_narrowing_band: 'high',
        identity_narrowing_band: 'high',
        energetic_narrowing_band: 'high',
        relational_narrowing_band: 'high',
        attention_narrowing_band: 'high',
        sociality_default: 'balanced',
        paid_work_relationship: 'defining',
        primary_load: 'paid_work',
        life_texture_band: 'depleted',
        week_shape: {
          work_dominates: true,
          weekends_consumed: true,
          weekly_activity: true,
          sees_people: false,
          makes_things: false,
          active_body: false,
          belongs_to_group: false,
          solo_practice: false,
          varied_week: false,
        },
        psychological_filtering: 'does_not_filter',
        role_consolidation: 'role_inflected',
        attention_pattern: 'autopilot',
        relational_presence: 'mostly_absent',
      },
    });
    const input = makeInputMap({
      cross_direction: {
        relational_presence: 'mostly_absent',
        attention_pattern: 'autopilot',
      },
    });

    const result = composePatternParagraph(output, input);
    expect(result).toHaveLength(4);
    expect(result[0]).toBe("Things you once wanted, you've quietly let go of.");
    expect(result[1]).toBe('The people closest to you, you manage more than you really know them.');
    expect(result[2]).toBe('You move through the days without much of it landing.');
    expect(result[3]).toBe('A lot has fallen away from your life, and you\'d want it back.');
  });

  it('man significant on 2 axes → exactly those 2, in priority order', () => {
    const output = makeEngineOutput({
      directions: [],
      domains: {
        curiosity: { current_state: 0, fires: false, value: 'intact' },
      },
      cross_cutting: { between_shapes: false, mid_process: false },
      cross_direction: {
        life_stage: 'consolidating',
        structural_narrowing_band: 'low',
        experiential_narrowing_band: 'low',
        psychological_narrowing_band: 'low',
        identity_narrowing_band: 'low',
        energetic_narrowing_band: 'low',
        relational_narrowing_band: 'low',
        attention_narrowing_band: 'low',
        sociality_default: 'balanced',
        paid_work_relationship: 'functional',
        primary_load: 'paid_work',
        life_texture_band: 'mixed',
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: true,
          makes_things: false,
          active_body: false,
          belongs_to_group: false,
          solo_practice: false,
          varied_week: true,
        },
        psychological_filtering: 'does_not_filter',
        role_consolidation: 'role_inflected',
        attention_pattern: 'engaged',
        relational_presence: 'partial',
      },
    });
    const input = makeInputMap({
      cross_direction: {
        relational_presence: 'partial',
        attention_pattern: 'engaged',
      },
    });

    const result = composePatternParagraph(output, input);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('There are people around you, but no one you really open up to.');
  });

  it('man significant on 0 axes → empty array', () => {
    const output = makeEngineOutput({
      directions: [],
      domains: {
        curiosity: { current_state: 0, fires: false, value: 'intact' },
      },
      cross_cutting: { between_shapes: false, mid_process: false },
      cross_direction: {
        life_stage: 'consolidating',
        structural_narrowing_band: 'low',
        experiential_narrowing_band: 'low',
        psychological_narrowing_band: 'low',
        identity_narrowing_band: 'low',
        energetic_narrowing_band: 'low',
        relational_narrowing_band: 'low',
        attention_narrowing_band: 'low',
        sociality_default: 'balanced',
        paid_work_relationship: 'functional',
        primary_load: 'paid_work',
        life_texture_band: 'mixed',
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: true,
          makes_things: false,
          active_body: false,
          belongs_to_group: false,
          solo_practice: false,
          varied_week: true,
        },
        psychological_filtering: 'does_not_filter',
        role_consolidation: 'role_inflected',
        attention_pattern: 'engaged',
        relational_presence: 'present',
      },
    });
    const input = makeInputMap({
      cross_direction: {
        relational_presence: 'present',
        attention_pattern: 'engaged',
      },
    });

    const result = composePatternParagraph(output, input);
    expect(result).toHaveLength(0);
  });

  it('pull-character precedence: suppressed > held_unexpressed → suppressed sentence', () => {
    const output = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['suppressed'],
          pull_state: ['held_attributed_unexpressed'],
          surfaced: true,
          quadrant: 'blocked',
          movement: 0,
          past_relationship: 'was_once',
          was_once_renders: false,
          specificity: 'strong',
          expression_space: 'no_space',
        },
      ],
      domains: {},
      cross_cutting: { between_shapes: false, mid_process: false },
      cross_direction: {
        life_stage: 'consolidating',
        structural_narrowing_band: 'low',
        experiential_narrowing_band: 'low',
        psychological_narrowing_band: 'low',
        identity_narrowing_band: 'low',
        energetic_narrowing_band: 'low',
        relational_narrowing_band: 'low',
        attention_narrowing_band: 'low',
        sociality_default: 'balanced',
        paid_work_relationship: 'functional',
        primary_load: 'paid_work',
        life_texture_band: 'mixed',
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: true,
          makes_things: false,
          active_body: false,
          belongs_to_group: false,
          solo_practice: false,
          varied_week: true,
        },
        psychological_filtering: 'does_not_filter',
        role_consolidation: 'role_inflected',
        attention_pattern: 'engaged',
        relational_presence: 'present',
      },
    });
    const input = makeInputMap({
      cross_direction: {
        relational_presence: 'present',
        attention_pattern: 'engaged',
      },
    });

    const result = composePatternParagraph(output, input);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Things you once wanted, you've quietly let go of.");
  });

  it('pull-character precedence: held_with_expression beats suppressed → held sentence (edge case)', () => {
    const output = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['suppressed'],
          pull_state: ['held_attributed_with_expression'],
          surfaced: true,
          quadrant: 'blocked',
          movement: 0,
          past_relationship: 'was_once',
          was_once_renders: false,
          specificity: 'strong',
          expression_space: 'has_space',
        },
      ],
      domains: {},
      cross_cutting: { between_shapes: false, mid_process: false },
      cross_direction: {
        life_stage: 'consolidating',
        structural_narrowing_band: 'low',
        experiential_narrowing_band: 'low',
        psychological_narrowing_band: 'low',
        identity_narrowing_band: 'low',
        energetic_narrowing_band: 'low',
        relational_narrowing_band: 'low',
        attention_narrowing_band: 'low',
        sociality_default: 'balanced',
        paid_work_relationship: 'functional',
        primary_load: 'paid_work',
        life_texture_band: 'mixed',
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: true,
          makes_things: false,
          active_body: false,
          belongs_to_group: false,
          solo_practice: false,
          varied_week: true,
        },
        psychological_filtering: 'does_not_filter',
        role_consolidation: 'role_inflected',
        attention_pattern: 'engaged',
        relational_presence: 'present',
      },
    });
    const input = makeInputMap({
      cross_direction: {
        relational_presence: 'present',
        attention_pattern: 'engaged',
      },
    });

    const result = composePatternParagraph(output, input);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("There's something you want that you've never put into words.");
  });

  it('domains precedence: wants_back >= 6 AND at_peace >= 3 → wants_back sentence', () => {
    const output = makeEngineOutput({
      directions: [],
      domains: {
        curiosity: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        making: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        conversation_depth: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        being_known: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        friendship: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        intimacy: { current_state: 2, fires: true, value: 'reduced_wants_back' },
        mattering: { current_state: 2, fires: true, value: 'reduced_at_peace' },
        spiritual: { current_state: 2, fires: true, value: 'reduced_at_peace' },
      },
      cross_cutting: { between_shapes: false, mid_process: false },
      cross_direction: {
        life_stage: 'consolidating',
        structural_narrowing_band: 'low',
        experiential_narrowing_band: 'low',
        psychological_narrowing_band: 'low',
        identity_narrowing_band: 'low',
        energetic_narrowing_band: 'low',
        relational_narrowing_band: 'low',
        attention_narrowing_band: 'low',
        sociality_default: 'balanced',
        paid_work_relationship: 'functional',
        primary_load: 'paid_work',
        life_texture_band: 'mixed',
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: true,
          makes_things: false,
          active_body: false,
          belongs_to_group: false,
          solo_practice: false,
          varied_week: true,
        },
        psychological_filtering: 'does_not_filter',
        role_consolidation: 'role_inflected',
        attention_pattern: 'engaged',
        relational_presence: 'present',
      },
    });
    const input = makeInputMap({
      cross_direction: {
        relational_presence: 'present',
        attention_pattern: 'engaged',
      },
    });

    const result = composePatternParagraph(output, input);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('A lot has fallen away from your life, and you\'d want it back.');
  });

  it('constraint axis only: high band → constraint sentence', () => {
    const output = makeEngineOutput({
      directions: [],
      domains: {
        curiosity: { current_state: 0, fires: false, value: 'intact' },
      },
      cross_cutting: { between_shapes: false, mid_process: false },
      cross_direction: {
        life_stage: 'consolidating',
        structural_narrowing_band: 'high',
        experiential_narrowing_band: 'high',
        psychological_narrowing_band: 'high',
        identity_narrowing_band: 'high',
        energetic_narrowing_band: 'high',
        relational_narrowing_band: 'high',
        attention_narrowing_band: 'high',
        sociality_default: 'balanced',
        paid_work_relationship: 'functional',
        primary_load: 'paid_work',
        life_texture_band: 'mixed',
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: true,
          makes_things: false,
          active_body: false,
          belongs_to_group: false,
          solo_practice: false,
          varied_week: true,
        },
        psychological_filtering: 'does_not_filter',
        role_consolidation: 'role_inflected',
        attention_pattern: 'engaged',
        relational_presence: 'present',
      },
    });
    const input = makeInputMap({
      cross_direction: {
        relational_presence: 'present',
        attention_pattern: 'engaged',
      },
    });

    const result = composePatternParagraph(output, input);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Every part of life is stretched right now.');
  });

  it('stage axis only: enduring → enduring sentence', () => {
    const output = makeEngineOutput({
      directions: [],
      domains: {
        curiosity: { current_state: 0, fires: false, value: 'intact' },
      },
      cross_cutting: { between_shapes: false, mid_process: false },
      cross_direction: {
        life_stage: 'enduring',
        structural_narrowing_band: 'low',
        experiential_narrowing_band: 'low',
        psychological_narrowing_band: 'low',
        identity_narrowing_band: 'low',
        energetic_narrowing_band: 'low',
        relational_narrowing_band: 'low',
        attention_narrowing_band: 'low',
        sociality_default: 'balanced',
        paid_work_relationship: 'functional',
        primary_load: 'paid_work',
        life_texture_band: 'mixed',
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: true,
          makes_things: false,
          active_body: false,
          belongs_to_group: false,
          solo_practice: false,
          varied_week: true,
        },
        psychological_filtering: 'does_not_filter',
        role_consolidation: 'role_inflected',
        attention_pattern: 'engaged',
        relational_presence: 'present',
      },
    });
    const input = makeInputMap({
      cross_direction: {
        relational_presence: 'present',
        attention_pattern: 'engaged',
      },
    });

    const result = composePatternParagraph(output, input);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('The days have looked much the same for a long time.');
  });

  it('stage axis only: drifting → drifting sentence', () => {
    const output = makeEngineOutput({
      directions: [],
      domains: {
        curiosity: { current_state: 0, fires: false, value: 'intact' },
      },
      cross_cutting: { between_shapes: false, mid_process: false },
      cross_direction: {
        life_stage: 'drifting',
        structural_narrowing_band: 'low',
        experiential_narrowing_band: 'low',
        psychological_narrowing_band: 'low',
        identity_narrowing_band: 'low',
        energetic_narrowing_band: 'low',
        relational_narrowing_band: 'low',
        attention_narrowing_band: 'low',
        sociality_default: 'balanced',
        paid_work_relationship: 'functional',
        primary_load: 'paid_work',
        life_texture_band: 'mixed',
        week_shape: {
          work_dominates: false,
          weekends_consumed: false,
          weekly_activity: false,
          sees_people: true,
          makes_things: false,
          active_body: false,
          belongs_to_group: false,
          solo_practice: false,
          varied_week: true,
        },
        psychological_filtering: 'does_not_filter',
        role_consolidation: 'role_inflected',
        attention_pattern: 'engaged',
        relational_presence: 'present',
      },
    });
    const input = makeInputMap({
      cross_direction: {
        relational_presence: 'present',
        attention_pattern: 'engaged',
      },
    });

    const result = composePatternParagraph(output, input);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("There's no real direction right now, and nothing pushing you toward one.");
  });
});
