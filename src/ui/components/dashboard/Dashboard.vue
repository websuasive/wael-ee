<template>
  <main
    class="container-dashboard"
    role="main"
    aria-label="Architecture reading"
  >
    <Headline :data="rendering.headline" />
    <RecognitionParagraph :slot-content="rendering.recognition_paragraph" />
    <PatternParagraph :slot-content="rendering.pattern_paragraph" />
    <hr class="dashboard__hero-rule">
    <TheNarrowingsPanel :data="rendering.the_narrowings_panel" />
    <DirectionEvidenceChart
      :data="rendering.direction_evidence_chart"
      :show-inactive="showInactive"
    />
    <button
      v-if="shouldShowToggle"
      type="button"
      class="dashboard__inactive-toggle"
      @click="showInactive = !showInactive"
    >
      {{ showInactive ? 'Hide inactive directions' : 'Show inactive directions' }}
    </button>
    <DirectionCards
      :cards="rendering.direction_cards"
      :show-inactive="showInactive"
    />
    <div class="panel-grid">
      <LifeContextPanel :data="rendering.life_context_panel" />
      <LifeTexturePanel :data="rendering.life_texture_panel" />
      <ConstraintsPanel :data="rendering.constraints_panel" />
      <DomainsPanel :data="rendering.domains_panel" />
    </div>
  </main>
</template>

<script setup lang="ts">
// Dashboard — RENDER.md section 4.1. Top-level container; coordinates the
// shared show-inactive state for the chart and cards sections.
import { computed, ref } from 'vue';
import type { RenderingInstructions } from '../../../synthesis';
import Headline from './Headline.vue';
import RecognitionParagraph from './RecognitionParagraph.vue';
import PatternParagraph from './PatternParagraph.vue';
import DirectionEvidenceChart from './DirectionEvidenceChart.vue';
import DirectionCards from './DirectionCards.vue';
import LifeContextPanel from './LifeContextPanel.vue';
import LifeTexturePanel from './LifeTexturePanel.vue';
import ConstraintsPanel from './ConstraintsPanel.vue';
import DomainsPanel from './DomainsPanel.vue';
import TheNarrowingsPanel from './TheNarrowingsPanel.vue';

const props = defineProps<{ rendering: RenderingInstructions }>();

const showInactive = ref(false);

const activeDirections = computed(() =>
  props.rendering.direction_cards.filter((c) => c.visual_state === 'named'),
);

const shouldShowToggle = computed(
  () =>
    activeDirections.value.length > 0 &&
    activeDirections.value.length < props.rendering.direction_cards.length,
);
</script>

<style scoped>
/* Hero rule — punctuation between the editorial opening (headline,
   recognition, pattern) and the data regions below. Hairline tertiary
   border, generous space top and bottom. No background tint. */
.dashboard__hero-rule {
  border: none;
  border-top: var(--border-hairline) solid var(--color-border-tertiary);
  margin: var(--space-lg) 0 var(--space-xl);
}

.dashboard__inactive-toggle {
  display: block;
  margin: var(--space-md) auto;
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  text-decoration: none;
}

.dashboard__inactive-toggle:hover {
  text-decoration: underline;
}
</style>
