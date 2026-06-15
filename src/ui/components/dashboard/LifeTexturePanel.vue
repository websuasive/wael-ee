<template>
  <section
    class="dashboard-card life-texture-panel"
    aria-labelledby="life-texture-heading"
  >
    <h2
      id="life-texture-heading"
      class="dashboard-card__label"
    >
      {{ headingText }}<PanelHeadingTooltip term="the_weeks_texture_panel" />
    </h2>

    <p
      v-if="shouldRenderSlot(data.summary)"
      class="life-texture-panel__summary"
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

    <p class="life-texture-panel__annotation">
      {{ data.band_label }}, {{ data.load_state_label }}
    </p>

    <div
      v-if="data.flags_present.length > 0"
      class="life-texture-panel__chip-group"
    >
      <span class="life-texture-panel__chip-label">Present:</span>
      <ul
        class="life-texture-panel__chips"
        role="list"
      >
        <li
          v-for="(flag, i) in data.flags_present"
          :key="i"
          class="life-texture-panel__chip life-texture-panel__chip--present"
          role="listitem"
        >
          {{ flag }}
        </li>
      </ul>
    </div>

    <div
      v-if="data.flags_absent.length > 0"
      class="life-texture-panel__chip-group"
    >
      <span class="life-texture-panel__chip-label">Absent:</span>
      <ul
        class="life-texture-panel__chips"
        role="list"
      >
        <li
          v-for="(flag, i) in data.flags_absent"
          :key="i"
          class="life-texture-panel__chip life-texture-panel__chip--absent"
          role="listitem"
        >
          {{ flag }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LifeTexturePanel as LifeTexturePanelData } from '../../../synthesis';
import { staticCopy } from '../../render/static_copy';
import { shouldRenderSlot } from '../../render/should_render_slot';
import {
  scanTermsInString,
  type TermScanSegment,
} from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';
import PanelHeadingTooltip from '../shared/PanelHeadingTooltip.vue';

const props = defineProps<{ data: LifeTexturePanelData }>();

const headingText = staticCopy.life_texture_panel_heading;

const summarySegments = computed<TermScanSegment[]>(() => {
  const text =
    props.data.summary.interpretive_text ?? props.data.summary.token_text;
  return scanTermsInString(text);
});
</script>

<style scoped>
.life-texture-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  font-family: var(--font-sans);
}

.life-texture-panel .dashboard-card__label {
  margin-bottom: 0;
}

.life-texture-panel__summary {
  margin: 0;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.life-texture-panel__annotation {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.life-texture-panel__chip-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.life-texture-panel__chip-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.life-texture-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.life-texture-panel__chip {
  display: inline-block;
  padding-inline: var(--space-xs);
  padding-block: var(--space-xxs);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.life-texture-panel__chip--present {
  background: var(--color-background-secondary);
  border: var(--border-hairline) solid var(--color-border-tertiary);
  color: var(--color-text-primary);
}

.life-texture-panel__chip--absent {
  background: var(--color-background-secondary);
  border: var(--border-hairline) solid var(--color-border-tertiary);
  color: var(--color-text-tertiary);
}
</style>
