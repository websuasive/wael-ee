<template>
  <h1 class="headline">
    <template v-if="data.direction_names.length > 0">
      {{ formatDirectionNames(data.direction_names) }}
    </template>
    <template v-else-if="data.situation_text">
      {{ data.situation_text }}
    </template>
  </h1>
</template>

<script setup lang="ts">
// Headline — RENDER.md section 4.2. Renders direction names in prose style
// (comma-and) when present; falls back to situation_text. Synthesis guarantees at least
// one is populated; defensive both-empty handling is intentionally absent.
import type { HeadlineOutput } from '../../../synthesis';

defineProps<{ data: HeadlineOutput }>();

function formatDirectionNames(names: string[]): string {
  if (names.length === 1) {
    return names[0]!;
  }
  if (names.length === 2) {
    return `${names[0]!} and ${names[1]!}`;
  }
  // 3 or more: join all but last with commas, then "and" for last (no Oxford comma)
  const allButLast = names.slice(0, -1);
  const last = names[names.length - 1]!;
  return `${allButLast.join(', ')} and ${last}`;
}
</script>

<style scoped>
.headline {
  margin: 0 0 var(--space-md) 0;
  font-family: var(--font-serif);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-4xl);
  line-height: 1.1;
  letter-spacing: -0.01em;
  text-wrap: balance;
  color: var(--color-text-primary);
}
</style>
