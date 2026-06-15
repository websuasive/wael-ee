<template>
  <section
    class="dashboard-card life-context-panel"
    aria-labelledby="life-context-heading"
  >
    <h2
      id="life-context-heading"
      class="dashboard-card__label"
    >
      {{ headingText }}<PanelHeadingTooltip term="the_current_shape_panel" />
    </h2>

    <p
      v-if="shouldRenderSlot(data.life_stage_summary)"
      class="life-context-panel__paragraph"
    >
      <template
        v-for="(seg, i) in lifeStageSummarySegments"
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

    <p
      v-if="shouldRenderSlot(data.work_load_summary)"
      class="life-context-panel__paragraph"
    >
      <template
        v-for="(seg, i) in workLoadSummarySegments"
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

    <p
      v-if="shouldRenderSlot(data.sociality_summary)"
      class="life-context-panel__paragraph"
    >
      <template
        v-for="(seg, i) in socialitySummarySegments"
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

    <p
      v-if="data.closing_between_shapes && shouldRenderSlot(data.closing_between_shapes)"
      class="life-context-panel__paragraph life-context-panel__closing-line"
    >
      {{ data.closing_between_shapes.interpretive_text ?? data.closing_between_shapes.token_text }}
    </p>

    <p
      v-if="data.closing_mid_process && shouldRenderSlot(data.closing_mid_process)"
      class="life-context-panel__paragraph life-context-panel__closing-line"
    >
      {{ data.closing_mid_process.interpretive_text ?? data.closing_mid_process.token_text }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LifeContextPanel as LifeContextPanelData } from '../../../synthesis';
import { staticCopy } from '../../render/static_copy';
import { shouldRenderSlot } from '../../render/should_render_slot';
import {
  scanTermsInString,
  type TermScanSegment,
} from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';
import PanelHeadingTooltip from '../shared/PanelHeadingTooltip.vue';

const props = defineProps<{ data: LifeContextPanelData }>();

const headingText = staticCopy.life_context_panel_heading;

const lifeStageSummarySegments = computed<TermScanSegment[]>(() => {
  const text =
    props.data.life_stage_summary.interpretive_text ??
    props.data.life_stage_summary.token_text;
  return scanTermsInString(text);
});

const workLoadSummarySegments = computed<TermScanSegment[]>(() => {
  const text =
    props.data.work_load_summary.interpretive_text ??
    props.data.work_load_summary.token_text;
  return scanTermsInString(text);
});

const socialitySummarySegments = computed<TermScanSegment[]>(() => {
  const text =
    props.data.sociality_summary.interpretive_text ??
    props.data.sociality_summary.token_text;
  return scanTermsInString(text);
});
</script>

<style scoped>
.life-context-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  font-family: var(--font-sans);
}

.life-context-panel .dashboard-card__label {
  margin-bottom: 0;
}

.life-context-panel__paragraph {
  margin: 0;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.life-context-panel__closing-line {
  font-style: italic;
  color: var(--color-text-secondary);
}
</style>
