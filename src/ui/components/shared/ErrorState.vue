<template>
  <div
    class="error-state"
    role="alert"
  >
    <h1 class="error-state__heading">
      Something's gone wrong.
    </h1>
    <p class="error-state__message">
      Refresh and try again, or get in touch if it keeps happening.
    </p>
    <p class="error-state__reference">
      Reference: <span class="error-state__code">{{ referenceCode }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
// ErrorState — RENDER.md section 8.5. Renders the user-safe message + reference code.
defineProps<{ referenceCode: string }>();
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  min-height: 100vh;
  padding: var(--space-lg);
  background: var(--color-background-secondary);
  text-align: center;
}

.error-state__heading {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.error-state__message {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  max-width: 480px;
}

.error-state__reference {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.error-state__code {
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}
</style>
