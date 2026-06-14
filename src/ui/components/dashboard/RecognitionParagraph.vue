<template>
  <p
    v-if="shouldRenderSlot(slotContent)"
    class="recognition-paragraph"
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
// RecognitionParagraph — RENDER.md section 4.3. Identity-level prose,
// serif register. Empty-SlotContent rule via shouldRenderSlot; term
// indicators inline via the term scanner.
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
.recognition-paragraph {
  margin: 0 0 var(--space-sm) 0;
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  line-height: 1.45;
  color: var(--color-text-primary);
}
</style>
