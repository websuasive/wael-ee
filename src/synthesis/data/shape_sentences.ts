// Shape sentence library. 28 sentences across 5 slots, sourced verbatim from SYNTHESIS.md section 7. Order is load-bearing: section 7.1 evaluates first-match-wins per slot, so array order matches the spec's table order.

import type {
  EngineOutput,
  InputMap,
  DirectionOutput,
  PerDirectionInputs,
  DomainName,
  CrossCuttingName,
} from '../../engine';
import type { ShapeSentence, MergedDirectionView } from '../types';
import { allBandsAt } from '../predicates';

/* ------------------------------------------------------------------ */
/* Pure-constructor helpers (sanctioned per spec section 10)          */
/* ------------------------------------------------------------------ */

/** Merge a single EngineOutput direction with its matching InputMap per-direction record. Pure assignment, no logic. */
export function mergeDirection(
  out: DirectionOutput,
  inp: PerDirectionInputs,
): MergedDirectionView {
  return {
    direction: out.direction,
    surfaced: out.surfaced,
    pull: out.pull,
    movement: out.movement,
    quadrant: out.quadrant,
    past_relationship: out.past_relationship,
    was_once_renders: out.was_once_renders,
    specificity: out.specificity,
    pull_quality: out.pull_quality,
    pull_state: out.pull_state,
    expression_space: out.expression_space,
    stated_strength: inp.stated_strength,
    felt_cost: inp.felt_cost,
    anticipation: inp.anticipation,
    current_movement: inp.current_movement,
    recent_action: inp.recent_action,
    past_presence: inp.past_presence,
    would_reach_for: inp.would_reach_for,
    saturation: inp.saturation,
    stopped_expecting: inp.stopped_expecting,
  };
}

function mergedViews(
  output: EngineOutput,
  input: InputMap,
): MergedDirectionView[] {
  return output.directions.map((dOut) =>
    mergeDirection(dOut, input.directions[dOut.direction]),
  );
}

function existsDirection(
  output: EngineOutput,
  input: InputMap,
  predicate: (d: MergedDirectionView) => boolean,
): boolean {
  return mergedViews(output, input).some(predicate);
}

function countDomainsFiring(output: EngineOutput): number {
  return output.domains.filter(
    (m) => m.fires && m.value !== 'never_been_part_of_his_life',
  ).length;
}

function domainFires(output: EngineOutput, name: DomainName): boolean {
  const entry = output.domains.find((m) => m.domain === name);
  return entry ? entry.fires : false;
}

function crossCuttingFires(
  output: EngineOutput,
  name: CrossCuttingName,
): boolean {
  const entry = output.cross_cutting.find((c) => c.output === name);
  return entry ? entry.fires : false;
}

/* ------------------------------------------------------------------ */
/* Shape sentences — 37 entries (28 v2-final + 9 v4), spec table order */
/* ------------------------------------------------------------------ */

