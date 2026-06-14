// Empty-SlotContent rule helper. Returns true if the slot has any renderable content (interpretive_text non-null OR token_text non-empty). Consuming components use this in v-if guards to honour the omit-slot rule from SYNTHESIS.md section 2.3.

import type { SlotContent } from '../../synthesis';

export function shouldRenderSlot(slot: SlotContent): boolean {
  return slot.interpretive_text !== null || slot.token_text !== '';
}
