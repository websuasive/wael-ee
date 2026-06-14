<script setup lang="ts">
// LaboratoryDetailView. Per-protocol drill-down page with scoped feed engine.
//
// Validates the protocol param, mounts ExperienceFeed scoped to that protocol,
// owns a detail drawer (local-state driven), and a TermPopover singleton.
// Handles valid-protocol / for-you-placeholder / invalid cases.

import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useActiveReadingStore } from '../stores/activeReading';
import {
  EMPTY_FILTER_STATE,
  type FacetKey,
  type FilterState,
} from '../experience/filter';
import type { Protocol } from '../experience/types';
import ExperienceFeed from '../components/experience/ExperienceFeed.vue';
import ExperienceDetailDrawer from '../components/experience/ExperienceDetailDrawer.vue';
import TermPopover from '../components/shared/TermPopover.vue';

const PROTOCOL_HIDDEN: readonly FacetKey[] = ['protocol'];

const VALID_PROTOCOLS: readonly Protocol[] = [
  'stir',
  'loophole',
  'slip',
  'catch',
  'trespass',
  'aside',
  'steeping',
];

const route = useRoute();
const activeReading = useActiveReadingStore();

const paramRaw = computed(() => {
  const r = route.params['protocol'];
  return typeof r === 'string' ? r : '';
});

type PageKind = 'protocol' | 'for_you' | 'invalid';

const pageKind = computed<PageKind>(() => {
  if (paramRaw.value === 'for-you') return 'for_you';
  if ((VALID_PROTOCOLS as readonly string[]).includes(paramRaw.value)) return 'protocol';
  return 'invalid';
});

const protocol = computed<Protocol | null>(() =>
  pageKind.value === 'protocol' ? (paramRaw.value as Protocol) : null,
);

const scopeFilter = computed<FilterState>(() => {
  if (pageKind.value === 'for_you') {
    return { ...EMPTY_FILTER_STATE };
  }
  return {
    ...EMPTY_FILTER_STATE,
    protocol: protocol.value ? [protocol.value] : [],
  };
});

const hasReading = computed(() => activeReading.isReady);

// Drawer is local-state driven (not route-driven) on protocol pages.
// This is deliberately simpler than ExperienceLayer's routed drawer.
const drawerVariantId = ref<string | null>(null);

function onOpenDetail(variantId: string): void {
  drawerVariantId.value = variantId;
}

function onCloseDrawer(): void {
  drawerVariantId.value = null;
}

const displayLabel = computed<string>(() => {
  if (pageKind.value === 'invalid') return 'Not found';
  const p = paramRaw.value;
  if (p === 'for-you') return 'For You';
  return p.charAt(0).toUpperCase() + p.slice(1);
});
</script>

<template>
  <main class="laboratory-detail-view" role="main" aria-label="Laboratory detail">
    <section class="laboratory-detail-view__content">
      <RouterLink
        to="/laboratory"
        class="laboratory-detail-view__back-link"
      >
        Back to laboratory
      </RouterLink>

      <h1 class="laboratory-detail-view__title">
        {{ displayLabel }}
      </h1>

      <div v-if="pageKind === 'invalid'" class="laboratory-detail-view__invalid">
        <p class="laboratory-detail-view__invalid-message">
          That protocol doesn't exist.
        </p>
      </div>

      <div v-else-if="pageKind === 'for_you'">
        <div v-if="!hasReading" class="laboratory-detail-view__empty">
          <p class="laboratory-detail-view__empty-message">
            You need an active reading to see experiences.
          </p>
          <RouterLink
            to="/assessment"
            class="laboratory-detail-view__empty-link"
          >
            Start assessment
          </RouterLink>
        </div>

        <ExperienceFeed
          v-if="hasReading"
          :scope-filter="scopeFilter"
          :show-filters="true"
          @open-detail="onOpenDetail"
        />
      </div>

      <div v-else-if="pageKind === 'protocol'">
        <div v-if="!hasReading" class="laboratory-detail-view__empty">
          <p class="laboratory-detail-view__empty-message">
            You need an active reading to see experiences.
          </p>
          <RouterLink
            to="/assessment"
            class="laboratory-detail-view__empty-link"
          >
            Start assessment
          </RouterLink>
        </div>

        <ExperienceFeed
          v-if="hasReading"
          :scope-filter="scopeFilter"
          :show-filters="true"
          :hidden-facets="PROTOCOL_HIDDEN"
          @open-detail="onOpenDetail"
        />
      </div>
    </section>

    <ExperienceDetailDrawer
      v-if="drawerVariantId !== null"
      :variant-id="drawerVariantId"
      @close="onCloseDrawer"
    />

    <TermPopover />
  </main>
</template>

<style scoped>
.laboratory-detail-view {
  width: 100%;
}

.laboratory-detail-view__content {
  max-width: var(--content-narrow-width);
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-lg);
}

.laboratory-detail-view__back-link {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-accent);
  text-decoration: none;
  display: inline-block;
  margin-bottom: var(--space-lg);
}

.laboratory-detail-view__back-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.laboratory-detail-view__back-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.laboratory-detail-view__title {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-md);
  line-height: var(--leading-snug);
}

.laboratory-detail-view__invalid,
.laboratory-detail-view__empty {
  margin-top: var(--space-lg);
}

.laboratory-detail-view__invalid-message,
.laboratory-detail-view__empty-message {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0 0 var(--space-md);
}

.laboratory-detail-view__empty-link {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-accent);
  text-decoration: none;
}

.laboratory-detail-view__empty-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.laboratory-detail-view__empty-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
</style>
