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

const maxChoices = computed(() => {
  return (props.question.config?.max as number) ?? 3;
});

const exclusiveKey = computed(() => {
  return props.question.config?.exclusiveKey as string | undefined;
});

const canSelectMore = computed(() => {
  return selectedValues.value.length < maxChoices.value;
});

function toggleOption(value: string): void {
  const current = selectedValues.value;
  const exclusive = exclusiveKey.value;

  if (value === exclusive) {
    if (current.includes(value)) {
      store.setAnswer(props.question.id, []);
    } else {
      store.setAnswer(props.question.id, [value]);
    }
  } else {
    if (current.includes(value)) {
      store.setAnswer(props.question.id, current.filter((v: string) => v !== value));
    } else if (canSelectMore.value && !current.includes(exclusive || '')) {
      store.setAnswer(props.question.id, [...current, value]);
    }
  }
}
</script>

<template>
  <div class="capped-multi-renderer">
    <p class="capped-multi-renderer__prompt">{{ question.prompt }}</p>
    <p v-if="question.help" class="capped-multi-renderer__help">{{ question.help }}</p>
    <div class="capped-multi-renderer__options">
      <button
        v-for="option in question.options"
        :key="option.value"
        type="button"
        class="capped-multi-renderer__option"
        :class="{ 'capped-multi-renderer__option--selected': selectedValues.includes(option.value) }"
        :aria-pressed="selectedValues.includes(option.value)"
        :disabled="!canSelectMore && !selectedValues.includes(option.value) && option.value !== exclusiveKey"
        @click="toggleOption(option.value)"
      >
        <span class="capped-multi-renderer__option-content">
          <span class="capped-multi-renderer__option-label">{{ option.label }}</span>
          <span v-if="option.help" class="capped-multi-renderer__option-help">{{ option.help }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.capped-multi-renderer {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.capped-multi-renderer__prompt {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
  margin: 0;
}

.capped-multi-renderer__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.capped-multi-renderer__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.capped-multi-renderer__option {
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

.capped-multi-renderer__option-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.capped-multi-renderer__option-label {
  color: var(--color-text-primary);
}

.capped-multi-renderer__option-help {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: var(--leading-normal);
  font-style: italic;
}

.capped-multi-renderer__option:hover:not(:disabled) {
  border-color: var(--color-text-tertiary);
}

.capped-multi-renderer__option:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.capped-multi-renderer__option:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.capped-multi-renderer__option--selected {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
  color: var(--color-text-primary);
}
</style>
