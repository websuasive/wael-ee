<script setup lang="ts">
import { computed } from 'vue';
import { useQuestionnaireStore } from '../../stores/questionnaire';
import type { QuestionDef } from '../../questionnaire/types';

const props = defineProps<{
  question: QuestionDef;
}>();

const store = useQuestionnaireStore();

const value = computed(() => {
  return store.answers[props.question.id] as number | undefined;
});

const min = computed(() => {
  return (props.question.config?.sliderMin as number) ?? 0;
});

const max = computed(() => {
  return (props.question.config?.sliderMax as number) ?? 100;
});

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  store.setAnswer(props.question.id, Number(target.value));
}
</script>

<template>
  <div class="slider-renderer">
    <p class="slider-renderer__prompt">{{ question.prompt }}</p>
    <p v-if="question.help" class="slider-renderer__help">{{ question.help }}</p>
    <div class="slider-renderer__control">
      <input
        type="range"
        class="slider-renderer__input"
        :min="min"
        :max="max"
        :value="value ?? min"
        @input="handleInput"
      >
      <div class="slider-renderer__labels">
        <span v-if="question.config?.minLabel" class="slider-renderer__label slider-renderer__label--left">
          {{ question.config.minLabel }}
        </span>
        <span v-if="question.config?.maxLabel" class="slider-renderer__label slider-renderer__label--right">
          {{ question.config.maxLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slider-renderer {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.slider-renderer__prompt {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
  margin: 0;
}

.slider-renderer__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.slider-renderer__control {
  padding: var(--space-sm) 0;
}

.slider-renderer__labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-xs);
}

.slider-renderer__label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.slider-renderer__label--left {
  text-align: left;
}

.slider-renderer__label--right {
  text-align: right;
}

.slider-renderer__input {
  width: 100%;
  height: var(--control-height-md);
  cursor: pointer;
  appearance: none;
  background: transparent;
}

.slider-renderer__input::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: var(--color-border-tertiary);
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.slider-renderer__input::-moz-range-track {
  width: 100%;
  height: 4px;
  background: var(--color-border-tertiary);
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.slider-renderer__input::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  margin-top: -8px;
  transition: background-color var(--duration-fast);
}

.slider-renderer__input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: background-color var(--duration-fast);
}

.slider-renderer__input:focus-visible {
  outline: none;
}

.slider-renderer__input:focus-visible::-webkit-slider-thumb {
  box-shadow: var(--shadow-focus);
}

.slider-renderer__input:focus-visible::-moz-range-thumb {
  box-shadow: var(--shadow-focus);
}
</style>
