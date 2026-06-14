<script setup lang="ts">
// ExperienceFeed. Reusable feed that ranks, scopes, paginates, and renders cards.
//
// This component ranks the inventory once, applies a fixed scope filter, paginates,
// and renders cards. The filter UI and live filtering arrive in a later step.
// Detail drawer is owned by the parent — this component only emits open-detail.

import { computed, ref } from 'vue';
import { useActiveReadingStore } from '../../stores/activeReading';
import { useExperienceStatusStore } from '../../experience/status_store';
import { recommend, type ScoredVariant } from '../../experience/recommend';
import { diversify } from '../../experience/diversify';
import { loadInventory } from '../../experience/inventory';
import {
  EMPTY_FILTER_STATE,
  filterVariants,
  type FacetKey,
  type FilterState,
} from '../../experience/filter';
import type { Flag, RecommendableVariant } from '../../experience/types';
import ExperienceCard from './ExperienceCard.vue';
import ExperienceFilters from './ExperienceFilters.vue';

const props = defineProps<{
  // The scope filter applied BEFORE ranking (e.g. { protocol: ['stir'] }).
  // For an unscoped feed, pass EMPTY_FILTER_STATE.
  scopeFilter: FilterState;
  // When true, mounts the filter UI. When false (default), no filter UI.
  showFilters?: boolean;
  // Facets to hide from the filter UI. Forwarded to ExperienceFilters.
  hiddenFacets?: readonly FacetKey[];
}>();

const emit = defineEmits<{
  'open-detail': [variantId: string];
}>();

const activeReading = useActiveReadingStore();
const statusStore = useExperienceStatusStore();

// Flag lookup for filtering. Lifted to component scope for reuse by live filter.
function flagFor(id: string): Flag | null {
  const status = statusStore.flagFor(id);
  return status === null ? null : status.flag;
}

// Scoped variant list for filter UI facet counts. Computed once at setup
// since scopeFilter doesn't change within a mounted page.
const allVariants = loadInventory();
const scopedVariants: RecommendableVariant[] = filterVariants(
  allVariants,
  props.scopeFilter,
  flagFor,
);

const PAGE_SIZE = 12;
const pagesShown = ref(1);

interface InitialCapture {
  diversifiedTopBatch: ScoredVariant[]; // diversify() output (top 12), the spread-optimised head
  fullScored: ScoredVariant[]; // full ranked list, for pagination tail
}

const initialCapture = ((): InitialCapture | null => {
  // Apply scope filter before ranking (uses component-scope scopedVariants)
  const scoped = scopedVariants;

  const candidates =
    activeReading.renderingInstructions?.experience_candidate_directions ?? [];
  const narrowingBands =
    activeReading.renderingInstructions?.the_narrowings_panel.bands ?? [];
  const constraints = activeReading.engineOutput?.constraints;
  if (!constraints) return null;

  const flagSnapshot: Record<string, Flag> = {};
  for (const status of statusStore.allFlagged()) {
    flagSnapshot[status.variant_id] = status.flag;
  }

  const result = recommend(
    scoped,
    candidates,
    narrowingBands,
    constraints,
    flagSnapshot,
  );

  return {
    diversifiedTopBatch: diversify(result.scoredCandidates),
    fullScored: result.scoredCandidates,
  };
})();

// Live filter state for post-ranking masking. Empty = no-op (current state).
// When showFilters is true and the man toggles a filter, liveFilter updates →
// maskByLiveFilter re-masks → visibleCards/canShowMore/countLine update.
// The rank-once capture (initialCapture) is untouched; only the mask reacts.
const liveFilter = ref<FilterState>({ ...EMPTY_FILTER_STATE });

// Mask a ranked list by the live filter, preserving rank order and ScoredVariant wrapper.
function maskByLiveFilter(scored: ScoredVariant[]): ScoredVariant[] {
  return scored.filter(
    (sv) => filterVariants([sv.variant], liveFilter.value, flagFor).length > 0,
  );
}

// Masked versions of the ranked arrays for pagination.
const maskedFull = computed<ScoredVariant[]>(() => {
  if (initialCapture === null) return [];
  return maskByLiveFilter(initialCapture.fullScored);
});

const maskedTopBatch = computed<ScoredVariant[]>(() => {
  if (initialCapture === null) return [];
  return maskByLiveFilter(initialCapture.diversifiedTopBatch);
});

const visibleCards = computed<ScoredVariant[]>(() => {
  if (initialCapture === null) return [];
  if (pagesShown.value <= 1) {
    return maskedTopBatch.value;
  }
  const head = maskedTopBatch.value;
  const tail = maskedFull.value.slice(
    PAGE_SIZE,
    pagesShown.value * PAGE_SIZE,
  );
  return [...head, ...tail];
});

const canShowMore = computed<boolean>(() => {
  if (initialCapture === null) return false;
  const shown = pagesShown.value * PAGE_SIZE;
  return shown < maskedFull.value.length;
});

const countLine = computed<string | null>(() => {
  if (initialCapture === null) return null;
  const total = maskedFull.value.length;
  if (total === 0) return null;
  return `Showing ${visibleCards.value.length} of ${total}`;
});

function onShowMore(): void {
  pagesShown.value += 1;
}

function onCardOpenDetail(variantId: string): void {
  emit('open-detail', variantId);
}
</script>

<template>
  <section
    class="experience-feed"
    aria-label="Experience feed"
  >
    <ExperienceFilters
      v-if="showFilters"
      v-model:filter-state="liveFilter"
      :variants="scopedVariants"
      :flag-for="flagFor"
      v-bind="hiddenFacets !== undefined ? { hiddenFacets } : {}"
    />

    <div
      v-if="visibleCards.length === 0"
      class="experience-feed__empty"
    >
      <p class="experience-feed__empty-message">
        Nothing to show here.
      </p>
    </div>

    <div
      v-else
      class="experience-feed__cards"
    >
      <ExperienceCard
        v-for="scored in visibleCards"
        :key="scored.variant.variant_id"
        :variant="scored.variant"
        @open-detail="onCardOpenDetail"
      />
    </div>

    <div
      v-if="visibleCards.length > 0"
      class="experience-feed__pagination"
    >
      <p
        v-if="countLine !== null"
        class="experience-feed__count"
      >
        {{ countLine }}
      </p>
      <button
        v-if="canShowMore"
        type="button"
        class="experience-feed__show-more"
        @click="onShowMore"
      >
        Show more
      </button>
    </div>
  </section>
</template>

<style scoped>
.experience-feed {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.experience-feed__cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.experience-feed__empty {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--space-xl) var(--space-lg);
}

.experience-feed__empty-message {
  margin: 0;
}

.experience-feed__pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.experience-feed__count {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin: 0;
}

.experience-feed__show-more {
  background: transparent;
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-lg);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: border-color var(--duration-fast);
}

.experience-feed__show-more:hover {
  border-color: var(--color-text-primary);
}

.experience-feed__show-more:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 2px;
}
</style>
