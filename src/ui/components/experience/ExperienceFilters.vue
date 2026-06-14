<script setup lang="ts">
// ExperienceFilters. Per EXPERIENCE.md sections 4.2, 8, 9.
//
// Filter sidebar (desktop) / drawer body (mobile). v-model:filter-state
// two-way binding with BrowseList; the parent owns the live FilterState.
//
// Per §8: filters compose AND across facets, OR within a facet; live
// counts via computeFilterCounts; collapsible sections with Direction +
// Context expanded by default; "Reset filters" button at the top.
//
// Display labels: facet headings come from experienceCopy.filter_label_*.
// Facet value labels are looked up centrally via valueLabelFor (E.3d) so
// the sidebar, the active-chip row in BrowseList, and any future surface
// share one source of truth.

import { computed, ref } from 'vue';
import type { RecommendableVariant } from '../../experience/types';
import {
  computeFilterCounts,
  FACET_KEYS,
  type FacetKey,
  type FilterState,
  type FlagLookup,
} from '../../experience/filter';
import { experienceCopy } from '../../experience/data/static_copy';
import { valueLabelFor } from '../../experience/data/value_labels';

const props = defineProps<{
  filterState: FilterState;
  variants: readonly RecommendableVariant[];
  flagFor: FlagLookup;
  hiddenFacets?: readonly FacetKey[];
}>();

const emit = defineEmits<{
  'update:filterState': [state: FilterState];
}>();

const expanded = ref<Record<FacetKey, boolean>>({
  direction: true,
  protocol: false,
  exertion: false,
  cost_tier: false,
  interest_domain: false,
  status: false,
});

const counts = computed(() =>
  computeFilterCounts(props.variants, props.filterState, props.flagFor),
);

// Backwards-compatible: when hiddenFacets is omitted, all facets are visible.
const visibleFacets = computed<readonly FacetKey[]>(() =>
  FACET_KEYS.filter((f) => !(props.hiddenFacets ?? []).includes(f)),
);

const FACET_HEADING_COPY: Record<FacetKey, string> = {
  direction: experienceCopy.filter_label_direction,
  protocol: 'Protocol',
  exertion: 'Exertion',
  cost_tier: experienceCopy.filter_label_cost_tier,
  interest_domain: experienceCopy.filter_label_interest_domain,
  status: experienceCopy.filter_label_status,
};

function toggleSection(facet: FacetKey): void {
  expanded.value[facet] = !expanded.value[facet];
}

// Exertion's filter values are numbers (FilterState.exertion: number[]);
// every other facet is string-valued. The checkbox loop yields strings
// (Object.keys), so coerce exertion back to a number before it enters
// FilterState, or matchesFacet's number comparison fails.
function typedFacetValue(facet: FacetKey, value: string): string | number {
  return facet === 'exertion' ? Number(value) : value;
}

function isSelected(facet: FacetKey, value: string): boolean {
  const current = props.filterState[facet] as readonly (string | number)[];
  return current.includes(typedFacetValue(facet, value));
}

function toggleValue(facet: FacetKey, value: string): void {
  const typed = typedFacetValue(facet, value);
  const current = props.filterState[facet] as readonly (string | number)[];
  const next = current.includes(typed)
    ? current.filter((v) => v !== typed)
    : [...current, typed];
  // Spread parent state then overwrite the changed facet. The cast is
  // necessary because FilterState's facet values are typed as specific
  // string unions; the runtime values flow through unchanged.
  const updated = { ...props.filterState, [facet]: next } as FilterState;
  emit('update:filterState', updated);
}

function reset(): void {
  const cloned: FilterState = {
    direction: [],
    protocol: [],
    exertion: [],
    cost_tier: [],
    interest_domain: [],
    status: [],
  };
  emit('update:filterState', cloned);
}

// Sorted facet values per facet for stable rendering. Iterates the counts
// map and sorts keys lexicographically.
function sortedValues(facet: FacetKey): string[] {
  const facetCounts = counts.value[facet];
  return Object.keys(facetCounts).sort();
}
</script>

<template>
  <aside
    class="experience-filters"
    aria-label="Browse filters"
  >
    <header class="experience-filters__top">
      <button
        type="button"
        class="experience-filters__reset"
        @click="reset"
      >
        {{ experienceCopy.browse_reset_filters }}
      </button>
    </header>

    <section
      v-for="facet in visibleFacets"
      :key="facet"
      class="experience-filters__section"
    >
      <button
        type="button"
        class="experience-filters__section-header"
        :aria-expanded="expanded[facet]"
        @click="toggleSection(facet)"
      >
        <span class="experience-filters__section-title">
          {{ FACET_HEADING_COPY[facet] }}
          <span
            v-if="filterState[facet].length > 0"
            class="experience-filters__selected-count"
          >({{ filterState[facet].length }})</span>
        </span>
        <span
          class="experience-filters__chevron"
          :class="{ 'experience-filters__chevron--expanded': expanded[facet] }"
          aria-hidden="true"
        >&rsaquo;</span>
      </button>

      <ul
        v-if="expanded[facet]"
        class="experience-filters__values"
      >
        <li
          v-for="value in sortedValues(facet)"
          :key="value"
          class="experience-filters__value-row"
        >
          <label class="experience-filters__value">
            <input
              type="checkbox"
              class="experience-filters__checkbox"
              :checked="isSelected(facet, value)"
              @change="toggleValue(facet, value)"
            >
            <span class="experience-filters__value-label">{{ valueLabelFor(facet, value) }}</span>
            <span class="experience-filters__count">({{ counts[facet][value] }})</span>
          </label>
        </li>
      </ul>
    </section>
  </aside>
</template>

<style scoped>
/*
 * Width is owned by the parent container (the BrowseList sidebar slot
 * sets a fixed pixel width; the mobile drawer body lets it fill).
 * Do not set width here — it conflicts with parent flex sizing rules.
 */
.experience-filters {
  font-family: var(--font-sans);
}

.experience-filters__top {
  margin-bottom: var(--space-md);
}

.experience-filters__reset {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-sm);
  padding: var(--space-xs) var(--space-md);
  cursor: pointer;
  transition: border-color var(--duration-fast);
}

.experience-filters__reset:hover {
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
}

.experience-filters__reset:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 1px;
}

.experience-filters__section {
  border-bottom: var(--border-hairline) solid var(--color-border-tertiary);
}

.experience-filters__section-header {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: var(--space-sm) 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
}

.experience-filters__section-header:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 1px;
}

.experience-filters__chevron {
  color: var(--color-text-tertiary);
  font-size: var(--text-base);
  transition: transform var(--duration-fast);
  display: inline-block;
}

.experience-filters__chevron--expanded {
  transform: rotate(90deg);
}

.experience-filters__values {
  list-style: none;
  margin: 0;
  padding: 0 0 var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.experience-filters__value {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-xxs) 0;
}

.experience-filters__checkbox {
  margin: 0;
  cursor: pointer;
}

.experience-filters__value-label {
  flex: 1;
}

.experience-filters__count {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}

.experience-filters__section-title {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.experience-filters__selected-count {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-regular);
}
</style>
