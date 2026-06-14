<template>
  <span class="term-indicator">
    <slot>{{ term }}</slot><button
      class="term-indicator__icon"
      type="button"
      :aria-label="`Show explanation for ${term}`"
      @click="handleClick"
      @keydown.enter.prevent="handleClick"
      @keydown.space.prevent="handleClick"
    >?</button>
  </span>
</template>

<script setup lang="ts">
import { useTermPopover } from '../../render/term_popover_store';

const props = defineProps<{ term: string; heading?: string }>();

const { openPopover } = useTermPopover();

const handleClick = (event: Event): void => {
  const target = event.currentTarget as HTMLElement;
  openPopover(props.term, target, props.heading);
};
</script>

<style scoped>
.term-indicator {
  display: inline;
  text-decoration: underline dashed;
  text-decoration-color: var(--color-text-tertiary);
  text-underline-offset: 2px;
  color: inherit;
}

.term-indicator__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--space-xxs);
  padding: var(--space-sm);
  background: transparent;
  border: var(--border-thin) solid var(--color-border-secondary);
  border-radius: var(--radius-pill);
  color: var(--color-text-tertiary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  line-height: 1;
  cursor: pointer;
  vertical-align: baseline;
}

.term-indicator__icon:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

@media (hover: hover) {
  .term-indicator:hover {
    text-decoration-style: solid;
    text-decoration-color: var(--color-accent);
  }
  .term-indicator:hover .term-indicator__icon {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
}
</style>
