<script setup lang="ts">
// ExperienceCard (v3). Core card unit for all three surfaces.

import { computed, ref } from 'vue';
import { useExperienceStatusStore } from '../../experience/status_store';
import type { RecommendableVariant } from '../../experience/types';
import { experienceCopy } from '../../experience/data/static_copy';
import { valueLabelFor } from '../../experience/data/value_labels';
import ExperienceCardActionMenu from './ExperienceCardActionMenu.vue';

const props = defineProps<{
  variant: RecommendableVariant;
}>();

const emit = defineEmits<{ 'open-detail': [variantId: string] }>();

const statusStore = useExperienceStatusStore();
const currentFlag = computed(() => statusStore.flagFor(props.variant.variant_id));

const pitchSummary = computed<string>(() => {
  const text = props.variant.pitch;
  const firstStop = text.search(/[.!?]/);
  const bySentence = firstStop !== -1 ? text.slice(0, firstStop + 1) : null;
  const words = text.split(/\s+/);
  const byWords = words.length > 25 ? words.slice(0, 25).join(' ') + '...' : text;
  if (bySentence === null) return byWords;
  return bySentence.length <= byWords.length ? bySentence : byWords;
});

type CopyLookup = Record<string, string>;
const copyLookup = experienceCopy as unknown as CopyLookup;

function lookupOr(key: string, fallback: string): string {
  return copyLookup[key] ?? fallback;
}

const facetBadges = computed(() => {
  const v = props.variant;
  const costLabel = lookupOr(`cost_tier_${v.cost_tier}`, v.cost_tier);
  const magnitudeLabel = lookupOr(`magnitude_${v.magnitude}`, v.magnitude);
  const protocolLabel = lookupOr(`protocol_${v.protocol}`, v.protocol);
  const exertionLabel = valueLabelFor('exertion', String(v.exertion));
  const firstWhoWith = v.who_with[0] ?? 'solo';
  const whoWithLabel = lookupOr(`who_with_${firstWhoWith}`, firstWhoWith);
  return [
    { kind: 'cost_tier', label: costLabel },
    { kind: 'magnitude', label: magnitudeLabel },
    { kind: 'protocol', label: protocolLabel },
    { kind: 'exertion', label: exertionLabel },
    { kind: 'who_with', label: whoWithLabel },
  ];
});

const flagDisplayLabel = computed<string | null>(() => {
  const f = currentFlag.value;
  if (f === null) return null;
  return lookupOr(`flag_${f.flag}`, f.flag);
});

const menuOpen = ref(false);

function onCardClick() {
  if (menuOpen.value) {
    menuOpen.value = false;
    return;
  }
  emit('open-detail', props.variant.variant_id);
}

function onMenuTriggerClick(event: MouseEvent) {
  event.stopPropagation();
  menuOpen.value = !menuOpen.value;
}
</script>

<template>
  <article
    class="experience-card"
    @click="onCardClick"
  >
    <div class="experience-card__top">
      <h3 class="experience-card__name">
        {{ variant.label }}
      </h3>
      <div class="experience-card__top-right">
        <span
          v-if="flagDisplayLabel !== null"
          class="experience-card__status-indicator"
          :data-flag="currentFlag?.flag"
        >
          {{ flagDisplayLabel }}
        </span>
        <button
          type="button"
          class="experience-card__menu-trigger"
          :aria-expanded="menuOpen"
          :aria-label="experienceCopy.action_menu_trigger_label"
          @click="onMenuTriggerClick"
        >
          <span aria-hidden="true">&#x22EF;</span>
        </button>
        <ExperienceCardActionMenu
          v-if="menuOpen"
          :variant-id="variant.variant_id"
          :current-flag="currentFlag?.flag ?? null"
          @close="menuOpen = false"
        />
      </div>
    </div>

    <p class="experience-card__description">
      {{ pitchSummary }}
    </p>

    <div class="experience-card__facets">
      <span
        v-for="badge in facetBadges"
        :key="badge.kind"
        class="experience-card__facet-badge"
      >
        {{ badge.label }}
      </span>
    </div>
  </article>
</template>

<style scoped>
.experience-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-md);
  background: var(--color-background-primary);
  cursor: pointer;
  position: relative;
  transition:
    opacity var(--duration-fast),
    border-color var(--duration-fast);
}

.experience-card:hover {
  border-color: var(--color-text-tertiary);
}

.experience-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.experience-card__name {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  line-height: var(--leading-snug);
}

.experience-card__top-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
  position: relative;
}

.experience-card__status-indicator {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  padding: var(--space-xxs) var(--space-sm);
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.experience-card__menu-trigger {
  background: transparent;
  border: none;
  font-size: var(--text-lg);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: var(--space-xs) var(--space-sm);
  line-height: 1;
  min-width: var(--control-height-sm);
  min-height: var(--control-height-sm);
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast);
}

.experience-card__menu-trigger:hover {
  color: var(--color-text-primary);
}

.experience-card__menu-trigger:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: -2px;
}

.experience-card__description {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.experience-card__facets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.experience-card__facet-badge {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  padding: var(--space-xxs) var(--space-sm);
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}
</style>
