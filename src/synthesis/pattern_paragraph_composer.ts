// Pattern paragraph composer for the new six-axis compositional system.
// Stage 1: builds the composer and proves it in isolation.
// Does NOT retire the portraits or token yet (stage 2).

import type { EngineOutput, InputMap } from '../engine';
import { shapeSentences } from './data/shape_sentences';
import { allBandsAt } from './predicates';

function countDomainsWithValue(
  output: EngineOutput,
  value: 'reduced_wants_back' | 'reduced_at_peace',
): number {
  return output.domains.filter((m) => m.value === value).length;
}

function getDominantDirection(output: EngineOutput): EngineOutput['directions'][0] | null {
  if (output.directions.length === 0) return null;
  return output.directions.reduce((highest, current) =>
    current.pull > highest.pull ? current : highest
  );
}

export function composePatternParagraph(
  output: EngineOutput,
  input: InputMap,
): string[] {
  const sentences: string[] = [];

  // AXIS 1: PULL CHARACTER
  const dominant = getDominantDirection(output);
  if (dominant !== null) {
    const hasHeldWithExpression =
      dominant.pull_state.includes('held_attributed_with_expression');
    const hasHeldUnexpressed =
      dominant.pull_state.includes('held_attributed_unexpressed');
    const hasSuppressed = dominant.pull_quality.includes('suppressed');
    const hasSaturated = dominant.pull_quality.includes('saturated');
    const hasPhantom =
      dominant.pull_quality.includes('phantom') ||
      dominant.pull_quality.includes('phantom_partial');

    if (hasHeldWithExpression) {
      sentences.push(shapeSentences.find((s) => s.id === 'pull_character_held')!.sentence);
    } else if (hasSuppressed) {
      sentences.push(shapeSentences.find((s) => s.id === 'pull_character_suppressed')!.sentence);
    } else if (hasHeldUnexpressed) {
      sentences.push(shapeSentences.find((s) => s.id === 'pull_character_held')!.sentence);
    } else if (hasSaturated) {
      sentences.push(shapeSentences.find((s) => s.id === 'pull_character_saturated')!.sentence);
    } else if (hasPhantom) {
      sentences.push(shapeSentences.find((s) => s.id === 'pull_character_phantom')!.sentence);
    }
  }

  // AXIS 2: RELATIONAL
  const relational = input.cross_direction.relational_presence;
  if (relational === 'mostly_absent') {
    sentences.push(shapeSentences.find((s) => s.id === 'relational_mostly_absent')!.sentence);
  } else if (relational === 'partial') {
    sentences.push(shapeSentences.find((s) => s.id === 'relational_partial')!.sentence);
  }

  // AXIS 3: ATTENTION
  const attention = input.cross_direction.attention_pattern;
  if (attention === 'autopilot') {
    sentences.push(shapeSentences.find((s) => s.id === 'attention_autopilot')!.sentence);
  }

  // AXIS 4: DOMAINS
  const wantsBackCount = countDomainsWithValue(output, 'reduced_wants_back');
  const atPeaceCount = countDomainsWithValue(output, 'reduced_at_peace');
  if (wantsBackCount >= 6) {
    sentences.push(shapeSentences.find((s) => s.id === 'domains_wants_back')!.sentence);
  } else if (atPeaceCount >= 3) {
    sentences.push(shapeSentences.find((s) => s.id === 'domains_at_peace')!.sentence);
  }

  // AXIS 5: CONSTRAINT
  if (allBandsAt(output, 'high')) {
    sentences.push(shapeSentences.find((s) => s.id === 'constraint_high')!.sentence);
  } else if (allBandsAt(output, 'moderate')) {
    sentences.push(shapeSentences.find((s) => s.id === 'constraint_moderate')!.sentence);
  }

  // AXIS 6: STAGE
  if (output.cross_direction.life_stage === 'enduring') {
    sentences.push(shapeSentences.find((s) => s.id === 'stage_enduring')!.sentence);
  } else if (output.cross_direction.life_stage === 'drifting') {
    sentences.push(shapeSentences.find((s) => s.id === 'stage_drifting')!.sentence);
  }

  // CAP at 4 (priority order is already maintained by the evaluation order above)
  return sentences.slice(0, 4);
}
