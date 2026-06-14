// Pure function to resolve the gated card-c value based on card-b changes.
// Extracted from CardBlockRenderer for unit testing.

export type GatedCDecision = string | undefined | 'no_change';

/**
 * Resolves the card-c value when card-b changes, respecting the c-gate.
 * 
 * Rules:
 * - When newB === gateValue: set c to 'skipped' (gate fires)
 * - When oldB === gateValue && newB !== gateValue && currentC === 'skipped': clear c (set to undefined)
 * - Otherwise: no change (return 'no_change' sentinel)
 * - When newB is undefined/null: no spurious write (return 'no_change')
 * 
 * @param newB - The new value of card-b
 * @param oldB - The previous value of card-b
 * @param gateValue - The gate value from conditionalOn (e.g., 'a')
 * @param currentC - The current value of card-c
 * @returns The new value for card-c, or 'no_change' if it should remain as-is
 */
export function resolveGatedC(
  newB: string | undefined | null,
  oldB: string | undefined | null,
  gateValue: string,
  currentC: string | undefined
): GatedCDecision {
  // Guard against undefined/null newB
  if (newB === undefined || newB === null) {
    return 'no_change';
  }

  // When b becomes the gate value, set c to 'skipped'
  if (newB === gateValue) {
    return 'skipped';
  }

  // When b changes from gate value to non-gate value, clear the stale 'skipped'
  if (oldB === gateValue && newB !== gateValue && currentC === 'skipped') {
    return undefined;
  }

  // Otherwise, no change
  return 'no_change';
}
