// Constraints panel construction. Implements SYNTHESIS.md section 5.6. Note: section 5.6's summary slot has no shape sentence library and no token fallback specified in the spec; this implementation emits empty SlotContent (omit-slot per section 2.3).

import type { EngineOutput, InputMap } from '../engine';
import type { ConstraintsPanel, ConstraintLine, SlotContent } from './types';
import {
  CONSTRAINT_DISPLAY_NAMES,
  CONSTRAINT_BAND_TOKENS,
} from './data/tokens';
import { findFirstMatchingSentence } from './predicates';
import { interpolate } from './interpolation';

const CONSTRAINT_ORDER = [
  'energy',
  'time',
  'body_capacity',
  'permission',
] as const;

export function computeConstraintsPanel(
  output: EngineOutput,
  input: InputMap,
): ConstraintsPanel {
  const constraint_lines: ConstraintLine[] = [];
  for (const name of CONSTRAINT_ORDER) {
    const c = output.constraints[name];
    if (!c.fires) continue;

    let sentence: SlotContent;
    if (name === 'permission') {
      const match = findFirstMatchingSentence(
        'permission_sub_shape',
        output,
        input,
      );
      sentence =
        match !== null
          ? { interpretive_text: match.sentence, token_text: match.sentence }
          : { interpretive_text: null, token_text: '' };
    } else {
      const slotName = `${name}_constraint` as 'energy_constraint' | 'time_constraint' | 'body_capacity_constraint';
      const match = findFirstMatchingSentence(slotName, output, input);
      sentence =
        match !== null
          ? { interpretive_text: match.sentence, token_text: '' }
          : { interpretive_text: null, token_text: '' };
    }

    constraint_lines.push({
      constraint_name: CONSTRAINT_DISPLAY_NAMES[name],
      constraint_engine_name: name,
      band_label: lookupBand(name, c.band),
      intensity: c.value,
      sentence,
    });
  }

  // intact_callout
  const intactNames: string[] = [];
  for (const name of CONSTRAINT_ORDER) {
    if (!output.constraints[name].fires) {
      intactNames.push(CONSTRAINT_DISPLAY_NAMES[name]);
    }
  }
  const intact_callout: SlotContent =
    intactNames.length > 0
      ? {
          interpretive_text: null,
          token_text: interpolate('{names} reading intact.', {
            names: intactNames.join(', '),
          }),
        }
      : { interpretive_text: null, token_text: '' };

  return {
    summary: { interpretive_text: null, token_text: '' },
    constraint_lines,
    sustained_constraint_intensity:
      output.constraints.sustained_constraint_intensity,
    intact_callout,
    permission_sub_shape_text: null,
  };
}

function lookupBand(
  name: (typeof CONSTRAINT_ORDER)[number],
  band: string,
): string {
  // Type-safe per-constraint dispatch: each constraint's band token map is keyed by its own band union.
  switch (name) {
    case 'energy':
      return CONSTRAINT_BAND_TOKENS.energy[
        band as keyof typeof CONSTRAINT_BAND_TOKENS.energy
      ];
    case 'time':
      return CONSTRAINT_BAND_TOKENS.time[
        band as keyof typeof CONSTRAINT_BAND_TOKENS.time
      ];
    case 'body_capacity':
      return CONSTRAINT_BAND_TOKENS.body_capacity[
        band as keyof typeof CONSTRAINT_BAND_TOKENS.body_capacity
      ];
    case 'permission':
      return CONSTRAINT_BAND_TOKENS.permission[
        band as keyof typeof CONSTRAINT_BAND_TOKENS.permission
      ];
  }
}
