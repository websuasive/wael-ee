<script setup lang="ts">
// ResultsView. Wraps the Dashboard (render layer) with empty/loading/error
// guards. The Dashboard receives a non-null RenderingInstructions prop;
// this view is responsible for the surrounding state machine.
import { storeToRefs } from 'pinia';
import { useActiveReadingStore } from '../stores/activeReading';
import Dashboard from '../components/dashboard/Dashboard.vue';
import LoadingState from '../components/shared/LoadingState.vue';
import ErrorState from '../components/shared/ErrorState.vue';
import TermPopover from '../components/shared/TermPopover.vue';

const store = useActiveReadingStore();
const { renderingInstructions, loading, error, source, sourceId } = storeToRefs(store);

function getModeLabel(): string {
  if (source.value === 'fixture') {
    return `FIXTURE: ${sourceId.value || 'unknown'}`;
  }
  if (source.value === 'answers') {
    return 'LIVE TEST';
  }
  return '';
}

function getModeClass(): string {
  if (source.value === 'fixture') return 'fixture';
  if (source.value === 'answers') return 'live';
  return '';
}
</script>

<template>
  <div class="view view-results">
    <!-- Mode indicator badge -->
    <div v-if="getModeLabel()" class="mode-badge" :class="getModeClass()">
      <span class="mode-badge-text">{{ getModeLabel() }}</span>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState
      v-else-if="error"
      :reference-code="error.message"
    />
    <Dashboard
      v-else-if="renderingInstructions"
      :rendering="renderingInstructions"
    />
    <section
      v-else
      class="view-empty"
    >
      <h1>No assessment loaded</h1>
      <p>
        <RouterLink to="/assessment">
          Take the assessment
        </RouterLink>
        to see your reading.
      </p>
    </section>
    <TermPopover />
  </div>
</template>

<style scoped>
.mode-badge {
  position: fixed;
  top: var(--space-sm);
  right: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  z-index: 100;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mode-badge.live {
  background: var(--color-background-primary);
  border: var(--border-thin) solid var(--color-border-primary);
  color: var(--color-text-secondary);
}

.mode-badge.fixture {
  background: var(--color-accent);
  border: var(--border-thin) solid var(--color-accent);
  color: var(--color-text-on-accent);
}

.mode-badge-text {
  display: block;
}
</style>
