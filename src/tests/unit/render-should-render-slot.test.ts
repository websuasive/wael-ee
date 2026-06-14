// Unit tests for the empty-SlotContent rule helper.
// Spec: SYNTHESIS.md section 2.3. Slot is omitted when BOTH
// interpretive_text === null AND token_text === '' (empty string).

import { describe, it, expect } from 'vitest';
import { shouldRenderSlot } from '@/ui/render/should_render_slot';

describe('shouldRenderSlot — both empty → false', () => {
  it('interpretive_text=null and token_text="" → false', () => {
    expect(shouldRenderSlot({ interpretive_text: null, token_text: '' })).toBe(
      false,
    );
  });
});

describe('shouldRenderSlot — interpretive_text non-null → true', () => {
  it('interpretive only → true', () => {
    expect(
      shouldRenderSlot({ interpretive_text: 'Some text.', token_text: '' }),
    ).toBe(true);
  });

  it('both populated → true', () => {
    expect(
      shouldRenderSlot({
        interpretive_text: 'Some text.',
        token_text: 'Some token.',
      }),
    ).toBe(true);
  });
});

describe('shouldRenderSlot — token_text non-empty → true', () => {
  it('token only → true', () => {
    expect(
      shouldRenderSlot({ interpretive_text: null, token_text: 'Token only.' }),
    ).toBe(true);
  });
});

describe('shouldRenderSlot — empty-string interpretive vs null', () => {
  it('interpretive_text="" with token_text="" → true (empty string is not null per spec)', () => {
    // Spec section 2.3 explicitly conditions on interpretive_text === null.
    // An empty string does not satisfy that, so the slot is treated as
    // renderable (will render as nothing visible, but the slot is present).
    expect(shouldRenderSlot({ interpretive_text: '', token_text: '' })).toBe(
      true,
    );
  });
});

describe('shouldRenderSlot — purity', () => {
  it('two calls with identical input return identical output', () => {
    const slot = { interpretive_text: 'x', token_text: 'y' };
    expect(shouldRenderSlot(slot)).toBe(shouldRenderSlot(slot));
  });
});
