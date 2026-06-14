<script setup lang="ts">
// LaboratoryView. The laboratory hub grid.
//
// Displays eight boxes in a 4+4 grid: seven protocol boxes and one For You box.
// Each box navigates to a per-protocol page or the combined For You surface.
// Boxes are disabled when there is no active reading.

import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useActiveReadingStore } from '../stores/activeReading';

const router = useRouter();
const activeReading = useActiveReadingStore();

const hasReading = computed(() => activeReading.isReady);

type BoxKind = 'protocol' | 'for_you';

interface Box {
  label: string;
  to: string;
  kind: BoxKind;
}

const boxes: ReadonlyArray<Box> = [
  { label: 'Stir', to: '/laboratory/stir', kind: 'protocol' },
  { label: 'Loophole', to: '/laboratory/loophole', kind: 'protocol' },
  { label: 'Slip', to: '/laboratory/slip', kind: 'protocol' },
  { label: 'Catch', to: '/laboratory/catch', kind: 'protocol' },
  { label: 'Trespass', to: '/laboratory/trespass', kind: 'protocol' },
  { label: 'Aside', to: '/laboratory/aside', kind: 'protocol' },
  { label: 'Steeping', to: '/laboratory/steeping', kind: 'protocol' },
  { label: 'For You', to: '/laboratory/for-you', kind: 'for_you' },
];

// Per-box availability predicate. Currently all boxes require an active reading.
// Future conditions (e.g. time-based unlock, prerequisite completion) will extend this.
function isAvailable(_box: Box): boolean {
  return hasReading.value;
}

function onBoxClick(box: Box): void {
  router.push(box.to);
}
</script>

<template>
  <main class="laboratory-view" role="main" aria-label="Laboratory">
    <section class="laboratory-view__intro">
      <h1 class="laboratory-view__title">Laboratory</h1>
      <p class="laboratory-view__description">
        Explore experiences by protocol. Select a protocol to see related activities.
      </p>
    </section>

    <nav class="laboratory-view__grid" aria-label="Laboratory navigation">
      <button
        v-for="box in boxes"
        :key="box.to"
        type="button"
        class="laboratory-view__box"
        :disabled="!isAvailable(box)"
        @click="onBoxClick(box)"
      >
        {{ box.label }}
      </button>
    </nav>
  </main>
</template>

<style scoped>
.laboratory-view {
  width: 100%;
}

.laboratory-view__intro {
  max-width: var(--content-narrow-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-lg) var(--space-lg);
}

.laboratory-view__title {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-md);
  line-height: var(--leading-snug);
}

.laboratory-view__description {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.laboratory-view__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  max-width: var(--content-wide-width);
  margin: 0 auto;
  padding: 0 var(--space-lg) var(--space-3xl);
}

@media (max-width: 600px) {
  .laboratory-view__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.laboratory-view__box {
  background: var(--color-background-primary);
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  min-height: 120px;
  transition: border-color var(--duration-fast);
}

.laboratory-view__box:hover:not(:disabled) {
  border-color: var(--color-text-tertiary);
}

.laboratory-view__box:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 2px;
}
</style>
