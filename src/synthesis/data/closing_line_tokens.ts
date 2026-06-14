// Closing line token fallbacks. Sourced verbatim from SYNTHESIS.md section 5.8. Placeholders are interpolated in closing_lines.ts.

import type { ClosingLineId } from '../types';

export const CLOSING_LINE_TOKENS: Record<ClosingLineId, string> = {
  closing_between_shapes: 'Recent life shape change; no replacement structure.',
  closing_mid_process: 'Active quadrant with recent and awkward reaching.',
  closing_capacity_strain: 'Capacity strain firing on {direction_display}.',
  closing_stopped_expecting: 'Stopped expecting firing on {direction_display}.',
  closing_phantom: '{direction_display} named as a desired direction.',
};
