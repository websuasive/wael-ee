<template>
  <section
    class="dashboard-card comparison-surface-panel"
    aria-labelledby="comparison-surface-heading"
  >
    <h2
      id="comparison-surface-heading"
      class="dashboard-card__label"
    >
      {{ headingText }}
    </h2>

    <p
      v-if="shouldRenderSlot(data.summary)"
      class="comparison-surface-panel__summary"
    >
      <template
        v-for="(seg, i) in summarySegments"
        :key="i"
      >
        <TermIndicator
          v-if="seg.kind === 'term'"
          :term="seg.value"
        />
        <template v-else>
          {{ seg.value }}
        </template>
      </template>
    </p>

    <div
      v-if="data.confirmed.length > 0"
      class="comparison-surface-panel__section"
    >
      <h3 class="comparison-surface-panel__section-heading">
        {{ confirmedHeading }}
      </h3>
      <div class="comparison-surface-panel__items">
        <p
          v-for="(item, i) in data.confirmed"
          :key="i"
          class="comparison-surface-panel__item"
        >
          <template
            v-for="(seg, j) in getItemSegments(item)"
            :key="j"
          >
            <TermIndicator
              v-if="seg.kind === 'term'"
              :term="seg.value"
            />
            <template v-else>
              {{ seg.value }}
            </template>
          </template>
        </p>
      </div>
    </div>

    <div
      v-if="data.quiet.length > 0"
      class="comparison-surface-panel__section"
    >
      <h3 class="comparison-surface-panel__section-heading">
        {{ quietHeading }}
      </h3>
      <div class="comparison-surface-panel__items">
        <p
          v-for="(item, i) in data.quiet"
          :key="i"
          class="comparison-surface-panel__item"
        >
          <template
            v-for="(seg, j) in getItemSegments(item)"
            :key="j"
          >
            <TermIndicator
              v-if="seg.kind === 'term'"
              :term="seg.value"
            />
            <template v-else>
              {{ seg.value }}
            </template>
          </template>
        </p>
      </div>
    </div>

    <div
      v-if="data.surfaced.length > 0"
      class="comparison-surface-panel__section"
    >
      <h3 class="comparison-surface-panel__section-heading">
        {{ surfacedHeading }}
      </h3>
      <div class="comparison-surface-panel__items">
        <p
          v-for="(item, i) in data.surfaced"
          :key="i"
          class="comparison-surface-panel__item"
        >
          <template
            v-for="(seg, j) in getItemSegments(item)"
            :key="j"
          >
            <TermIndicator
              v-if="seg.kind === 'term'"
              :term="seg.value"
            />
            <template v-else>
              {{ seg.value }}
            </template>
          </template>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type {
  ComparisonSurfacePanel as ComparisonSurfacePanelData,
  ComparisonItem,
} from '../../../synthesis';
import { staticCopy } from '../../render/static_copy';
import { shouldRenderSlot } from '../../render/should_render_slot';
import {
  scanTermsInString,
  type TermScanSegment,
} from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';

const props = defineProps<{ data: ComparisonSurfacePanelData }>();

const headingText = staticCopy.comparison_surface_panel_heading;
const confirmedHeading = staticCopy.comparison_surface_section_heading_confirmed;
const quietHeading = staticCopy.comparison_surface_section_heading_quiet;
const surfacedHeading = staticCopy.comparison_surface_section_heading_surfaced;

const summarySegments = computed<TermScanSegment[]>(() => {
  const text =
    props.data.summary.interpretive_text ?? props.data.summary.token_text;
  return scanTermsInString(text);
});

function getItemSegments(item: ComparisonItem): TermScanSegment[] {
  const text = item.sentence.interpretive_text ?? item.sentence.token_text;
  return scanTermsInString(text);
}
</script>

<style scoped>
.comparison-surface-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  font-family: var(--font-sans);
}

.comparison-surface-panel .dashboard-card__label {
  margin-bottom: 0;
}

.comparison-surface-panel__summary {
  margin: 0;
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--color-text-secondary);
}

.comparison-surface-panel__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.comparison-surface-panel__section-heading {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.comparison-surface-panel__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.comparison-surface-panel__item {
  margin: 0;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}
</style>
