<template>
  <p
    v-if="sentences.length > 0"
    class="pattern-paragraph"
  >
    <template
      v-for="(sentence, i) in sentences"
      :key="i"
    >
      <template
        v-for="(segment, j) in scanTermsInString(sentence)"
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
      <span v-if="i < sentences.length - 1">&nbsp;</span>
    </template>
  </p>
</template>

<script setup lang="ts">
// PatternParagraph — RENDER.md section 4.4. Current-reading prose, sans
// register and tighter weight than RecognitionParagraph. Renders as a
// flowing paragraph with sentence-level term-scanning.
import { scanTermsInString } from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';

defineProps<{ sentences: string[] }>();
</script>

<style scoped>
.pattern-paragraph {
  margin: 0 0 var(--space-sm) 0;
  font-family: var(--font-sans);
  font-size: var(--text-md);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}
</style>
