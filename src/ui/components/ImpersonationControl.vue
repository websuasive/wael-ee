<script setup lang="ts">
// ImpersonationControl. Admin-mode header control. Stub for v1: the
// impersonation backend is a future task. The mechanism (banner,
// "exit impersonation" button, store integration) is wired so the real
// user-fetching backend can land later without UI churn.
import { storeToRefs } from 'pinia';
import { useActiveReadingStore } from '../stores/activeReading';

const store = useActiveReadingStore();
const { source, sourceId } = storeToRefs(store);

function onExit(): void {
  store.clear();
}
</script>

<template>
  <div class="impersonation-control">
    <span class="impersonation-control-label">Impersonate user:</span>
    <input
      type="search"
      class="impersonation-control-input"
      placeholder="Impersonation coming soon"
      disabled
    >
    <span
      v-if="source === 'impersonation'"
      class="impersonation-active"
    >
      Viewing as: {{ sourceId ?? 'unknown' }}
      <button
        type="button"
        @click="onExit"
      >
        Exit impersonation
      </button>
    </span>
  </div>
</template>