export const shapeSentences: ShapeSentence[] = [
  /* 7.2 — Direction card summary slot (NEW head entries for held_unexpressed
     on the four eligible directions; register BEFORE card_real_active_strong
     to take precedence when expression-space is absent on a strong-specificity
     direction. Freedom and Experience are excluded — strong specificity
     without expression_space is architecturally improbable per §7.2 D5). */
  {
    id: 'card_held_unexpressed_making',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'creator' &&
          d.pull_state.includes('held_attributed_unexpressed'),
      ),
    sentence: 'Specific making held, with no current room for it.',
  },
  {
    id: 'card_held_unexpressed_relationship_rebuilder',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'relationship_rebuilder' &&
          d.pull_state.includes('held_attributed_unexpressed'),
      ),
    sentence: 'Specific relational holding, with no current contact for it.',
  },
  {
    id: 'card_held_unexpressed_growth_focused',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'growth_focused' &&
          d.pull_state.includes('held_attributed_unexpressed'),
      ),
    sentence: 'Specific growth held, with no current channel for it.',
  },
  {
    id: 'card_held_unexpressed_contributor',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'contributor' &&
          d.pull_state.includes('held_attributed_unexpressed'),
      ),
    sentence: 'Specific contribution held, with no current context for it.',
  },

  /* 7.2 — Direction card summary slot (existing) */
  {
    id: 'card_real_active_strong',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('real') &&
          d.quadrant === 'active' &&
          d.pull >= 70,
      ),
    sentence: 'Wanting and doing reading together.',
  },
  {
    id: 'card_real_active_moderate',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('real') &&
          d.quadrant === 'active' &&
          d.pull < 70,
      ),
    sentence: 'Real pull and movement, both reading present.',
  },
  {
    id: 'card_suppressed_blocked',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('suppressed') && d.quadrant === 'blocked',
      ),
    sentence: 'Past presence with stated wanting low; conditions unfavourable.',
  },
  {
    id: 'card_real_habit',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) => d.pull_quality.includes('real') && d.quadrant === 'habit',
      ),
    sentence: 'Movement without strong pull underneath.',
  },
  {
    id: 'card_phantom',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('phantom') ||
          d.pull_quality.includes('phantom_partial'),
      ),
    sentence:
      "A desired direction; the wanting is named, the action hasn't yet followed.",
  },
  {
    id: 'card_saturated',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(output, input, (d) =>
        d.pull_quality.includes('saturated'),
      ),
    sentence: 'The wanting has soured.',
  },

  /* 7.2 — Phase 6.2 gap closure: real / suppressed / empty / behaviourally_divergent */
  {
    id: 'card_real_blocked',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) => d.pull_quality.includes('real') && d.quadrant === 'blocked',
      ),
    sentence: 'Real pull, movement held back.',
  },
  {
    id: 'card_real_quiet',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) => d.pull_quality.includes('real') && d.quadrant === 'quiet',
      ),
    sentence: 'Real but quiet; neither pressing nor moving much.',
  },
  {
    id: 'card_suppressed_active',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('suppressed') && d.quadrant === 'active',
      ),
    sentence:
      'Activity reading high; the wanting underneath reads suppressed.',
  },
  {
    id: 'card_suppressed_habit',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('suppressed') && d.quadrant === 'habit',
      ),
    sentence:
      'Movement still reading; the wanting underneath has gone quiet.',
  },
  {
    id: 'card_suppressed_quiet',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('suppressed') && d.quadrant === 'quiet',
      ),
    sentence: 'Past presence reading, current pressure absent.',
  },
  {
    id: 'card_behaviourally_divergent',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(output, input, (d) =>
        d.pull_quality.includes('behaviourally_divergent'),
      ),
    sentence: 'Stated wanting reading; the chosen direction is elsewhere.',
  },
  {
    id: 'card_empty_habit',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) => d.pull_quality.length === 0 && d.quadrant === 'habit',
      ),
    sentence: 'Movement reading without a wanting underneath.',
  },
  {
    id: 'card_empty_quiet',
    slot: 'direction_card_summary',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) => d.pull_quality.length === 0 && d.quadrant === 'quiet',
      ),
    sentence: 'Not reading as a direction here.',
  },

  /* 7.3 — Closing line sentences (indices 16–21) */
  {
    id: 'closing_capacity_strain',
    slot: 'closing_line_closing_capacity_strain',
    predicate: (output, input) =>
      existsDirection(output, input, (d) =>
        d.pull_state.includes('capacity_strain'),
      ),
    sentence: 'You want more of this, but you also want less on your plate overall.',
  },
  {
    id: 'closing_stopped_expecting',
    slot: 'closing_line_closing_stopped_expecting',
    predicate: (output, input) =>
      existsDirection(output, input, (d) =>
        d.pull_state.includes('stopped_expecting'),
      ),
    sentence: "You've quietly stopped expecting much here.",
  },
  {
    id: 'closing_phantom',
    slot: 'closing_line_closing_phantom',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('phantom') ||
          d.pull_quality.includes('phantom_partial'),
      ),
    sentence:
      "{direction_display} named as a desired direction. The conditions for acting on it haven't shown up yet.",
  },
  {
    id: 'closing_between_shapes',
    slot: 'closing_line_closing_between_shapes',
    predicate: (output) => crossCuttingFires(output, 'between_shapes'),
    sentence: "Your life's changed recently, and it's not settled yet.",
  },
  {
    id: 'closing_mid_process',
    slot: 'closing_line_closing_mid_process',
    predicate: (output) => crossCuttingFires(output, 'mid_process'),
    sentence: "You've recently started reaching for change, and it's early days yet.",
  },

  /* 7.4 — Permission sub-shape sentences (indices 22–25) */
  {
    id: 'permission_sub_shape_want_block',
    slot: 'permission_sub_shape',
    predicate: (output) =>
      output.constraints.permission.sub_shape === 'want_block',
    sentence: 'There\'s something you won\'t let yourself want.',
  },
  {
    id: 'permission_sub_shape_say_block',
    slot: 'permission_sub_shape',
    predicate: (output) =>
      output.constraints.permission.sub_shape === 'say_block',
    sentence: 'There\'s something you want you haven\'t said out loud.',
  },
  {
    id: 'permission_sub_shape_act_block',
    slot: 'permission_sub_shape',
    predicate: (output) =>
      output.constraints.permission.sub_shape === 'act_block',
    sentence: 'There\'s something you want you\'ve not done anything about.',
  },
  {
    id: 'permission_sub_shape_present',
    slot: 'permission_sub_shape',
    predicate: (output) =>
      output.constraints.permission.sub_shape === 'present',
    sentence: 'You\'re not holding yourself back.',
  },

  /* 7.5 — Per-constraint band sentences */
  {
    id: 'energy_moderate',
    slot: 'energy_constraint',
    predicate: (output) =>
      output.constraints.energy.band === 'moderate',
    sentence: 'You\'ve got energy for what you have to do, not much past that.',
  },
  {
    id: 'energy_heavy_depletion',
    slot: 'energy_constraint',
    predicate: (output) =>
      output.constraints.energy.band === 'heavy_depletion',
    sentence: 'You\'ve got energy for getting through, and little left after.',
  },
  {
    id: 'time_moderate',
    slot: 'time_constraint',
    predicate: (output) =>
      output.constraints.time.band === 'moderate',
    sentence: 'You\'ve got some time that\'s your own, but most of it\'s spoken for.',
  },
  {
    id: 'time_heavy_time_pressure',
    slot: 'time_constraint',
    predicate: (output) =>
      output.constraints.time.band === 'heavy_time_pressure',
    sentence: 'You\'ve got almost no time that\'s your own. The week\'s full before you start.',
  },
  {
    id: 'body_shifted',
    slot: 'body_capacity_constraint',
    predicate: (output) =>
      output.constraints.body_capacity.band === 'shifted',
    sentence: 'Your body\'s changed. It still does plenty, but not what it once did.',
  },
  {
    id: 'body_limited',
    slot: 'body_capacity_constraint',
    predicate: (output) =>
      output.constraints.body_capacity.band === 'limited',
    sentence: 'Your body sets the limit now. A lot runs into what it can\'t do.',
  },

  /* 7.5 — Domains intact callout sentences (indices 26–27) */
  {
    id: 'domains_mattering_intact_with_many_reductions',
    slot: 'domains_intact_callout',
    predicate: (output) =>
      domainFires(output, 'mattering') === false &&
      countDomainsFiring(output) >= 8,
    sentence: "Even with a lot reduced, the sense that your life matters is still intact.",
  },
  {
    id: 'domains_structural_intact',
    slot: 'domains_intact_callout',
    predicate: (output) => {
      const structural: DomainName[] = [
        'mattering',
        'time_as_yours',
        'energy_as_resource',
      ];
      const allStructuralIntact = structural.every(
        (n) => domainFires(output, n) === false,
      );
      const otherFiringCount = output.domains.filter(
        (m) =>
          m.fires &&
          !structural.includes(m.domain) &&
          m.value !== 'never_been_part_of_his_life',
      ).length;
      return allStructuralIntact && otherFiringCount >= 4;
    },
    sentence: "Even with things reduced, the foundations are still solid.",
  },

  /* --------------------------------------------------------------- */
  /* Pattern paragraph axes (NEW compositional system)                */
  /* --------------------------------------------------------------- */
  {
    id: 'pull_character_held',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "There's something you want that you've never put into words.",
  },
  {
    id: 'pull_character_suppressed',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "Things you once wanted, you've quietly let go of.",
  },
  {
    id: 'pull_character_saturated',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "Something you used to want, you've had your fill of. There's nothing left in it.",
  },
  {
    id: 'pull_character_phantom',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "You say you want it, but it never quite becomes anything.",
  },
  {
    id: 'relational_mostly_absent',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "The people closest to you, you manage more than you really know them.",
  },
  {
    id: 'relational_partial',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "There are people around you, but no one you really open up to.",
  },
  {
    id: 'attention_autopilot',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "You move through the days without much of it landing.",
  },
  {
    id: 'domains_wants_back',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "A lot has fallen away from your life, and you'd want it back.",
  },
  {
    id: 'domains_at_peace',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "A lot has fallen away over the years, and you've made your peace with most of it.",
  },
  {
    id: 'constraint_high',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "Every part of life is stretched right now.",
  },
  {
    id: 'constraint_moderate',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "There's a steady weight across everything, and it doesn't lift.",
  },
  {
    id: 'stage_enduring',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "The days have looked much the same for a long time.",
  },
  {
    id: 'stage_drifting',
    slot: 'pattern_axis',
    predicate: () => true,
    sentence: "There's no real direction right now, and nothing pushing you toward one.",
  },

  /* --------------------------------------------------------------- */
  /* §7.5 — Life-texture summary slot (NEW)                          */
  /* --------------------------------------------------------------- */
  {
    id: 'life_texture_empty',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'empty',
    // v2-final soft revision: "yet" admits both empty-band shapes.
    sentence:
      "Your weeks are empty right now, nothing much filling them yet.",
  },
  {
    id: 'life_texture_depleted',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'depleted',
    sentence: 'Your weeks are full. Work fills them, and there\'s not much in the gaps.',
  },
  {
    id: 'life_texture_mixed_varied',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'mixed' &&
      output.cross_direction.week_shape.varied_week === true,
    sentence: 'There\'s some texture to your weeks, and the shape shifts from week to week.',
  },
  {
    id: 'life_texture_mixed_uniform',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'mixed' &&
      output.cross_direction.week_shape.varied_week === false,
    sentence: "There's some texture to your weeks, but it's the same pattern on repeat.",
  },
  {
    id: 'life_texture_textured_varied',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'textured' &&
      output.cross_direction.week_shape.varied_week === true,
    sentence: "Your weeks are full of texture, and they vary from one to the next.",
  },
  {
    id: 'life_texture_textured_uniform',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'textured' &&
      output.cross_direction.week_shape.varied_week === false,
    sentence: "Your weeks are full of texture, but it's the same shape repeating.",
  },

  /* --------------------------------------------------------------- */
  /* §7.6 — Life-texture pattern note slot (NEW)                     */
  /* --------------------------------------------------------------- */
  {
    id: 'pattern_varied',
    slot: 'life_texture_pattern_note',
    predicate: (output) => {
      const band = output.cross_direction.life_texture_band;
      return (
        output.cross_direction.week_shape.varied_week === true &&
        (band === 'mixed' || band === 'textured')
      );
    },
    sentence: "Your weeks vary from one to the next.",
  },
  {
    id: 'pattern_uniform',
    slot: 'life_texture_pattern_note',
    predicate: (output) => {
      const band = output.cross_direction.life_texture_band;
      return (
        output.cross_direction.week_shape.varied_week === false &&
        (band === 'mixed' || band === 'textured')
      );
    },
    sentence: 'The same shape week after week.',
  },

  /* --------------------------------------------------------------- */
  /* §7.7 — Expression space caption slot (NEW, per-direction)        */
  /* --------------------------------------------------------------- */
  /* Fires only when expression_space === "no_space" AND direction is
     materially reading (pull >= 30 OR pull_quality non-empty). Per-direction
     dispatch handled in cards.ts; predicates here guard material-reading. */
  {
    id: 'expression_space_creator_no',
    slot: 'expression_space_caption',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'creator' &&
          d.expression_space === 'no_space' &&
          (d.pull >= 30 || d.pull_quality.length > 0),
      ),
    sentence: "There's no room for this in your week right now.",
  },
  {
    id: 'expression_space_relationship_rebuilder_no',
    slot: 'expression_space_caption',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'relationship_rebuilder' &&
          d.expression_space === 'no_space' &&
          (d.pull >= 30 || d.pull_quality.length > 0),
      ),
    sentence: "The people for this aren't in your week right now.",
  },
  {
    id: 'expression_space_experience_seeker_no',
    slot: 'expression_space_caption',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'experience_seeker' &&
          d.expression_space === 'no_space' &&
          (d.pull >= 30 || d.pull_quality.length > 0),
      ),
    sentence: "Your week's too narrow for this at the moment.",
  },
  {
    id: 'expression_space_freedom_designer_no',
    slot: 'expression_space_caption',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'freedom_designer' &&
          d.expression_space === 'no_space' &&
          (d.pull >= 30 || d.pull_quality.length > 0),
      ),
    sentence: "There's no room for this in your week right now.",
  },
  {
    id: 'expression_space_growth_focused_no',
    slot: 'expression_space_caption',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'growth_focused' &&
          d.expression_space === 'no_space' &&
          (d.pull >= 30 || d.pull_quality.length > 0),
      ),
    sentence: "There's nowhere for this to go in your week right now.",
  },
  {
    id: 'expression_space_contributor_no',
    slot: 'expression_space_caption',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.direction === 'contributor' &&
          d.expression_space === 'no_space' &&
          (d.pull >= 30 || d.pull_quality.length > 0),
      ),
    sentence: 'The context for this is not in the week.',
  },

  /* §7.10 — Comparison surface summary slot. REFACTORED out of the shape-
     sentence library per v2 F3 decision: §7.10 predicates are meta-predicates
     over composed-panel counts, not predicates over EngineOutput. They now
     live inline in comparison_surface.ts as a dedicated two-pass dispatch. */

  /* --------------------------------------------------------------- */
  /* §7.11 — Life-stage summary slot (NEW)                            */
  /* --------------------------------------------------------------- */
  {
    id: 'life_stage_building',
    slot: 'life_stage_summary',
    predicate: (output) => output.cross_direction.life_stage === 'building',
    sentence: 'The big moves are still ahead of you.',
  },
  {
    id: 'life_stage_consolidating',
    slot: 'life_stage_summary',
    predicate: (output) =>
      output.cross_direction.life_stage === 'consolidating',
    sentence:
      "You're deepening what's already in place rather than building something new.",
  },
  {
    id: 'life_stage_re_evaluating',
    slot: 'life_stage_summary',
    predicate: (output) =>
      output.cross_direction.life_stage === 're_evaluating',
    sentence:
      "Whether the current setup is right is an open question for you just now.",
  },
  {
    id: 'life_stage_transitioning',
    slot: 'life_stage_summary',
    predicate: (output) =>
      output.cross_direction.life_stage === 'transitioning',
    sentence:
      "A change is happening, or about to.",
  },
  {
    id: 'life_stage_settled',
    slot: 'life_stage_summary',
    predicate: (output) => output.cross_direction.life_stage === 'settled',
    sentence:
      "Things are in place, with no real change of shape going on.",
  },
  {
    id: 'life_stage_enduring',
    slot: 'life_stage_summary',
    predicate: (output) => output.cross_direction.life_stage === 'enduring',
    // Composed around the term per §6.16 voice note.
    sentence: 'Things are pretty settled right now.',
  },
  {
    id: 'life_stage_drifting',
    slot: 'life_stage_summary',
    predicate: (output) => output.cross_direction.life_stage === 'drifting',
    // Composed around the term per §6.16 voice note.
    sentence:
      "Nothing's forcing a change, but whether things are right is still an open question.",
  },

  /* --------------------------------------------------------------- */
  /* §7.12 — Work-load summary slot (NEW, 13 authored of 28 cells)    */
  /* --------------------------------------------------------------- */
  {
    id: 'work_load_chosen_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'chosen' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence: "You've chosen the work you do, and it's also what fills your time.",
  },
  {
    id: 'work_load_chosen_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'chosen' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence:
      "You've chosen the work you do, but right now what fills your time is caring for someone.",
  },
  {
    id: 'work_load_endured_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'endured' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence: "You're putting up with the work, and it's also what fills your time. It's a squeeze.",
  },
  {
    id: 'work_load_endured_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'endured' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence:
      "You're putting up with the work, and caring fills the rest. Both are a squeeze.",
  },
  {
    id: 'work_load_consuming_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'consuming' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence: 'The work takes everything, and it\'s also what fills your time.',
  },
  {
    id: 'work_load_consuming_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'consuming' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence: 'The work takes everything, with caring on top of it.',
  },
  {
    id: 'work_load_functional_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'functional' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence: "Work's just work, and it's also what fills your time.",
  },
  {
    id: 'work_load_functional_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'functional' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence: "Work's just work; what fills your time is caring.",
  },
  {
    id: 'work_load_functional_household',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'functional' &&
      output.cross_direction.primary_load === 'household_admin',
    sentence: "Work's just work; what fills your time is keeping the household running.",
  },
  {
    id: 'work_load_functional_none',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'functional' &&
      output.cross_direction.primary_load === 'none',
    sentence: "Work's just work, and nothing in particular is filling your time right now.",
  },
  {
    id: 'work_load_between_none',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'between' &&
      output.cross_direction.primary_load === 'none',
    sentence: "You're between jobs, with nothing in particular filling your time right now.",
  },
  {
    id: 'work_load_between_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'between' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence: "You're between jobs, and caring fills your time.",
  },
  {
    id: 'work_load_peripheral_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'peripheral' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence:
      "Work isn't meant to be the main thing, yet it's what's eating your time. That's a pull in two directions.",
  },
  {
    id: 'work_load_defining_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'defining' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence: 'Right now, paid work is who you are, not just what you do.',
  },

  /* --------------------------------------------------------------- */
  /* §7.13 — Sociality summary slot (NEW)                             */
  /* --------------------------------------------------------------- */
  /* Evaluation order: Relationship-axis first, Contribution-axis second,
     balanced-axis third, balanced-default last. */
  {
    id: 'sociality_solitary_relationship_active',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'solitary_by_default')
        return false;
      const rel = relationshipDirection(output);
      return (
        rel !== undefined &&
        rel.pull_quality.includes('real') &&
        rel.quadrant === 'active'
      );
    },
    sentence:
      "You lean toward your own company, but the wanting for closeness is real and you're acting on it.",
  },
  {
    id: 'sociality_solitary_relationship_quiet',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'solitary_by_default')
        return false;
      const rel = relationshipDirection(output);
      return (
        rel !== undefined &&
        rel.pull_quality.length === 0 &&
        rel.quadrant === 'quiet'
      );
    },
    sentence:
      "You lean toward your own company, and the wanting for closeness is quiet too. The two sit consistently.",
  },
  {
    id: 'sociality_solitary_relationship_suppressed',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'solitary_by_default')
        return false;
      const rel = relationshipDirection(output);
      return rel !== undefined && rel.pull_quality.includes('suppressed');
    },
    sentence:
      "You lean toward your own company, but the lack of closeness still gets to you - you feel it even so.",
  },
  {
    id: 'sociality_social_relationship_active',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'social_by_default')
        return false;
      const rel = relationshipDirection(output);
      return (
        rel !== undefined &&
        rel.pull_quality.includes('real') &&
        rel.quadrant === 'active'
      );
    },
    sentence:
      "You're drawn to people, and the wanting for closeness is real and you're acting on it. The two sit together.",
  },
  {
    id: 'sociality_social_relationship_quiet_reduced',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'social_by_default')
        return false;
      const rel = relationshipDirection(output);
      if (
        rel === undefined ||
        rel.pull_quality.length !== 0 ||
        rel.quadrant !== 'quiet'
      )
        return false;
      return countRelationalDomainsReduced(output) >= 3;
    },
    sentence:
      "You're drawn to people, but the close relationships have thinned out. There's a disconnect there.",
  },
  {
    id: 'sociality_solitary_contribution_firing_no_group',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'solitary_by_default')
        return false;
      const contrib = directionByName(output, 'contributor');
      return (
        contrib !== undefined &&
        contrib.surfaced &&
        output.cross_direction.week_shape.belongs_to_group === false
      );
    },
    sentence:
      "You lean toward your own company, and there's a real pull to contribute, but there's no group around it yet. The want's there, the place for it isn't.",
  },
  {
    id: 'sociality_social_contribution_firing_no_group',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'social_by_default')
        return false;
      const contrib = directionByName(output, 'contributor');
      return (
        contrib !== undefined &&
        contrib.surfaced &&
        output.cross_direction.week_shape.belongs_to_group === false
      );
    },
    sentence:
      "You're drawn to people, and there's a real pull to contribute, but there's no group around it yet. The want and the place for it don't line up.",
  },
  {
    id: 'sociality_social_contribution_quiet_belongs',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'social_by_default')
        return false;
      const contrib = directionByName(output, 'contributor');
      return (
        contrib !== undefined &&
        contrib.pull_quality.length === 0 &&
        output.cross_direction.week_shape.belongs_to_group === true
      );
    },
    sentence:
      "You're drawn to people and you've got a group, but the pull to contribute is quiet right now. The setup's there; the wanting isn't, just now.",
  },
  {
    id: 'sociality_balanced_relationship_active',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'balanced') return false;
      const rel = relationshipDirection(output);
      return (
        rel !== undefined &&
        rel.pull_quality.includes('real') &&
        rel.quadrant === 'active'
      );
    },
    sentence:
      "You're at ease both with people and on your own, and the wanting for closeness is real and you're acting on it.",
  },
  {
    id: 'sociality_balanced_relationship_reduced',
    slot: 'sociality_summary',
    predicate: (output) => {
      if (output.cross_direction.sociality_default !== 'balanced') return false;
      // "no other balanced predicate fires" — the preceding
      // sociality_balanced_relationship_active is the only other balanced
      // predicate above this entry. Because registration is first-match-wins,
      // if sociality_balanced_relationship_active matched, this entry is not
      // evaluated. The spec's "no other" guard reduces here to the reduced-
      // relational predicate itself.
      return countRelationalDomainsReduced(output) >= 3;
    },
    sentence:
      'You\'re at ease both with people and on your own, but the close relationships have gone a bit hollow.',
  },
  {
    id: 'sociality_balanced_default',
    slot: 'sociality_summary',
    predicate: (output) =>
      output.cross_direction.sociality_default === 'balanced',
    sentence: "You're at ease both with people and on your own.",
  },
  /* 7.15 (v4) — Narrowing summary slot (NEW) */
  {
    id: 'narrowing_summary_all_high',
    slot: 'narrowing_summary',
    predicate: (output) => allBandsAt(output, 'high'),
    sentence: 'All seven areas are reading high.',
  },
  {
    id: 'narrowing_summary_all_moderate',
    slot: 'narrowing_summary',
    predicate: (output) => allBandsAt(output, 'moderate'),
    sentence: 'All seven areas are sitting at moderate.',
  },
  {
    id: 'narrowing_summary_mostly_open',
    slot: 'narrowing_summary',
    predicate: (output) => {
      const bands = [
        output.cross_direction.structural_narrowing_band,
        output.cross_direction.experiential_narrowing_band,
        output.cross_direction.psychological_narrowing_band,
        output.cross_direction.identity_narrowing_band,
        output.cross_direction.energetic_narrowing_band,
        output.cross_direction.relational_narrowing_band,
        output.cross_direction.attention_narrowing_band,
      ];
      return bands.filter((b) => b === 'low').length >= 5;
    },
    sentence: "Most areas are reading low - things are fairly open across the board.",
  },
  {
    id: 'narrowing_summary_concentrated_high',
    slot: 'narrowing_summary',
    predicate: (output) => {
      const bands = [
        output.cross_direction.structural_narrowing_band,
        output.cross_direction.experiential_narrowing_band,
        output.cross_direction.psychological_narrowing_band,
        output.cross_direction.identity_narrowing_band,
        output.cross_direction.energetic_narrowing_band,
        output.cross_direction.relational_narrowing_band,
        output.cross_direction.attention_narrowing_band,
      ];
      const highCount = bands.filter((b) => b === 'high').length;
      return highCount >= 4 && !allBandsAt(output, 'high');
    },
    sentence: 'Several areas are reading high, others moderate or low.',
  },
];

/* ------------------------------------------------------------------ */
/* Helpers for the new §7.11–§7.13 entries                            */
/* ------------------------------------------------------------------ */

function directionByName(
  output: EngineOutput,
  name: DirectionOutput['direction'],
): DirectionOutput | undefined {
  return output.directions.find((d) => d.direction === name);
}

function relationshipDirection(output: EngineOutput): DirectionOutput | undefined {
  return directionByName(output, 'relationship_rebuilder');
}

const RELATIONAL_DOMAINS: DomainName[] = [
  'friendship',
  'intimacy',
  'conversation_depth',
  'being_known',
];

function countRelationalDomainsReduced(output: EngineOutput): number {
  return output.domains.filter(
    (m) => RELATIONAL_DOMAINS.includes(m.domain) && m.fires,
  ).length;
}
