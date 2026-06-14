<template>
  <button
    class="panel-heading-tooltip"
    type="button"
    :aria-label="`Show explanation for ${term}`"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    ?
  </button>
</template>

<script setup lang="ts">
import { useTermPopover } from '../../render/term_popover_store';

const props = defineProps<{ term: string }>();

const { openPopover } = useTermPopover();

const handleClick = (event: Event): void => {
  const target = event.currentTarget as HTMLElement;
  openPopover(props.term, target);
};
</script>

<style scoped>
.panel-heading-tooltip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--space-xs);
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

.panel-heading-tooltip:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

@media (hover: hover) {
  .panel-heading-tooltip:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
}
</style>
