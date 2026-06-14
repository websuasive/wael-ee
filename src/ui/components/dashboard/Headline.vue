<template>
  <h1 class="headline">
    <template v-if="data.direction_names.length > 0">
      {{ data.direction_names.join(' · ') }}
    </template>
    <template v-else-if="data.situation_text">
      {{ data.situation_text }}
    </template>
  </h1>
</template>

<script setup lang="ts">
// Headline — RENDER.md section 4.2. Renders direction names joined by ' · '
// when present; falls back to situation_text. Synthesis guarantees at least
// one is populated; defensive both-empty handling is intentionally absent.
import type { HeadlineOutput } from '../../../synthesis';

defineProps<{ data: HeadlineOutput }>();
</script>

<style scoped>
.headline {
  margin: 0 0 var(--space-md) 0;
  font-family: var(--font-serif);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-5xl);
  line-height: 1.05;
  letter-spacing: -0.01em;
  text-wrap: balance;
  color: var(--color-text-primary);
}
</style>
