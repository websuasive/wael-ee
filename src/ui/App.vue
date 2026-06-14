<script setup lang="ts">
// App.vue. Top-level shell: persistent AppHeader plus the active route.
// Per RENDER.md §8.5 option (c): App.vue catches render errors from any descendant
// component via errorCaptured and transitions to error state. The existing
// ResultsView.vue three-state model (loading/error/ready for dashboard data) stays
// unchanged; this is the top-level render-error-capture layer.
import { ref, onErrorCaptured } from 'vue';
import AppHeader from './components/AppHeader.vue';
import ErrorState from './components/shared/ErrorState.vue';

// Error state: tracks whether a render error has been captured.
const hasRenderError = ref(false);
const errorReferenceCode = ref<string>('');

onErrorCaptured((err, _instance, info) => {
  // Generate a reference code for support purposes
  errorReferenceCode.value = `ERR-${Date.now().toString(36).toUpperCase()}`;
  
  // Log error context to console for development and production debugging.
  // eslint-disable-next-line no-console
  console.error('[App.vue] Render error captured:', {
    error: err,
    info,
    referenceCode: errorReferenceCode.value,
  });
  
  // Transition to error state
  hasRenderError.value = true;
  
  // Return false to halt error propagation per RENDER.md §8.5
  return false;
});
</script>

<template>
  <AppHeader />
  <ErrorState
    v-if="hasRenderError"
    :reference-code="errorReferenceCode"
  />
  <RouterView v-else />
</template>
