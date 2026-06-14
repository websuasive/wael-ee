<template>
  <section
    class="dashboard-card domains-panel"
    aria-labelledby="domains-heading"
  >
    <h2
      id="domains-heading"
      class="dashboard-card__label"
    >
      {{ headingText }}<PanelHeadingTooltip term="whats_reduced_panel" />
    </h2>

    <dl
      v-if="data.reduced_groups.length > 0"
      class="domains-panel__groups"
    >
      <div
        v-for="group in data.reduced_groups"
        :key="group.value_engine_name"
        class="domains-panel__group"
      >
        <dt class="domains-panel__group-label">
          {{ group.value_label }}
        </dt>
        <dd
          v-if="group.value_engine_name === 'never_been_part_of_his_life'"
          class="domains-panel__list"
        >
          {{ group.domains.map(d => d.domain_name).join(', ') }}
        </dd>
        <dd
          v-else
          class="domains-panel__bars"
        >
          <div
            v-for="domain in group.domains"
            :key="domain.domain_name"
            class="domains-panel__bar-row"
          >
            <span class="domains-panel__domain-name">
              {{ domain.domain_name }}
            </span>
            <div
              class="domains-panel__bar-track"
              role="progressbar"
              :aria-valuemin="0"
              :aria-valuemax="100"
              :aria-valuenow="domain.intensity"
              :aria-valuetext="`${domain.domain_name}: ${domain.intensity}% reduced`"
            >
              <div
                class="domains-panel__bar-fill"
                :style="{ width: `${domain.intensity}%` }"
              />
            </div>
          </div>
        </dd>
      </div>
    </dl>

    <div
      v-if="shouldRenderSlot(data.intact_callout)"
      class="domains-panel__group domains-panel__group--non-reduced"
    >
      <div class="domains-panel__group-label">
        Intact
      </div>
      <div class="domains-panel__list">
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
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// DomainsPanel — RENDER.md section 4.8. Section landmark + visible h2;
// reduced_groups as a definition list; intact_callout and summary as prose
// slots routed through the term scanner. No scanner on display-name
// identifiers (value_label, domain names) per RENDER.md section 5.4.
import { computed } from 'vue';
import type { DomainsPanel as DomainsPanelData } from '../../../synthesis';
import { staticCopy } from '../../render/static_copy';
import { shouldRenderSlot } from '../../render/should_render_slot';
import {
  scanTermsInString,
  type TermScanSegment,
} from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';
import PanelHeadingTooltip from '../shared/PanelHeadingTooltip.vue';

const props = defineProps<{ data: DomainsPanelData }>();

const headingText = staticCopy.domains_panel_heading;

const intactCalloutSegments = computed<TermScanSegment[]>(() => {
  const text =
    props.data.intact_callout.interpretive_text ??
    props.data.intact_callout.token_text;
  return scanTermsInString(text);
});

</script>

<style scoped>
.domains-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  font-family: var(--font-sans);
}

/* Flex gap supplies spacing between items; the shared label's own
   margin-bottom would double up with it. */
.domains-panel .dashboard-card__label {
  margin-bottom: 0;
}

.domains-panel__groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin: 0;
  padding: 0;
}

.domains-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.domains-panel__group-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  margin: 0;
}

.domains-panel__bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
}

.domains-panel__bar-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: var(--space-sm);
  align-items: center;
}

.domains-panel__domain-name {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.domains-panel__bar-track {
  height: 6px;
  background: var(--color-border-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.domains-panel__bar-fill {
  height: 100%;
  background: var(--color-constraint-bar);
  border-radius: 3px;
  transition: width 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  .domains-panel__bar-fill {
    transition: none;
  }
}

.domains-panel__group--non-reduced {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.domains-panel__list {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}
</style>
