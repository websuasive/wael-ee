<template>
  <div
    class="loading-state"
    role="status"
    aria-live="polite"
  >
    <p class="loading-state__text">
      Reading what's there.
    </p>
    <div
      class="loading-state__pulse"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
// LoadingState — RENDER.md section 8.4. Pure presentational; no props, no logic.
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  min-height: 100vh;
  padding: var(--space-lg);
  background: var(--color-background-secondary);
}

.loading-state__text {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  text-align: center;
}

.loading-state__pulse {
  width: 120px;
  height: var(--space-xxs);
  background: var(--color-text-secondary);
  border-radius: var(--radius-pill);
  opacity: 0.3;
  animation: loading-state-pulse 1.5s ease-in-out infinite;
}

@keyframes loading-state-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .loading-state__pulse {
    animation: none;
    opacity: 1;
  }
}
</style>
