<template>
  <section
    class="dashboard-card constraints-panel"
    aria-labelledby="constraints-heading"
  >
    <h2
      id="constraints-heading"
      class="dashboard-card__label"
    >
      {{ headingText }}<PanelHeadingTooltip term="whats_heavy_panel" />
    </h2>

    <dl
      v-if="data.constraint_lines.length > 0"
      class="constraints-panel__lines"
    >
      <div
        v-for="line in data.constraint_lines"
        :key="line.constraint_engine_name"
        class="constraints-panel__line"
      >
        <dt class="constraints-panel__name">
          {{ line.constraint_name }}
        </dt>
        <div class="constraints-panel__bar-column">
          <div
            class="constraints-panel__bar-track"
            role="progressbar"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="line.intensity"
            :aria-valuetext="`${line.constraint_name}: ${line.band_label}`"
          >
            <div
              class="constraints-panel__bar-fill"
              :style="{ width: `${line.intensity}%` }"
            />
          </div>
          <dd
            v-if="shouldRenderSlot(line.sentence)"
            class="constraints-panel__sentence"
          >
            <template
              v-for="(seg, i) in lineSentenceSegments(line)"
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
          </dd>
        </div>
      </div>
    </dl>

    <p
      v-if="shouldRenderSlot(data.intact_callout)"
      class="constraints-panel__intact"
    >
      <template
        v-for="(seg, i) in intactCalloutSegments"
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
      v-if="shouldRenderSlot(data.summary)"
      class="constraints-panel__summary"
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
  </section>
</template>

<script setup lang="ts">
// ConstraintsPanel — RENDER.md section 4.9 (with permission_sub_shape_text
// hoisted to panel level per Phase 0 amendment). sustained_constraint_intensity
// is intentionally not rendered — section 4.9's render targets exclude it.
// Term scanner runs on band_labels, permission_sub_shape_text, intact_callout,
// and summary. constraint_name (display-name) is not scanned per section 5.4.
import { computed } from 'vue';
import type { ConstraintsPanel as ConstraintsPanelData, SlotContent } from '../../../synthesis';
import { staticCopy } from '../../render/static_copy';
import { shouldRenderSlot } from '../../render/should_render_slot';
import {
  scanTermsInString,
  type TermScanSegment,
} from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';
import PanelHeadingTooltip from '../shared/PanelHeadingTooltip.vue';

const props = defineProps<{ data: ConstraintsPanelData }>();

const headingText = staticCopy.constraints_panel_heading;

const lineSentenceSegments = (line: { sentence: SlotContent }): TermScanSegment[] => {
  const text = line.sentence.interpretive_text ?? line.sentence.token_text;
  return scanTermsInString(text);
};

const intactCalloutSegments = computed<TermScanSegment[]>(() => {
  const text =
    props.data.intact_callout.interpretive_text ??
    props.data.intact_callout.token_text;
  return scanTermsInString(text);
});

const summarySegments = computed<TermScanSegment[]>(() => {
  const text =
    props.data.summary.interpretive_text ?? props.data.summary.token_text;
  return scanTermsInString(text);
});
</script>

<style scoped>
.constraints-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  font-family: var(--font-sans);
}

/* Flex gap supplies spacing between items; the shared label's own
   margin-bottom would double up with it. */
.constraints-panel .dashboard-card__label {
  margin-bottom: 0;
}

.constraints-panel__lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
}

.constraints-panel__line {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: var(--space-sm);
  align-items: start;
}

.constraints-panel__name {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  margin: 0;
}

.constraints-panel__bar-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.constraints-panel__bar-track {
  height: 6px;
  background: var(--color-border-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.constraints-panel__bar-fill {
  height: 100%;
  background: var(--color-constraint-bar);
  border-radius: 3px;
  transition: width 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  .constraints-panel__bar-fill {
    transition: none;
  }
}

.constraints-panel__sentence {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-style: italic;
}

.constraints-panel__intact {
  margin: 0;
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--color-text-secondary);
}

.constraints-panel__summary {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
</style>
