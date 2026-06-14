<script setup lang="ts">
import { computed } from 'vue';
import { useQuestionnaireStore } from '../../stores/questionnaire';
import type { QuestionDef } from '../../questionnaire/types';

const props = defineProps<{
  question: QuestionDef;
}>();

const store = useQuestionnaireStore();

const selectedValues = computed(() => {
  return store.answers[props.question.id] as string[] || [];
});

function toggleOption(value: string): void {
  const current = selectedValues.value;
  if (current.includes(value)) {
    store.setAnswer(props.question.id, current.filter((v) => v !== value));
  } else {
    store.setAnswer(props.question.id, [...current, value]);
  }
}

</script>

<template>
  <div class="tick-any-renderer">
    <p class="tick-any-renderer__prompt">{{ question.prompt }}</p>
    <p v-if="question.help" class="tick-any-renderer__help">{{ question.help }}</p>
    <div class="tick-any-renderer__options">
      <label
        v-for="option in question.options"
        :key="option.value"
        class="tick-any-renderer__option"
      >
        <input
          type="checkbox"
          class="tick-any-renderer__checkbox"
          :checked="selectedValues.includes(option.value)"
          @change="toggleOption(option.value)"
        >
        <span class="tick-any-renderer__label-content">
          <span class="tick-any-renderer__label">{{ option.label }}</span>
          <span v-if="option.help" class="tick-any-renderer__option-help">{{ option.help }}</span>
        </span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.tick-any-renderer {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.tick-any-renderer__prompt {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
  margin: 0;
}

.tick-any-renderer__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.tick-any-renderer__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.tick-any-renderer__option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-xxs) 0;
}

.tick-any-renderer__checkbox {
  margin: 0;
  cursor: pointer;
  accent-color: var(--color-accent);
}

.tick-any-renderer__label-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.tick-any-renderer__label {
  color: var(--color-text-secondary);
}

.tick-any-renderer__option-help {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: var(--leading-normal);
  font-style: italic;
}

</style>
