<script setup lang="ts">
import { computed } from 'vue';
import { useQuestionnaireStore } from '../../stores/questionnaire';
import type { QuestionDef } from '../../questionnaire/types';

const props = defineProps<{
  question: QuestionDef;
}>();

const store = useQuestionnaireStore();

const selectedValue = computed(() => {
  return store.answers[props.question.id] as string | undefined;
});

function selectOption(value: string): void {
  store.setAnswer(props.question.id, value);
}
</script>

<template>
  <div class="single-select-renderer">
    <p class="single-select-renderer__prompt">{{ question.prompt }}</p>
    <p v-if="question.help" class="single-select-renderer__help">{{ question.help }}</p>
    <div class="single-select-renderer__options">
      <button
        v-for="option in question.options"
        :key="option.value"
        type="button"
        class="single-select-renderer__option"
        :class="{ 'single-select-renderer__option--selected': selectedValue === option.value }"
        :aria-pressed="selectedValue === option.value"
        @click="selectOption(option.value)"
      >
        <span class="single-select-renderer__option-content">
          <span class="single-select-renderer__option-label">{{ option.label }}</span>
          <span v-if="option.help" class="single-select-renderer__option-help">{{ option.help }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.single-select-renderer {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.single-select-renderer__prompt {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
  margin: 0;
}

.single-select-renderer__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.single-select-renderer__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.single-select-renderer__option {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  border: var(--border-hairline) solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--duration-fast), background-color var(--duration-fast);
  min-height: var(--control-height-md);
  display: flex;
  align-items: flex-start;
}

.single-select-renderer__option-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.single-select-renderer__option-label {
  color: var(--color-text-primary);
}

.single-select-renderer__option-help {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: var(--leading-normal);
  font-style: italic;
}

.single-select-renderer__option:hover {
  border-color: var(--color-text-tertiary);
}

.single-select-renderer__option:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.single-select-renderer__option--selected {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
  color: var(--color-text-primary);
}
</style>
