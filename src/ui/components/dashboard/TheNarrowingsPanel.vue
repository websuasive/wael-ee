<template>
  <section
    class="dashboard-card narrowings-panel"
    aria-labelledby="narrowings-heading"
  >
    <h2
      id="narrowings-heading"
      class="dashboard-card__label"
    >
      {{ headingText }}<PanelHeadingTooltip term="the_narrowings_panel" />
    </h2>

    <ul
      class="narrowings-panel__bands"
      role="list"
    >
      <li
        v-for="(band, i) in sortedBands"
        :key="i"
        class="narrowings-panel__band-row"
        role="listitem"
      >
        <span class="narrowings-panel__band-name">
          <TermIndicator :term="band.band_field" :heading="`${band.full_name} · ${band.character_name}`">
            {{ band.display_name }}
          </TermIndicator>
        </span>
        <span class="narrowings-panel__observation">
          {{ band.observation }}
        </span>
        <span
          class="narrowings-panel__pill"
          :class="`narrowings-panel__pill--${band.band}`"
        >
          {{ band.band }}
        </span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TheNarrowingsPanel as TheNarrowingsPanelData } from '../../../synthesis';
import { staticCopy } from '../../render/static_copy';
import TermIndicator from '../shared/TermIndicator.vue';
import PanelHeadingTooltip from '../shared/PanelHeadingTooltip.vue';

const props = defineProps<{ data: TheNarrowingsPanelData }>();

const headingText = staticCopy.the_narrowings_panel_heading;

// Canonical narrowing order for sorting within intensity groups
const NARROWING_ORDER: Record<string, number> = {
  structural: 0,
  experiential: 1,
  psychological: 2,
  identity: 3,
  energetic: 4,
  relational: 5,
  attention: 6,
};

// Sort by intensity (high, low, moderate), then by canonical order within each group
const sortedBands = computed(() => {
  const bands = [...props.data.bands];
  return bands.sort((a, b) => {
    // Intensity order: high (100), low (33), moderate (66)
    const intensityOrder: Record<string, number> = { high: 0, low: 1, moderate: 2 };
    const aIntensityRank = intensityOrder[a.band] ?? 999;
    const bIntensityRank = intensityOrder[b.band] ?? 999;
    
    if (aIntensityRank !== bIntensityRank) {
      return aIntensityRank - bIntensityRank;
    }
    
    // Within same intensity, preserve canonical narrowing order
    const aOrder = NARROWING_ORDER[a.band_field] ?? 999;
    const bOrder = NARROWING_ORDER[b.band_field] ?? 999;
    return aOrder - bOrder;
  });
});
</script>

<style scoped>
.narrowings-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  font-family: var(--font-sans);
}

.narrowings-panel .dashboard-card__label {
  margin-bottom: 0;
}

.narrowings-panel__bands {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.narrowings-panel__band-row {
  display: grid;
  grid-template-columns: 140px 1fr 80px;
  align-items: start;
  gap: var(--space-sm);
}

.narrowings-panel__band-name {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.narrowings-panel__observation {
  font-size: var(--text-base);
  color: var(--color-text-primary);
  line-height: 1.5;
}

.narrowings-panel__pill {
  display: inline-block;
  border-radius: var(--radius-md);
  padding-inline: var(--space-xs);
  padding-block: var(--space-xxs);
  font-size: var(--text-sm);
  white-space: nowrap;
  justify-self: end;
}

.narrowings-panel__pill--low {
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
}

.narrowings-panel__pill--moderate {
  background: var(--color-pill-moderate-bg);
  color: var(--color-pill-moderate-text);
}

.narrowings-panel__pill--high {
  background: var(--color-pill-high-bg);
  color: var(--color-pill-high-text);
}
</style>
