// Unit tests for the term popover singleton store.
//
// Note: vitest is configured with environment 'node' (no jsdom), so we use a
// plain object cast to HTMLElement for the anchor — the store does not call
// any methods on the element, only stores the reference.

import { describe, it, expect, beforeEach } from 'vitest';
import { useTermPopover } from '@/ui/render/term_popover_store';

function makeAnchor(label = 'anchor'): HTMLElement {
  return { __label: label } as unknown as HTMLElement;
}

describe('useTermPopover — initial / reset state', () => {
  beforeEach(() => {
    useTermPopover().closePopover();
  });

  it('after closePopover, activeTerm and anchorElement are null', () => {
    const store = useTermPopover();
    expect(store.activeTerm.value).toBeNull();
    expect(store.anchorElement.value).toBeNull();
  });
});

describe('useTermPopover — openPopover', () => {
  beforeEach(() => {
    useTermPopover().closePopover();
  });

  it('sets activeTerm and anchorElement', () => {
    const store = useTermPopover();
    const anchor = makeAnchor('a1');
    store.openPopover('capacity strain', anchor);
    expect(store.activeTerm.value).toBe('capacity strain');
    expect(store.anchorElement.value).toBe(anchor);
  });
});

describe('useTermPopover — closePopover', () => {
  beforeEach(() => {
    useTermPopover().closePopover();
  });

  it('after open then close, both refs are null', () => {
    const store = useTermPopover();
    store.openPopover('mattering', makeAnchor());
    store.closePopover();
    expect(store.activeTerm.value).toBeNull();
    expect(store.anchorElement.value).toBeNull();
  });
});

describe('useTermPopover — singleton invariant', () => {
  beforeEach(() => {
    useTermPopover().closePopover();
  });

  it('two useTermPopover() calls share underlying ref values', () => {
    const a = useTermPopover();
    const b = useTermPopover();
    expect(a.activeTerm).toBe(b.activeTerm);
    expect(a.anchorElement).toBe(b.anchorElement);
  });

  it('mutation via one call site is observable via another', () => {
    const a = useTermPopover();
    const b = useTermPopover();
    const anchor = makeAnchor('shared');
    a.openPopover('suppressed', anchor);
    expect(b.activeTerm.value).toBe('suppressed');
    expect(b.anchorElement.value).toBe(anchor);
    b.closePopover();
    expect(a.activeTerm.value).toBeNull();
    expect(a.anchorElement.value).toBeNull();
  });
});

describe('useTermPopover — replace semantics', () => {
  beforeEach(() => {
    useTermPopover().closePopover();
  });

  it('opening while already open replaces; no stack, no queue', () => {
    const store = useTermPopover();
    const el1 = makeAnchor('el1');
    const el2 = makeAnchor('el2');
    store.openPopover('A', el1);
    store.openPopover('B', el2);
    expect(store.activeTerm.value).toBe('B');
    expect(store.anchorElement.value).toBe(el2);
    store.closePopover();
    // After a single close, state is fully cleared (no queued 'A').
    expect(store.activeTerm.value).toBeNull();
    expect(store.anchorElement.value).toBeNull();
  });
});
