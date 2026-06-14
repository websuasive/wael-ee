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
  <div class="felt-renderer">
    <p class="felt-renderer__prompt">{{ question.prompt }}</p>
    <p v-if="question.help" class="felt-renderer__help">{{ question.help }}</p>
    <div class="felt-renderer__options">
      <button
        v-for="option in question.options"
        :key="option.value"
        type="button"
        class="felt-renderer__option"
        :class="{ 'felt-renderer__option--selected': selectedValue === option.value }"
        :aria-pressed="selectedValue === option.value"
        @click="selectOption(option.value)"
      >
        <span class="felt-renderer__option-content">
          <span class="felt-renderer__option-label">{{ option.label }}</span>
          <span v-if="option.help" class="felt-renderer__option-help">{{ option.help }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.felt-renderer {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.felt-renderer__prompt {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  margin: 0;
}

.felt-renderer__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
  font-style: italic;
}

.felt-renderer__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.felt-renderer__option {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  border: var(--border-hairline) solid var(--color-border-secondary);
  border-radius: var(--radius-sm);
  padding: var(--space-xs) var(--space-sm);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--duration-fast);
  min-height: var(--control-height-sm);
  display: flex;
  align-items: flex-start;
}

.felt-renderer__option-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.felt-renderer__option-label {
  color: var(--color-text-primary);
}

.felt-renderer__option-help {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: var(--leading-normal);
  font-style: italic;
}

.felt-renderer__option:hover {
  border-color: var(--color-border-primary);
}

.felt-renderer__option:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.felt-renderer__option--selected {
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}
</style>
