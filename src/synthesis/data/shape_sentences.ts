// Shape sentence library. 28 sentences across 5 slots, sourced verbatim from SYNTHESIS.md section 7. Order is load-bearing: section 7.1 evaluates first-match-wins per slot, so array order matches the spec's table order.

import type {
  EngineOutput,
  InputMap,
  DirectionOutput,
  PerDirectionInputs,
  DomainName,
  DomainPresenceValue,
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

function everyDirection(
  output: EngineOutput,
  input: InputMap,
  predicate: (d: MergedDirectionView) => boolean,
): boolean {
  return mergedViews(output, input).every(predicate);
}

function countDirections(
  output: EngineOutput,
  input: InputMap,
  predicate: (d: MergedDirectionView) => boolean,
): number {
  return mergedViews(output, input).filter(predicate).length;
}

function countDomainsWithValue(
  output: EngineOutput,
  value: DomainPresenceValue,
): number {
  return output.domains.filter((m) => m.value === value).length;
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
  /* 7.1 — Pattern paragraph slot (v4 compression-point entries at HEAD) */
  {
    id: 'compression_high_depletion_driven',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      allBandsAt(output, 'high') &&
      (input.cross_direction.primary_load === 'caregiving' ||
        input.cross_direction.primary_load === 'paid_work') &&
      (input.constraints.permission_sub_shape === 'act_block' ||
        input.constraints.permission_sub_shape === 'want_block') &&
      input.cross_direction.relational_presence === 'partial',
    sentence:
      'All seven readings sit at high. The load is the shape of his life now. Partly in the relationships he has; contact thin around them.',
  },
  {
    id: 'compression_high_autopilot',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      allBandsAt(output, 'high') &&
      input.cross_direction.relational_presence === 'mostly_absent',
    sentence:
      'All seven readings sit at high. Attention moving without much registering; mostly absent in the relationships he has.',
  },
  {
    id: 'compression_moderate_consuming_unfiltered',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      allBandsAt(output, 'moderate') &&
      input.cross_direction.paid_work_relationship === 'consuming' &&
      input.cross_direction.psychological_filtering === 'does_not_filter',
    sentence:
      'All seven readings sit at moderate. Work consuming; the wanting reaches toward action without filter. Something running alongside the work.',
  },
  {
    id: 'compression_moderate_consuming_filtered',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      allBandsAt(output, 'moderate') &&
      input.cross_direction.paid_work_relationship === 'consuming' &&
      input.cross_direction.psychological_filtering === 'filters_some',
    sentence:
      'All seven readings sit at moderate. Work consuming; the wanting passes through some filtering before it acts. Something starting to form alongside.',
  },
  {
    id: 'compression_moderate_functional_enduring',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      allBandsAt(output, 'moderate') &&
      input.cross_direction.paid_work_relationship === 'functional' &&
      input.cross_direction.life_stage === 'enduring',
    sentence:
      'All seven readings sit at moderate. Work neutral; the shape has been in place a long time. Something held, not currently moving.',
  },
  /* 7.1 — Pattern paragraph slot (v2-final entries) */
  {
    id: 'enduring_long_depleted',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      output.cross_direction.life_stage === 'enduring' &&
      input.cross_direction.life_shape_duration === 'long' &&
      output.cross_direction.life_texture_band === 'depleted' &&
      countDirections(output, input, (d) => d.surfaced) >= 2,
    sentence:
      'Several directions reading. The pattern has been long-running, the week reads thin around them. The load is the shape of his life now.',
  },
  {
    id: 'enduring_long_mixed',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      output.cross_direction.life_stage === 'enduring' &&
      input.cross_direction.life_shape_duration === 'long' &&
      output.cross_direction.life_texture_band === 'mixed' &&
      countDirections(output, input, (d) => d.surfaced) >= 2,
    sentence:
      'Several directions reading. The pattern has been long-running, with some texture around it. The load is the shape of his life now.',
  },
  {
    id: 'drifting_with_pulls',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      output.cross_direction.life_stage === 'drifting' &&
      countDirections(output, input, (d) => d.surfaced) >= 2,
    sentence:
      'Pulls reading without a settled direction. Nothing forcing a change; whether the current shape is right is unresolved.',
  },
  {
    id: 'held_unexpressed_strong',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_state.includes('held_attributed_unexpressed') && d.pull >= 70,
      ),
    sentence:
      'Something specific held in {direction_display}, and the week has no current room for it.',
  },
  {
    id: 'held_unexpressed_moderate',
    slot: 'pattern_paragraph',
    predicate: (output, input) => {
      const hasHeld = existsDirection(
        output,
        input,
        (d) =>
          d.pull_state.includes('held_attributed_unexpressed') && d.pull < 70,
      );
      if (!hasHeld) return false;
      // "2+ other directions d' surfaced" — count surfaced directions that are
      // not themselves the held_attributed_unexpressed direction.
      const surfacedOther = countDirections(
        output,
        input,
        (d) =>
          d.surfaced && !d.pull_state.includes('held_attributed_unexpressed'),
      );
      return surfacedOther >= 2;
    },
    sentence:
      'Something specific held in {direction_display}, with no current room for it. Other directions are reading too.',
  },
  {
    id: 'mixed_band_uniform_pattern',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      output.cross_direction.life_texture_band === 'mixed' &&
      output.cross_direction.week_shape.varied_week === false &&
      countDirections(output, input, (d) => d.surfaced) >= 2 &&
      !existsDirection(output, input, (d) =>
        d.pull_state.includes('capacity_strain'),
      ) &&
      !existsDirection(
        output,
        input,
        (d) =>
          d.pull_state.includes('held_attributed_with_expression') ||
          d.pull_state.includes('held_attributed_unexpressed'),
      ),
    sentence:
      'Several directions reading, with some texture around them. The same pattern, repeating.',
  },
  {
    id: 'depleted_band_with_held',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      output.cross_direction.life_texture_band === 'depleted' &&
      existsDirection(
        output,
        input,
        (d) =>
          d.specificity === 'strong' &&
          d.pull_state.includes('held_attributed_unexpressed'),
      ),
    sentence:
      'Something specific held in {direction_display}. The week is absorbed by load with no current room for it.',
  },

  /* 7.1 — Pattern paragraph slot (existing, indices unchanged in registration) */
  {
    id: 'deep_suppression_multi',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      countDirections(
        output,
        input,
        (d) => d.pull_quality.includes('suppressed') && d.past_presence === 'yes',
      ) >= 3 &&
      output.constraints.sustained_constraint_intensity >= 70 &&
      input.cross_direction.life_shape_duration === 'long',
    sentence:
      'Several directions reading with past presence and stated wanting low. The constraint pattern has been heavy and long-running.',
  },
  {
    id: 'suppressed_standard_multi',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      countDirections(
        output,
        input,
        (d) =>
          d.pull_quality.includes('suppressed') &&
          d.past_presence === 'yes' &&
          d.felt_cost >= 50,
      ) >= 2 &&
      output.constraints.sustained_constraint_intensity >= 60 &&
      output.constraints.sustained_constraint_intensity < 70 &&
      input.cross_direction.life_shape_duration !== 'long',
    sentence:
      'Several directions reading with past presence, real felt cost, and stated wanting low. Constraint heavy without being long-running.',
  },
  {
    id: 'active_with_tension',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) =>
          d.quadrant === 'active' &&
          d.pull >= 70 &&
          d.pull_state.includes('capacity_strain'),
      ),
    sentence:
      'One direction reading active and strong. Capacity strain firing alongside: pull on this and pull toward less weight overall, at the same time.',
  },
  {
    id: 'active_going_through_motions',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      existsDirection(
        output,
        input,
        (d) => d.quadrant === 'active' && d.pull < 70,
      ) && crossCuttingFires(output, 'mid_process'),
    sentence: 'One direction reading active. The reaching is recent.',
  },
  {
    id: 'saturated',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      existsDirection(output, input, (d) =>
        d.pull_quality.includes('saturated'),
      ),
    sentence: 'Wanting present on a direction, but soured.',
  },
  {
    id: 'desired_direction_partial',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      existsDirection(output, input, (d) =>
        d.pull_quality.includes('phantom_partial'),
      ) &&
      !existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('real') ||
          d.pull_quality.includes('suppressed') ||
          d.pull_quality.includes('saturated') ||
          d.pull_quality.includes('behaviourally_divergent'),
      ),
    sentence:
      "A desired direction named: {direction_display}. The surrounding readings are still partial; the conditions for acting haven't shown up yet.",
  },
  {
    id: 'desired_direction_full',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      existsDirection(output, input, (d) =>
        d.pull_quality.includes('phantom'),
      ) &&
      !existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('real') ||
          d.pull_quality.includes('suppressed') ||
          d.pull_quality.includes('saturated') ||
          d.pull_quality.includes('behaviourally_divergent'),
      ),
    sentence:
      "A desired direction stated strongly: {direction_display}. The surrounding readings haven't yet caught up.",
  },
  {
    id: 'between_shapes_clean',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      crossCuttingFires(output, 'between_shapes') &&
      !existsDirection(output, input, (d) =>
        d.pull_quality.includes('suppressed'),
      ),
    sentence:
      'Recent change in life shape, no replacement structure yet in place.',
  },
  {
    id: 'empty_pulls_past_present_wants',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      everyDirection(output, input, (d) => d.pull_quality.length === 0) &&
      countDirections(output, input, (d) => d.past_presence === 'yes') >= 3 &&
      countDomainsWithValue(output, 'reduced_at_peace') < 3,
    sentence:
      'No direction reading as a current pull. Several directions register past presence; the wanting has gone quiet.',
  },
  {
    id: 'empty_pulls_past_present_at_peace',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      everyDirection(output, input, (d) => d.pull_quality.length === 0) &&
      countDirections(output, input, (d) => d.past_presence === 'yes') >= 3 &&
      countDomainsWithValue(output, 'reduced_at_peace') >= 3,
    sentence:
      'No direction reading as a current pull. Several directions register past presence; the wanting reads as having been let go.',
  },

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
    sentence:
      'Pulling toward more in {direction_lower}, and toward less weight overall.',
  },
  {
    id: 'closing_stopped_expecting',
    slot: 'closing_line_closing_stopped_expecting',
    predicate: (output, input) =>
      existsDirection(output, input, (d) =>
        d.pull_state.includes('stopped_expecting'),
      ),
    sentence: 'Quietly stopped expecting in {direction_lower}.',
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
    sentence: "Between shapes; the new shape isn't fully there yet.",
  },
  {
    id: 'closing_mid_process',
    slot: 'closing_line_closing_mid_process',
    predicate: (output) => crossCuttingFires(output, 'mid_process'),
    sentence: 'The reaching is recent and still finding its form.',
  },

  /* 7.4 — Permission sub-shape sentences (indices 22–25) */
  {
    id: 'permission_sub_shape_want_block',
    slot: 'permission_sub_shape',
    predicate: (output) =>
      output.constraints.permission.sub_shape === 'want_block',
    sentence: "Wanting that isn't being let in.",
  },
  {
    id: 'permission_sub_shape_say_block',
    slot: 'permission_sub_shape',
    predicate: (output) =>
      output.constraints.permission.sub_shape === 'say_block',
    sentence: "Wanting something that hasn't been said out loud.",
  },
  {
    id: 'permission_sub_shape_act_block',
    slot: 'permission_sub_shape',
    predicate: (output) =>
      output.constraints.permission.sub_shape === 'act_block',
    sentence: 'Wanting something thought about but not acted on.',
  },
  {
    id: 'permission_sub_shape_present',
    slot: 'permission_sub_shape',
    predicate: (output) =>
      output.constraints.permission.sub_shape === 'present',
    sentence: 'Permission reading partial; nothing specific blocking.',
  },

  /* 7.5 — Domains intact callout sentences (indices 26–27) */
  {
    id: 'domains_mattering_intact_with_many_reductions',
    slot: 'domains_intact_callout',
    predicate: (output) =>
      domainFires(output, 'mattering') === false &&
      countDomainsFiring(output) >= 8,
    sentence: 'Mattering reading intact alongside multiple reductions.',
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
    sentence: 'Structural foundations reading intact alongside reductions.',
  },

  /* --------------------------------------------------------------- */
  /* §7.1 — Pattern paragraph slot (NEW tail entries, lower priority) */
  /* --------------------------------------------------------------- */
  {
    id: 'empty_band_with_phantom',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      output.cross_direction.life_texture_band === 'empty' &&
      existsDirection(
        output,
        input,
        (d) =>
          d.pull_quality.includes('phantom') ||
          d.pull_quality.includes('phantom_partial'),
      ),
    sentence:
      'A direction named: {direction_display}. The week shows little around it yet.',
  },
  {
    id: 'empty_band_reaching',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      (output.cross_direction.life_stage === 're_evaluating' ||
        output.cross_direction.life_stage === 'transitioning') &&
      output.cross_direction.life_texture_band === 'empty' &&
      countDirections(output, input, (d) => d.surfaced) >= 1,
    sentence:
      'Direction reading without expression in the week. The week shape is still forming.',
  },
  {
    id: 'textured_band_multiple_firing',
    slot: 'pattern_paragraph',
    predicate: (output, input) =>
      output.cross_direction.life_texture_band === 'textured' &&
      countDirections(output, input, (d) => d.surfaced) >= 3,
    sentence:
      'Several directions reading. The week has texture across multiple dimensions.',
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
      'The week reads empty: nothing absorbing, nothing filling yet.',
  },
  {
    id: 'life_texture_depleted',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'depleted',
    sentence: 'The week reads absorbed by load. No texture inside the gaps.',
  },
  {
    id: 'life_texture_mixed_varied',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'mixed' &&
      output.cross_direction.week_shape.varied_week === true,
    sentence: 'Some texture across the week. The pattern shifts week to week.',
  },
  {
    id: 'life_texture_mixed_uniform',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'mixed' &&
      output.cross_direction.week_shape.varied_week === false,
    sentence: 'Some texture across the week. The same pattern, repeating.',
  },
  {
    id: 'life_texture_textured_varied',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'textured' &&
      output.cross_direction.week_shape.varied_week === true,
    sentence: 'Substantial texture across the week, varied week to week.',
  },
  {
    id: 'life_texture_textured_uniform',
    slot: 'life_texture_summary',
    predicate: (output) =>
      output.cross_direction.life_texture_band === 'textured' &&
      output.cross_direction.week_shape.varied_week === false,
    sentence: 'Substantial texture across the week, in a repeating shape.',
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
    sentence: 'Weeks vary from one another.',
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
    sentence: 'The week has no current room for this.',
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
    sentence: 'The contact for this is not in the week.',
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
    sentence: 'The week reads narrow around this.',
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
    sentence: 'No room for this in the week.',
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
    sentence: 'The week reads no channel for this.',
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
    sentence: 'Reading: building. The major moves are in front of him.',
  },
  {
    id: 'life_stage_consolidating',
    slot: 'life_stage_summary',
    predicate: (output) =>
      output.cross_direction.life_stage === 'consolidating',
    sentence:
      'Reading: consolidating. Deepening what is already in place.',
  },
  {
    id: 'life_stage_re_evaluating',
    slot: 'life_stage_summary',
    predicate: (output) =>
      output.cross_direction.life_stage === 're_evaluating',
    sentence:
      'Reading: re-evaluating. Whether the current architecture is right remains an open question.',
  },
  {
    id: 'life_stage_transitioning',
    slot: 'life_stage_summary',
    predicate: (output) =>
      output.cross_direction.life_stage === 'transitioning',
    sentence:
      'Reading: transitioning. A change is happening or imminent.',
  },
  {
    id: 'life_stage_settled',
    slot: 'life_stage_summary',
    predicate: (output) => output.cross_direction.life_stage === 'settled',
    sentence:
      'Reading: settled. The architecture is in place; no current change in shape.',
  },
  {
    id: 'life_stage_enduring',
    slot: 'life_stage_summary',
    predicate: (output) => output.cross_direction.life_stage === 'enduring',
    // Composed around the term per §6.16 voice note.
    sentence: 'The architecture is in place. Carrying what he carries.',
  },
  {
    id: 'life_stage_drifting',
    slot: 'life_stage_summary',
    predicate: (output) => output.cross_direction.life_stage === 'drifting',
    // Composed around the term per §6.16 voice note.
    sentence:
      'The architecture works in the sense that nothing forces a change. Whether it is right remains an open reading.',
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
    sentence: 'Paid work reads chosen. The load is also paid work.',
  },
  {
    id: 'work_load_chosen_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'chosen' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence:
      'Paid work reads chosen. The current load is elsewhere, in caring.',
  },
  {
    id: 'work_load_endured_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'endured' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence: 'Paid work reads endured. The load is paid work. Compressed.',
  },
  {
    id: 'work_load_endured_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'endured' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence:
      'Paid work reads endured. The load is caring. Both compress.',
  },
  {
    id: 'work_load_consuming_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'consuming' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence: 'Paid work consumes him. It is also the load.',
  },
  {
    id: 'work_load_consuming_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'consuming' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence: 'Paid work consumes him. The load is caring on top.',
  },
  {
    id: 'work_load_functional_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'functional' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence: 'Paid work reads functional. The load is paid work itself.',
  },
  {
    id: 'work_load_functional_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'functional' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence: 'Paid work neutral. The load is caring.',
  },
  {
    id: 'work_load_functional_household',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'functional' &&
      output.cross_direction.primary_load === 'household_admin',
    sentence: 'Paid work neutral. The load is household administration.',
  },
  {
    id: 'work_load_functional_none',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'functional' &&
      output.cross_direction.primary_load === 'none',
    sentence: 'Paid work neutral. No primary load reading.',
  },
  {
    id: 'work_load_between_none',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'between' &&
      output.cross_direction.primary_load === 'none',
    sentence: 'Between paid work commitments. No primary load reading.',
  },
  {
    id: 'work_load_between_caregiving',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'between' &&
      output.cross_direction.primary_load === 'caregiving',
    sentence: 'Between paid work. The load is caring.',
  },
  {
    id: 'work_load_peripheral_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'peripheral' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence:
      'Paid work reads peripheral. Yet paid work is what is absorbing. A tension reading.',
  },
  {
    id: 'work_load_defining_paid',
    slot: 'work_load_summary',
    predicate: (output) =>
      output.cross_direction.paid_work_relationship === 'defining' &&
      output.cross_direction.primary_load === 'paid_work',
    sentence: 'Paid work defines the shape. The work is who he is, not what he does.',
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
      'Solitary by default; Relationship reading real and active. The pull is real despite the temperament.',
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
      'Solitary by default; Relationship reading quiet. The two read consistent.',
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
      'Solitary by default. Relationship reading suppressed; the absence registers as felt despite the temperament.',
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
      'Social by default; Relationship reading real and active. The two read consistent.',
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
      'Social by default; relational domains read reduced. A disconnection pattern.',
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
      'Solitary by default; Contribution reading firing without a group anchoring. The pull is to contribute, the context for it is not yet in place.',
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
      "Social by default; Contribution reading firing without a group anchoring. The pull and the context don't match.",
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
      'Social by default; group belonging in place but Contribution reading quiet. The structure is there; the pull is not currently.',
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
      'Balanced sociality; Relationship reading real and active. The two read consistent.',
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
      'Balanced sociality; relational domains read thin. The pull is balanced but the texture is reduced.',
  },
  {
    id: 'sociality_balanced_default',
    slot: 'sociality_summary',
    predicate: (output) =>
      output.cross_direction.sociality_default === 'balanced',
    sentence: 'Reading: balanced sociality.',
  },
  /* 7.15 (v4) — Narrowing summary slot (NEW) */
  {
    id: 'narrowing_summary_all_high',
    slot: 'narrowing_summary',
    predicate: (output) => allBandsAt(output, 'high'),
    sentence: 'All seven dimensions reading high.',
  },
  {
    id: 'narrowing_summary_all_moderate',
    slot: 'narrowing_summary',
    predicate: (output) => allBandsAt(output, 'moderate'),
    sentence: 'All seven dimensions reading moderate.',
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
    sentence: 'Most dimensions reading low. Light across the seven.',
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
    sentence: 'Several dimensions reading high; others moderate or low.',
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
