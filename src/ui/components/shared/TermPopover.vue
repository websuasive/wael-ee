<template>
  <div
    v-if="activeTerm !== null"
    ref="popoverRef"
    class="term-popover"
    role="dialog"
    aria-modal="false"
    :aria-labelledby="isPanelExplanation ? undefined : 'term-popover-heading'"
    tabindex="-1"
    :style="positionStyle"
    @click.stop
    @keydown.tab="handleTab"
  >
    <h3
      v-if="!isPanelExplanation"
      id="term-popover-heading"
      class="term-popover__heading"
    >
      {{ activeHeading ?? activeTerm }}
    </h3>
    <p class="term-popover__body">
      {{ explanation }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
  type CSSProperties,
} from 'vue';
import { useTermPopover } from '../../render/term_popover_store';
import { lookupTerm } from '../../render/term_lookup';

const { activeTerm, activeHeading, anchorElement, closePopover } = useTermPopover();

const popoverRef = ref<HTMLElement | null>(null);
const savedAnchor = ref<HTMLElement | null>(null);
const positionTop = ref<number>(0);
const positionLeft = ref<number>(0);

const MOBILE_BREAKPOINT = 600;
const ANCHOR_OFFSET = 4;

const explanation = computed<string>(() => {
  if (activeTerm.value === null) return '';
  return lookupTerm(activeTerm.value) ?? activeTerm.value;
});

const isPanelExplanation = computed<boolean>(() => {
  if (activeTerm.value === null) return false;
  return activeTerm.value.endsWith('_panel');
});

const positionStyle = computed<CSSProperties>(() => ({
  top: `${positionTop.value}px`,
  left: `${positionLeft.value}px`,
}));

function recomputePosition(): void {
  const anchor = anchorElement.value;
  const popover = popoverRef.value;
  if (anchor === null || popover === null) return;

  const rect = anchor.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < MOBILE_BREAKPOINT;

  let top: number;
  if (isMobile) {
    top = rect.bottom + ANCHOR_OFFSET + window.scrollY;
  } else {
    top = rect.top - popoverRect.height - ANCHOR_OFFSET + window.scrollY;
    if (top < window.scrollY) {
      top = rect.bottom + ANCHOR_OFFSET + window.scrollY;
    }
  }

  let left = rect.left + window.scrollX;
  const maxLeft = window.scrollX + viewportWidth - popoverRect.width - ANCHOR_OFFSET;
  if (left > maxLeft) left = maxLeft;
  if (left < window.scrollX + ANCHOR_OFFSET) {
    left = window.scrollX + ANCHOR_OFFSET;
  }

  const maxTop = window.scrollY + viewportHeight - popoverRect.height - ANCHOR_OFFSET;
  if (top > maxTop) top = maxTop;
  if (top < window.scrollY + ANCHOR_OFFSET) {
    top = window.scrollY + ANCHOR_OFFSET;
  }

  positionTop.value = top;
  positionLeft.value = left;
}

function handleDocumentClick(event: MouseEvent): void {
  const popover = popoverRef.value;
  if (popover === null) return;
  const target = event.target as Node | null;
  if (target !== null && popover.contains(target)) return;
  if (
    target !== null &&
    savedAnchor.value !== null &&
    savedAnchor.value.contains(target)
  ) {
    // Click was on the originating indicator; let its handler run.
    return;
  }
  closePopover();
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    closePopover();
  }
}

function handleResize(): void {
  recomputePosition();
}

function handleScroll(): void {
  recomputePosition();
}

function handleTab(event: KeyboardEvent): void {
  // Single focusable element (the popover container itself); keep focus inside.
  const popover = popoverRef.value;
  if (popover === null) return;
  const focusables = popover.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) {
    event.preventDefault();
    popover.focus();
    return;
  }
  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;
  const active = document.activeElement as HTMLElement | null;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function attachListeners(): void {
  document.addEventListener('click', handleDocumentClick, true);
  document.addEventListener('keydown', handleEscape);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, true);
}

function detachListeners(): void {
  document.removeEventListener('click', handleDocumentClick, true);
  document.removeEventListener('keydown', handleEscape);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll, true);
}

watch(activeTerm, async (next, prev) => {
  if (next !== null && prev === null) {
    // Opening
    savedAnchor.value = anchorElement.value;
    await nextTick();
    recomputePosition();
    popoverRef.value?.focus({ preventScroll: true });
    attachListeners();
  } else if (next === null && prev !== null) {
    // Closing
    detachListeners();
    const anchor = savedAnchor.value;
    savedAnchor.value = null;
    await nextTick();
    anchor?.focus();
  } else if (next !== null && prev !== null) {
    // Replacing while open: update saved anchor, reposition.
    savedAnchor.value = anchorElement.value;
    await nextTick();
    recomputePosition();
    popoverRef.value?.focus({ preventScroll: true });
  }
});

onBeforeUnmount(() => {
  detachListeners();
});
</script>

<style scoped>
.term-popover {
  position: absolute;
  z-index: 1000;
  max-width: 320px;
  padding: var(--space-md);
  background: var(--color-background-primary);
  border: var(--border-thin) solid var(--color-border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  line-height: var(--leading-tight);
}

.term-popover:focus-visible {
  outline: none;
  box-shadow: var(--shadow-md), var(--shadow-focus);
}

.term-popover__heading {
  margin: 0 0 var(--space-sm) 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.term-popover__body {
  margin: 0;
  font-size: var(--text-base);
  line-height: 1.45;
  color: var(--color-text-primary);
}
</style>
