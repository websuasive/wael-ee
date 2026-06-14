<template>
  <section
    v-if="renderableLines.length > 0"
    :class="[
      'closing-lines',
      renderableLines.length >= 2
        ? 'dashboard-card'
        : 'closing-lines--single',
    ]"
    aria-labelledby="closing-heading"
  >
    <h2
      id="closing-heading"
      :class="
        renderableLines.length >= 2 ? 'dashboard-card__label' : 'sr-only'
      "
    >
      {{ headingText }}
    </h2>
    <p
      v-for="line in renderableLines"
      :key="line.id"
      class="closing-lines__line"
    >
      <template
        v-for="(segment, j) in scannedSegmentsFor(line)"
        :key="j"
      >
        <TermIndicator
          v-if="segment.kind === 'term'"
          :term="segment.value"
        />
        <template v-else>
          {{ segment.value }}
        </template>
      </template>
    </p>
  </section>
</template>

<script setup lang="ts">
// ClosingLines — RENDER.md section 4.10. Section landmark with sr-only h2;
// per-line empty-SlotContent guard via a computed filter; term indicators
// inline via the scanner. Renders nothing if no line passes the guard.
import { computed } from 'vue';
import type { ClosingLine } from '../../../synthesis';
import { staticCopy } from '../../render/static_copy';
import { shouldRenderSlot } from '../../render/should_render_slot';
import {
  scanTermsInString,
  type TermScanSegment,
} from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';

const props = defineProps<{ lines: ClosingLine[] }>();

const headingText = staticCopy.closing_heading;

const renderableLines = computed<ClosingLine[]>(() =>
  props.lines.filter((line) => shouldRenderSlot(line.text)),
);

function scannedSegmentsFor(line: ClosingLine): TermScanSegment[] {
  const text = line.text.interpretive_text ?? line.text.token_text;
  return scanTermsInString(text);
}
</script>

<style scoped>
.closing-lines {
  margin-bottom: var(--space-xl);
}

.closing-lines__line {
  margin: 0 0 var(--space-md) 0;
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
}

.closing-lines__line:last-child {
  margin-bottom: 0;
}

/* Single-line variant: drop the card framing and render as an italic
   centred editorial epigram rather than a placeholder card. */
.closing-lines--single .closing-lines__line {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  font-style: italic;
  color: var(--color-text-secondary);
  margin: 0;
  text-align: center;
}
</style>
