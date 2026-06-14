<template>
  <p
    v-if="shouldRenderSlot(slotContent)"
    class="pattern-paragraph"
  >
    <template
      v-for="(segment, i) in scannedSegments"
      :key="i"
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
</template>

<script setup lang="ts">
// PatternParagraph — RENDER.md section 4.4. Current-reading prose, sans
// register and tighter weight than RecognitionParagraph. Empty-SlotContent
// rule via shouldRenderSlot; term indicators inline via the term scanner.
import { computed } from 'vue';
import type { SlotContent } from '../../../synthesis';
import { shouldRenderSlot } from '../../render/should_render_slot';
import { scanTermsInString } from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';

const props = defineProps<{ slotContent: SlotContent }>();

const renderedText = computed<string>(
  () => props.slotContent.interpretive_text ?? props.slotContent.token_text,
);

const scannedSegments = computed(() => scanTermsInString(renderedText.value));
</script>

<style scoped>
.pattern-paragraph {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-text-tertiary);
}
</style>
