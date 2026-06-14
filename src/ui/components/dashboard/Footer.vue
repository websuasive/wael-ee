<template>
  <footer class="dashboard-footer">
    {{ footerText }}
  </footer>
</template>

<script setup lang="ts">
// Footer — RENDER.md section 4.11. Pulls text from static_copy so content
// edits don't touch component code.
import { staticCopy } from '../../render/static_copy';

const footerText = staticCopy.dashboard_footer;
</script>

<style scoped>
.dashboard-footer {
  margin-top: var(--space-2xl);
  padding-top: var(--space-md);
  border-top: var(--border-hairline) solid var(--color-border-tertiary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  color: var(--color-text-tertiary);
}
</style>
